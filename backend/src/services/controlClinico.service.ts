import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

export const crearControl = async (datosControl: Prisma.ControlClinicoUncheckedCreateInput) => {

    return await prisma.controlClinico.create({
        data: datosControl,
    });

}

export const buscarControl = async () => {
    return await prisma.controlClinico.findMany();
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

