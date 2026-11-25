import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import { obtenerHoyChile } from '../utils/fechaChile';
import { aplanarDiagnosticos, incluirDiagnosticos } from '../utils/aplanarDiagnosticos';

//? datos del profesional que se devuelven en los listados de controles
const incluirProfesional = { select: { nombre: true, apellido: true, estamento: true } } as const;

type ConDiagnosticos = Parameters<typeof aplanarDiagnosticos>[0];

//* aplana los diagnosticos del control y los de su paciente
const aplanarControlYPaciente = <C extends ConDiagnosticos, P extends ConDiagnosticos>(control: C, paciente: P) => ({
    ...aplanarDiagnosticos(control),
    paciente: aplanarDiagnosticos(paciente),
});

//* el control y sus diagnosticos se crean en una sola escritura
export const crearControl = async (datosControl: Prisma.ControlClinicoUncheckedCreateInput, diagnosticosIds: number[]) => {

    const control = await prisma.controlClinico.create({
        data: {
            ...datosControl,
            diagnosticosRel: { createMany: { data: diagnosticosIds.map((id_diagnostico) => ({ id_diagnostico })) } },
        },
        include: incluirDiagnosticos,
    });

    return aplanarDiagnosticos(control);
}

export const buscarControl = async () => {
    const controles = await prisma.controlClinico.findMany({
        include: {
            paciente: { include: incluirDiagnosticos },
            Profesional: incluirProfesional,
            ...incluirDiagnosticos,
        },
        orderBy: {
            fecha_control: 'desc'
        }
    });
    return controles.map(({ paciente, ...control }) => aplanarControlYPaciente(control, paciente));
}

export const buscarControlPorRut = async (rutPaciente: string) => {

    const controles = await prisma.controlClinico.findMany({
        where: {
            rut_paciente: rutPaciente,
        },
        include: {
            Profesional: incluirProfesional,
            ...incluirDiagnosticos,
        },
        orderBy: {
            fecha_control: 'desc'
        }
    });
    return controles.map(aplanarDiagnosticos);
}

export const eliminarControl = async (idControl: number) => {

    return await prisma.controlClinico.delete({
        where: {
            id_control: idControl
        }
    })
}

//? diagnosticosIds: undefined = no tocar los diagnosticos, lista = reemplaza el conjunto completo
export const editarControl = async (idControl: number, datosControl: Prisma.ControlClinicoUncheckedUpdateInput, diagnosticosIds?: number[]) => {

    const control = await prisma.controlClinico.update({
        where: {
            id_control: idControl,
        },
        data: {
            ...datosControl,
            ...(diagnosticosIds !== undefined
                ? {
                    diagnosticosRel: {
                        deleteMany: {},
                        createMany: { data: diagnosticosIds.map((id_diagnostico) => ({ id_diagnostico })) },
                    },
                }
                : {}),
        },
        include: incluirDiagnosticos,
    });

    return aplanarDiagnosticos(control);
}

export const buscarControlPorId = async (idControl: number) => {
    const encontrado = await prisma.controlClinico.findUnique({
        where: { id_control: idControl },
        include: {
            paciente: {
                include: { tutor: true, ...incluirDiagnosticos }
            },
            Profesional: true,
            ...incluirDiagnosticos,
        }
    });
    if (!encontrado) return null;

    const { paciente, ...control } = encontrado;
    return aplanarControlYPaciente(control, paciente);
};

export const buscarControlPaginado = async (
    page: number,
    limit: number,
    filtro?: string,
    fechaDesde?: string,
    fechaHasta?: string,
    orden?: string,
    busqueda?: string,
) => {
    const skip = (page - 1) * limit;

    const c = obtenerHoyChile();
    const hoy = new Date(Date.UTC(c.anio, c.mes, c.dia));
    const manana = new Date(Date.UTC(c.anio, c.mes, c.dia + 1));

    const diaSemana = hoy.getUTCDay();
    const diffInicio = diaSemana === 0 ? -6 : 1 - diaSemana;
    const inicioSemana = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + diffInicio));
    const finSemana = new Date(Date.UTC(inicioSemana.getUTCFullYear(), inicioSemana.getUTCMonth(), inicioSemana.getUTCDate() + 7));

    const idsVigentes = await obtenerIdsControlesVigentes();

    let where: any = { id_control: { in: idsVigentes } };

    switch (filtro) {
        case 'hoy':
            where.fecha_proximoControl = { gte: hoy, lt: manana };
            break;
        case 'atrasados':
            where.fecha_proximoControl = { lt: hoy };
            break;
        case 'semana':
            where.fecha_proximoControl = { gte: inicioSemana, lt: finSemana };
            break;
        case 'rango':
            if (fechaDesde && fechaHasta) {
                const desde = new Date(fechaDesde + 'T00:00:00.000Z');
                const hastaExclusivo = new Date(fechaHasta + 'T00:00:00.000Z');
                hastaExclusivo.setUTCDate(hastaExclusivo.getUTCDate() + 1);
                where.fecha_proximoControl = { gte: desde, lt: hastaExclusivo };
            }
            break;
    }

    //* busqueda por rut del paciente o por nombre/apellido
    if (busqueda && busqueda.trim() !== '') {
        const palabras = busqueda.trim().split(/\s+/);

        where.AND = palabras.map((palabra) => ({
            OR: [
                { rut_paciente: { contains: palabra, mode: 'insensitive' } },
                { paciente: { nombre: { contains: palabra, mode: 'insensitive' } } },
                { paciente: { apellido: { contains: palabra, mode: 'insensitive' } } },
            ],
        }));
    }

    const direccionOrden = orden === 'desc' ? 'desc' : 'asc';
    const [data, total] = await Promise.all([
        prisma.controlClinico.findMany({
            where,
            skip,
            take: limit,
            include: {
                paciente: { include: incluirDiagnosticos },
                Profesional: incluirProfesional,
                ...incluirDiagnosticos,
            },
            orderBy: { fecha_proximoControl: direccionOrden }
        }),
        prisma.controlClinico.count({ where })
    ]);

    return {
        data: data.map(({ paciente, ...control }) => aplanarControlYPaciente(control, paciente)),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
};


export const obtenerConteosAgenda = async () => {

    const c = obtenerHoyChile();
    const hoy = new Date(Date.UTC(c.anio, c.mes, c.dia));
    const manana = new Date(Date.UTC(c.anio, c.mes, c.dia + 1));

    const diaSemana = hoy.getUTCDay();
    const diffInicio = diaSemana === 0 ? -6 : 1 - diaSemana;
    const inicioSemana = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + diffInicio));
    const finSemana = new Date(Date.UTC(inicioSemana.getUTCFullYear(), inicioSemana.getUTCMonth(), inicioSemana.getUTCDate() + 7));

    const inicioMes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
    const finMes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1));

    const idsVigentes = await obtenerIdsControlesVigentes();
    const baseWhere = { id_control: { in: idsVigentes } };

    const [hoyCount, atrasadosCount, semanaCount, mesCount, todosCount] = await Promise.all([
        prisma.controlClinico.count({ where: { ...baseWhere, fecha_proximoControl: { gte: hoy, lt: manana } } }),
        prisma.controlClinico.count({ where: { ...baseWhere, fecha_proximoControl: { lt: hoy } } }),
        prisma.controlClinico.count({ where: { ...baseWhere, fecha_proximoControl: { gte: inicioSemana, lt: finSemana } } }),
        prisma.controlClinico.count({ where: { ...baseWhere, fecha_proximoControl: { gte: inicioMes, lt: finMes } } }),
        prisma.controlClinico.count({ where: baseWhere }),
    ]);

    return { hoy: hoyCount, atrasados: atrasadosCount, semana: semanaCount, mes: mesCount, todos: todosCount };
};


//* trae el id del control mas reciente de cada paciente activo
//? los desactivados no entran a la agenda ni a sus conteos
const obtenerIdsControlesVigentes = async (): Promise<number[]> => {
    const resultado = await prisma.$queryRaw<{ id_control: number }[]>`
        SELECT DISTINCT ON (c.rut_paciente) c.id_control
        FROM "ControlClinico" c
        JOIN "Paciente" p ON p.rut = c.rut_paciente
        WHERE p.activo = true
        ORDER BY c.rut_paciente, c.creado_en DESC
    `;
    return resultado.map((r) => r.id_control);
};