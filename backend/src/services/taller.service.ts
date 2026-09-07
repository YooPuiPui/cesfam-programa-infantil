import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";




//* crear un nuevo taller en el catalogo
export const crearTaller = async (datosTaller: Prisma.TallerUncheckedCreateInput) => {
    return await prisma.taller.create({
        data: datosTaller,
    });
}

//* lista solo los talleres en el catalogo
export const buscarTalleres = async() => {
    return await prisma.taller.findMany({
        where: {activo: true},
        orderBy: {nombre: 'asc'}
    });

}


//* buscar un taller por id, trayendo tambien las sesiones
export const buscarTallerPorId = async (idTaller: number) => {
    return await prisma.taller.findUnique({
        where: {id_taller: idTaller},
        include: {sesiones: true} 
    });
}

//* actualizar un taller nombre, descripcion o rango etario
export const editarTaller = async (idTaller: number, datosTaller: Prisma.TallerUncheckedUpdateInput) => {
    return await prisma.taller.update({
        where: {id_taller: idTaller},
        data: datosTaller,
    });
}

//* desactivar un taller sin eliminarlo, no rompre sesiones ya creadas
export const desactivarTaller = async (idTaller: number) =>{
    return await prisma.taller.update({
        where: {id_taller: idTaller},
        data: {activo: false},
    });
}