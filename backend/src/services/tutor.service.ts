import prisma from '../config/prisma';

export const crearTutor = async (datosTutor: any) => {
    return await prisma.tutor.create({
        data: datosTutor,
    });
};

export const obtenerTutores = async () => {
    return await prisma.tutor.findMany({
        include: {
            pacientes: true,
        },
    });
};

export const obtenerTutorPorId = async (idTutor: number) => {
    return await prisma.tutor.findUnique({
        where: {
            id_tutor: idTutor,
        },
        include: {
            pacientes: true,
        },
    });
};

export const obtenerTutorPorRut = async (rut: string) => {
    return await prisma.tutor.findUnique({
        where: { rut },
        include: {
            pacientes: true,
        },
    });
};

export const editarTutor = async (idTutor: number, datosTutor: any) => {
    return await prisma.tutor.update({
        where: {
            id_tutor: idTutor,
        },
        data: datosTutor,
    });
};

export const eliminarTutor = async (idTutor: number) => {
    return await prisma.tutor.delete({
        where: {
            id_tutor: idTutor,
        },
    });
};