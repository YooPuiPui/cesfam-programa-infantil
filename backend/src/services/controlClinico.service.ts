import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

export const crearControl = async (datosControl: Prisma.ControlClinicoUncheckedCreateInput) => {

    return await prisma.controlClinico.create({
        data: datosControl,
    });

}

export const buscarControl = async () => {
    return await prisma.controlClinico.findMany({
        include: {
            paciente: true,
        },
        orderBy: {
            fecha_control: 'desc'
        }
    });
}

export const buscarControlPorRut = async (rutPaciente: string) => {

    return await prisma.controlClinico.findMany({
        where: {
            rut_paciente: rutPaciente,
        },
        orderBy: {
            fecha_control: 'desc'
        }
    });
}

export const eliminarControl = async (idControl: number) => {

    return await prisma.controlClinico.delete({
        where: {
            id_control: idControl
        }
    })
}

export const editarControl = async (idControl: number, datosControl: Prisma.ControlClinicoUncheckedUpdateInput) => {

    return await prisma.controlClinico.update({
        where: {
            id_control: idControl,
        },
        data: datosControl,
    })
}

export const buscarControlPorId = async (idControl: number) => {
    return await prisma.controlClinico.findUnique({
        where: { id_control: idControl },
        include: {
            paciente: {
                include: { tutor: true }
            },
            Profesional: true
        }
    });
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

    const ahora = new Date();
    const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
    const manana = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() + 1));

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

    // Búsqueda por RUT del paciente o por nombre/apellido, sin distinguir mayúsculas
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
            include: { paciente: true },
            orderBy: { fecha_proximoControl: direccionOrden }
        }),
        prisma.controlClinico.count({ where })
    ]);

    return {
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
};


export const obtenerConteosAgenda = async () => {
    const ahora = new Date();
    const hoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
    const manana = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() + 1));

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


// Obtiene, por cada paciente, el id del control creado más recientemente
const obtenerIdsControlesVigentes = async (): Promise<number[]> => {
    const resultado = await prisma.$queryRaw<{ id_control: number }[]>`
        SELECT DISTINCT ON (rut_paciente) id_control
        FROM "ControlClinico"
        ORDER BY rut_paciente, creado_en DESC
    `;
    return resultado.map((r) => r.id_control);
};