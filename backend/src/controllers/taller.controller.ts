import { Request, Response, RequestHandler } from "express";
import * as tallerService from '../services/taller.service';
import { UndoIcon } from "lucide-react";





//* post/talleres crear un nuevo taller
export const crearTaller: RequestHandler = async (req, res): Promise<void> =>{
    try{
        const {nombre, descripcion, edad_min, edad_max} = req.body;

        //! el unico campo obligatorio es el nombre
        if(!nombre || nombre.trim() === '') {
            res.status(400).json({error: 'El nombre del taller es obligatorio.'});
            return;
        }

        const tallerLimpio = {
            nombre: nombre.trim(),
            descripcion: descripcion || null,
            edad_min: edad_min !== undefined ? parseInt(edad_min) : undefined,
            edad_max: edad_max !== undefined ? parseInt(edad_max) : undefined,
            
        };

        const resultado = await tallerService.crearTaller(tallerLimpio);

        res.status(201).json({
            mensaje: 'Taller creado con exito',
            datos: resultado,
        });


    }catch(error: any){
        console.error('ERROR AL CREAR EL TALLER', error.message);

        //! P2002 es que prisma detecto que el nombre ya existe
        if(error.code === 'P2002'){
            res.status(409).json({error: 'Ya existe un taller con ese nombre'});
            return;
        }

        res.status(500).json({error: 'Error interno en la base de datos', detalle: error.menssage});
    }
}


//* get/talleres lista todos los talleres activos
export const obtenerTalleres: RequestHandler = async (req, res): Promise<void> => {
    try{
        const talleres = await tallerService.buscarTalleres();
        res.status(200).json(talleres);

    }catch(error: any){
        console.error('Error al obtener los talleres', error.menssage);
        res.status(500).json({error: 'Error interno al consultar la base de datos'});
    }
};


//* get/talleres/:id  obtener un taller por id
export const obtenerTallerPorId: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if(isNaN(id)){
            res.status(400).json({error: 'El id del taller debe ser un numero valido'});
            return;

        }

        const taller = await tallerService.buscarTallerPorId(id);

        if(!taller){
            res.status(400).json({error: 'El taller solicitado no existe'});
            return;
        }

        res.status(200).json(taller);
    } catch (error: any) {
        console.error('Error al obtener el taller: ', error.menssage);
        res.status(500).json({error: 'Error interno al consultgar el taller '});
    }
};



//* put/talleres/:id editar nombre, descripcion o rango etario
export const editarTaller: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if(isNaN(id)){
            res.status(400).json({error: 'El id del taller debe ser un numeor valido'});
            return;

        }

        const datos = req.body;
        const datosLimpios: any = {};

        //? actualizar con lo que viene en el body
        if (datos.nombre !== undefined) datosLimpios.nombre = datos.nombre.trim();
        if (datos.descripcion !== undefined) datosLimpios.descripcion = datos.descripcion;
        if (datos.edad_min !== undefined) datosLimpios.edad_min = parseInt(datos.edad_min);
        if (datos.edad_max !== undefined) datosLimpios.edad_max = parseInt(datos.edad_max);

        const resultado = await tallerService.editarTaller(id, datosLimpios);

        res.status(200).json({
            mensaje: 'Taller actualizado con exito ',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('Error al actualizar taller:', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El taller que intentas editar no existe' });
            return;
        }

        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Ya existe otro taller con ese nombre.' });
            return;
        }

        res.status(500).json({ error: 'Error interno al actualizar la base de datos', detalle: error.message });
    }
};


//* delete/talleres/:id  desactivar el taller
export const desactivarTaller: RequestHandler = async(req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if(isNaN(id)){
            res.status(400).json({error: 'El id del taller debe ser un numero valido'});
            return;
        }

        await tallerService.desactivarTaller(id);

        res.status(200).json({mensaje: `El taller con id ${id} fue desactivado` });

    } catch (error:any) {
        console.error('Error al desactivar el taller: ', error.menssage);

        if (error.code === 'P2025') {
            res.status(404).json({error: 'El taller que intenta desactivar no existe'});
            return;
        }
    }

    res.status(500).json({error: 'Error interno al desactivar el taller'});
}