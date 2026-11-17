import prisma from '../config/prisma';

//* devuelve todas las comunas ordenadas por nombre, para los selects de los formularios
export const obtenerComunas = async () => {
    return await prisma.comuna.findMany({
        orderBy: { nombre: 'asc' },
    });
};