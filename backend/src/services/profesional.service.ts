import prisma from '../config/prisma';

export const crearProfesional = async (datosProfesional: any) => {
    
    return await prisma.profesional.create({
        data: datosProfesional,
    });
};

export const editarProfesional = async (idProfesional: number, datosProfesional: any) => {
    return await prisma.profesional.update({
        where: {
            id_profesional: idProfesional,
        },
        data: datosProfesional,
    });
};

export const obtenerProfesionales = async () => {
    return await prisma.profesional.findMany();
};

export const obtenerProfesionalPorId = async (idProfesional: number) => {
    //* busca al profesional por su id
    return await prisma.profesional.findUnique({
        where: {
            id_profesional :idProfesional
        },
    });


};

export const eliminarProfesional = async (idProfesional: number) => {
    return await prisma.profesional.delete({
        where: {
            id_profesional: idProfesional,
        },
    });
};