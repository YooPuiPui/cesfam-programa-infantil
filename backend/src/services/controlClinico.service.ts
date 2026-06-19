import prisma from "../config/prisma";

export const crearControl = async (datosControl: any) => {

    return await prisma.controlClinico.create({
        data: datosControl,
    });

}

export const buscarControl = async () => {
    return await prisma.controlClinico.findMany();
}

export const buscarControlPorRut = async(rutPaciente: string) => {

    return await prisma.controlClinico.findMany({
        where: {
            rut_paciente: rutPaciente,
        },
        orderBy:{
            fecha_control: 'desc'
        }
    });
}

export const eliminarControl = async(idControl: any) => {

    return await prisma.controlClinico.delete({
        where: {
            id_control: idControl
        }
    })
}

export const editarControl = async(idControl: number, datosControl: any ) =>{

    return await prisma.controlClinico.update({
        where: {
            id_control: idControl,
        },
        data: datosControl,
    })
}


