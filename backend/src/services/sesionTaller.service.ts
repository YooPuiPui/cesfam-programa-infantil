import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";





//* crear una nueva sesion de un taller
export const crearSesion = async (datosSesion: Prisma.SesionTallerUncheckedCreateInput) => {
    return await prisma.sesionTaller.create({
        data: datosSesion,
    });

}


//* listar todas las sesiones de un taller especifico, mas recientes primero
export const buscarSesionesPorTaller = async (idTaller: number) => {
    return await prisma.sesionTaller.findMany({
        where: { id_taller: idTaller },
        orderBy: { fecha: 'desc' }
    });

}


//* trae una sesion con sus inscripciones, ver quienes fueron convocado
export const buscarSesionPorId = async (idSesion: number) => {
    return await prisma.sesionTaller.findUnique({
        where: { id_sesion: idSesion },
        include: {
            taller: true,
            profesional: true,
            inscripciones: {
                include: { paciente: true }
            }
        }
    });
}


//* edita fecha, cupo u obsevaciones de una sesion ya creada
export const editarSesion = async (idSesion: number, dataSesion: Prisma.SesionTallerUncheckedUpdateInput) => {
    return await prisma.sesionTaller.update({
        where: {id_sesion: idSesion},
        data: dataSesion,
    });

}



//* elimina una sesion
export const eliminarSesion = async (idSesion: number) => {
    return await prisma.sesionTaller.delete({
        where: {id_sesion: idSesion}
    });

}

