import prisma from "../config/prisma";
<<<<<<< HEAD

export const crearControl = async (datosControl: any) => {
=======
import { Prisma } from "@prisma/client";

export const crearControl = async (datosControl: Prisma.ControlClinicoUncheckedCreateInput) => {
>>>>>>> feat/vista-ficha-pacientes

    return await prisma.controlClinico.create({
        data: datosControl,
    });

}

export const buscarControl = async () => {
    return await prisma.controlClinico.findMany();
}

<<<<<<< HEAD
export const buscarControlPorRut = async(rutPaciente: string) => {
=======
export const buscarControlPorRut = async (rutPaciente: string) => {
>>>>>>> feat/vista-ficha-pacientes

    return await prisma.controlClinico.findMany({
        where: {
            rut_paciente: rutPaciente,
        },
<<<<<<< HEAD
        orderBy:{
=======
        orderBy: {
>>>>>>> feat/vista-ficha-pacientes
            fecha_control: 'desc'
        }
    });
}

<<<<<<< HEAD
export const eliminarControl = async(idControl: any) => {
=======
export const eliminarControl = async (idControl: number) => {
>>>>>>> feat/vista-ficha-pacientes

    return await prisma.controlClinico.delete({
        where: {
            id_control: idControl
        }
    })
}

<<<<<<< HEAD
export const editarControl = async(idControl: number, datosControl: any ) =>{
=======
export const editarControl = async (idControl: number, datosControl: Prisma.ControlClinicoUncheckedUpdateInput) => {
>>>>>>> feat/vista-ficha-pacientes

    return await prisma.controlClinico.update({
        where: {
            id_control: idControl,
        },
        data: datosControl,
    })
}

<<<<<<< HEAD
=======
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
>>>>>>> feat/vista-ficha-pacientes

