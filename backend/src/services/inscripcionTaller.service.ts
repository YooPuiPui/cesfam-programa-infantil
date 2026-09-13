import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";




//? inscribir un paciente en una sesion puntual de un taller 
export const crearInscripcion = async (datosInscripcion: Prisma.InscripcionTallerUncheckedCreateInput) => {
    return await prisma.inscripcionTaller.create({
        data: datosInscripcion,
    });

} 


//? cuenta cuantos pacientes ya estan inscritos en una sesion (valida cupos)
export const contarInscripcionPorSesion = async (idSesion: number) =>{
    return await prisma.inscripcionTaller.count({
        where: {id_sesion: idSesion},

    });

}


//* lista todas las inscripciones de una sesión con los datos del paciente
export const buscarInscripcionesPorSesion = async (idSesion: number) => {
    return await prisma.inscripcionTaller.findMany({
        where: { id_sesion: idSesion },
        include: { paciente: true },
        orderBy: { creado_en: 'asc' }
    });

}


//* historial de talleres de un paciente especifico
export const buscarInscripcionesPorPaciente = async (rutPaciente: string) => {
    return await prisma.inscripcionTaller.findMany({
        where: { rut_paciente: rutPaciente },
        include: {
            sesion: {
                include: { taller: true }
            }
        },
        orderBy: { creado_en: 'desc' }
    });

}


//* actualizar inscripcion 
export const editarInscripcion = async (idInscripcion: number, datosInscripcion: Prisma.InscripcionTallerUncheckedUpdateInput) => {
    return await prisma.inscripcionTaller.update({
        where: { id_inscripcion: idInscripcion },
        data: datosInscripcion,
    });
}

//* elimina una inscripcion
export const eliminarInscripcion = async (idInscripcion: number) => {
    return await prisma.inscripcionTaller.delete({
        where: { id_inscripcion: idInscripcion }
    });
}