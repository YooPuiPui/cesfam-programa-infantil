import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import { aplanarDiagnosticos, incluirDiagnosticos } from '../utils/aplanarDiagnosticos';




//? inscribir un paciente en una sesion puntual de un taller 
export const crearInscripcion = async (datosInscripcion: Prisma.InscripcionTallerUncheckedCreateInput) => {
    return await prisma.inscripcionTaller.create({
        data: datosInscripcion,
    });

} 


//* lista todas las inscripciones de una sesión con los datos del paciente
export const buscarInscripcionesPorSesion = async (idSesion: number) => {
    const inscripciones = await prisma.inscripcionTaller.findMany({
        where: { id_sesion: idSesion },
        include: { paciente: { include: incluirDiagnosticos } },
        orderBy: { creado_en: 'asc' }
    });
    return inscripciones.map((i) => ({ ...i, paciente: aplanarDiagnosticos(i.paciente) }));

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


//* trae una inscripcion puntual junto con su sesion, para validar reglas de fecha antes de editar
export const buscarInscripcionPorId = async (idInscripcion: number) => {
    return await prisma.inscripcionTaller.findUnique({
        where: { id_inscripcion: idInscripcion },
        include: { sesion: { include: { taller: true } } }
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