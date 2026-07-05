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

export const buscarControlPaginado = async (page: number, limit: number, filtro?: string) => {
    const skip = (page - 1) * limit;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const inicioSemana = new Date(hoy);
    const dia = inicioSemana.getDay();
    inicioSemana.setDate(inicioSemana.getDate() + (dia === 0 ? -6 : 1 - dia));
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    finMes.setHours(23, 59, 59, 999);

    let where: any = {};

    switch (filtro) {
        case 'hoy':
            where.fecha_proximoControl = { gte: hoy, lt: manana };
            break;
        case 'atrasados':
            where.fecha_proximoControl = { lt: hoy };
            break;
        case 'semana':
            where.fecha_proximoControl = { gte: inicioSemana, lte: finSemana };
            break;
        case 'mes':
            where.fecha_proximoControl = { gte: inicioMes, lte: finMes };
            break;
        // 'todos' o sin filtro: no se agrega condición extra
    }

    const [data, total] = await Promise.all([
        prisma.controlClinico.findMany({
            where,
            skip,
            take: limit,
            include: { paciente: true },
            orderBy: { fecha_proximoControl: 'asc' }
        }),
        prisma.controlClinico.count({ where })
    ]);

    return {
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
};

export const obtenerConteosAgenda = async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const inicioSemana = new Date(hoy);
    const dia = inicioSemana.getDay();
    inicioSemana.setDate(inicioSemana.getDate() + (dia === 0 ? -6 : 1 - dia));
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    finMes.setHours(23, 59, 59, 999);

    const [hoyCount, atrasadosCount, semanaCount, mesCount, todosCount] = await Promise.all([
        prisma.controlClinico.count({ where: { fecha_proximoControl: { gte: hoy, lt: manana } } }),
        prisma.controlClinico.count({ where: { fecha_proximoControl: { lt: hoy } } }),
        prisma.controlClinico.count({ where: { fecha_proximoControl: { gte: inicioSemana, lte: finSemana } } }),
        prisma.controlClinico.count({ where: { fecha_proximoControl: { gte: inicioMes, lte: finMes } } }),
        prisma.controlClinico.count(),
    ]);

    return { hoy: hoyCount, atrasados: atrasadosCount, semana: semanaCount, mes: mesCount, todos: todosCount };
};
