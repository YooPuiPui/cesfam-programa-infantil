import { Request, Response, RequestHandler } from "express";
import * as tallerService from '../services/taller.service';





//* post/talleres crear un nuevo taller
export const crearTaller: RequestHandler = async (req, res): Promise<void> =>{
    try{
        const {nombre, descripcion, edad_min, edad_max} = req.body;

        //! el unico campo obligatorio es el nombre
        if(!nombre || nombre.trim() === '') {
            res.status(400).json({error: 'El nombre del taller es obligatorio.'});
            return;
        }

        //! parseInt('abc') es NaN y Prisma lo rechaza con un error opaco (500),
        //! asi que las edades se validan aca y se responde 400.
        let edadMinLimpia: number | undefined;
        let edadMaxLimpia: number | undefined;

        if (edad_min !== undefined && edad_min !== null && edad_min !== '') {
            edadMinLimpia = parseInt(edad_min);

            if (isNaN(edadMinLimpia) || edadMinLimpia < 0) {
                res.status(400).json({error: 'La edad minima debe ser un numero entero mayor o igual a cero'});
                return;
            }
        }

        if (edad_max !== undefined && edad_max !== null && edad_max !== '') {
            edadMaxLimpia = parseInt(edad_max);

            if (isNaN(edadMaxLimpia) || edadMaxLimpia < 0) {
                res.status(400).json({error: 'La edad maxima debe ser un numero entero mayor o igual a cero'});
                return;
            }
        }

        //? Comparamos contra los valores por defecto del schema (0 y 17) para
        //? cubrir el caso de que venga solo una de las dos edades.
        const minEfectiva = edadMinLimpia !== undefined ? edadMinLimpia : 0;
        const maxEfectiva = edadMaxLimpia !== undefined ? edadMaxLimpia : 17;

        if (minEfectiva > maxEfectiva) {
            res.status(400).json({error: 'La edad minima no puede ser mayor que la edad maxima'});
            return;
        }

        const tallerLimpio = {
            nombre: nombre.trim(),
            descripcion: descripcion || null,
            edad_min: edadMinLimpia,
            edad_max: edadMaxLimpia,
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

        res.status(500).json({error: 'Error interno en la base de datos', detalle: error.message});
    }
}


//* get/talleres lista todos los talleres activos
export const obtenerTalleres: RequestHandler = async (req, res): Promise<void> => {
    try{
        const talleres = await tallerService.buscarTalleres();
        res.status(200).json(talleres);

    }catch(error: any){
        console.error('Error al obtener los talleres', error.message);
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
            res.status(404).json({error: 'El taller solicitado no existe'});
            return;
        }

        res.status(200).json(taller);
    } catch (error: any) {
        console.error('Error al obtener el taller: ', error.message);
        res.status(500).json({error: 'Error interno al consultar el taller '});
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
        if (datos.nombre !== undefined) {
            //! Un nombre null pasaba el !== undefined y reventaba en .trim() con
            //! un 500; y el nombre es obligatorio en el schema, no puede vaciarse.
            if (typeof datos.nombre !== 'string' || datos.nombre.trim() === '') {
                res.status(400).json({error: 'El nombre del taller no puede quedar vacio'});
                return;
            }

            datosLimpios.nombre = datos.nombre.trim();
        }

        if (datos.descripcion !== undefined) datosLimpios.descripcion = datos.descripcion;

        if (datos.edad_min !== undefined) {
            const edadMin = parseInt(datos.edad_min);

            if (isNaN(edadMin) || edadMin < 0) {
                res.status(400).json({error: 'La edad minima debe ser un numero entero mayor o igual a cero'});
                return;
            }

            datosLimpios.edad_min = edadMin;
        }

        if (datos.edad_max !== undefined) {
            const edadMax = parseInt(datos.edad_max);

            if (isNaN(edadMax) || edadMax < 0) {
                res.status(400).json({error: 'La edad maxima debe ser un numero entero mayor o igual a cero'});
                return;
            }

            datosLimpios.edad_max = edadMax;
        }

        //? Si se toca una sola edad hay que compararla con la que ya esta en la
        //? base, no con la del body: el rango resultante es el que debe ser valido.
        if (datosLimpios.edad_min !== undefined || datosLimpios.edad_max !== undefined) {
            const actual = await tallerService.buscarTallerPorId(id);

            if (!actual) {
                res.status(404).json({error: 'El taller que intentas editar no existe'});
                return;
            }

            const minFinal = datosLimpios.edad_min !== undefined ? datosLimpios.edad_min : actual.edad_min;
            const maxFinal = datosLimpios.edad_max !== undefined ? datosLimpios.edad_max : actual.edad_max;

            if (minFinal > maxFinal) {
                res.status(400).json({error: 'La edad minima no puede ser mayor que la edad maxima'});
                return;
            }
        }

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
        console.error('Error al desactivar el taller: ', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({error: 'El taller que intenta desactivar no existe'});
            return;
        }

        res.status(500).json({error: 'Error interno al desactivar el taller'});
    }
}