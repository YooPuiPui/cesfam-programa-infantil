import { Request, Response, RequestHandler } from "express";
import * as sesionService from '../services/sesionTaller.service';
import { fechaCalendarioAMediodiaUTC } from '../utils/fechaChile';




//* post talleres/:idTaller/sesiones  crear nueva sesion para un taller
export const crearSesion: RequestHandler = async(req, res): Promise<void> => {
    try {
        const idTaller = parseInt(req.params.idTaller as string);

        if(isNaN(idTaller)){
            res.status(400).json({ error: 'El id del taller debe ser un numero valido'});
            return;
        }

        const {fecha, cupo_maximo, rut_profesional, profesional_externo, observaciones } = req.body;

        if(!fecha){
            res.status(400).json({error: 'La fecha de la sesion es obligatoria'});
            return;
        }

        //! El proyecto guarda las fechas de calendario al mediodia UTC para no
        //! correr el dia entre America/Santiago y UTC. El helper ademas rechaza
        //! formatos invalidos, que si no llegarian a Prisma como Invalid Date.
        const fechaSesion = fechaCalendarioAMediodiaUTC(fecha);

        if(!fechaSesion){
            res.status(400).json({error: 'La fecha de la sesion debe tener formato AAAA-MM-DD y ser un dia valido'});
            return;
        }

        let cupoLimpio: number | null = null;

        if(cupo_maximo !== undefined && cupo_maximo !== null && cupo_maximo !== ''){
            cupoLimpio = parseInt(cupo_maximo);

            if(isNaN(cupoLimpio) || cupoLimpio <= 0){
                res.status(400).json({error: 'El cupo maximo debe ser un numero entero mayor a cero'});
                return;
            }
        }

        //! Regla de negocio: uno u otro, nunca ambos, nunca ninguno.
        //! Esto Prisma no lo valida solo porque son dos columnas independientes,
        //! así que la regla vive acá, antes de tocar la base de datos.
        const tieneInterno = !!rut_profesional;
        const tieneExterno = !!profesional_externo;

        if(tieneInterno && tieneExterno){
            res.status(400).json({
                error: 'Indica solo un profesional: interno rut_profesional,  o externo profesional_externo, no ambos '

            });
            return;
        }

        if(!tieneInterno && !tieneExterno){
            res.status(400).json({
                error: 'Debe indicar quien dicta la sesion  rut_profesional (si es de este CESFAM) o profesional_externo (si es interno o de otro CESFAM).'
            })
            return;
        }

        const sesionLimpia = {
            id_taller: idTaller,
            fecha: fechaSesion,
            cupo_maximo: cupoLimpio,
            rut_profesional: tieneInterno ? rut_profesional : null,
            profesional_externo: tieneExterno ? profesional_externo.trim() : null,
            observaciones: observaciones || null,
        };

        const resultado = await sesionService.crearSesion(sesionLimpia);

        res.status(201).json({
            mensaje: ' Sesion de taller creada con exito',
            datos: resultado,
        })

    } catch (error: any) {
        console.error('Erros al crear sesion', error.message);

        //? P2003 = lo fk no existe o el id_taller o el rut_profesional son inválidos
        if(error.code === 'P2003'){
            res.status(400).json({error: 'El taller o el profesional especificado no existe en la base de datos.'});
            return;
        }

        res.status(500).json({error: 'Error interno en la base de dotos', detalle: error.message});
    }
};



//* get /talleres/:idTaller/sesiones lista las sesiones de un taller 
export const obtenerSesionesPorTaller: RequestHandler = async (req, res): Promise<void> => {
    try {
        const idTaller = parseInt(req.params.idTaller as string);

        if(isNaN(idTaller)){
            res.status(400).json({error: 'El id del taller debe ser un numero valido'});
            return;

        }

        const sesiones = await sesionService.buscarSesionesPorTaller(idTaller);
        res.status(200).json(sesiones);
        return;

    } catch (error: any) {
        console.error('Error al obtener las sesiones ', error.message);
        res.status(500).json({error: 'Error interno al consultar la base de datos'});
    }

}



//* get sesiones/:id   detalle de una sesion 
export const obtenerSesionPorId: RequestHandler = async (req, res): Promise <void> =>{
    try {
        const id = parseInt(req.params.id as string);

        if(isNaN(id)){
            res.status(400).json({error: 'El id de la sesion debe ser un numero valido'});
            return;
        }

        const sesion = await sesionService.buscarSesionPorId(id);

        if(!sesion){
            res.status(404).json({error: 'La sesion solicitada no existe'});
            return;
        }

        res.status(200).json(sesion);
        return;

    } catch (error:any) {
        console.error('Error al obtener la sesion: ', error.message);
        res.status(500).json({error: 'Error interno al consultar la base de datos'});
    }

}


//* put sesiones/:id editar el taller
export const editarSesion: RequestHandler = async (req, res): Promise <void> => {
    try {
        const id = parseInt(req.params.id as string);

        if(isNaN(id)){
            res.status(400).json({error: 'La sesion solicitada no existe'});
            return;

        }

        const datos = req.body;

        //? Necesitamos el estado actual para validar como queda la sesion DESPUES
        //? del PATCH: mirar solo el body dejaria pasar el caso de editar el
        //? profesional externo en una sesion que ya tiene uno interno.
        const actual = await sesionService.buscarSesionPorId(id);

        if(!actual){
            res.status(404).json({error: 'La sesion que intentas editar no existe'});
            return;
        }

        if (datos.rut_profesional !== undefined || datos.profesional_externo !== undefined){
            const internoFinal = datos.rut_profesional !== undefined
                ? datos.rut_profesional
                : actual.rut_profesional;

            const externoFinal = datos.profesional_externo !== undefined
                ? datos.profesional_externo
                : actual.profesional_externo;

            const tieneInterno = !!internoFinal;
            const tieneExterno = !!externoFinal;

            if(tieneInterno && tieneExterno){
                res.status(400).json({error: 'Indica solo un profesional: interno o externo, no ambos'});
                return;
            }

            if(!tieneInterno && !tieneExterno){
                res.status(400).json({error: 'La sesion debe quedar con un profesional a cargo: interno rut_profesional o externo profesional_externo'});
                return;
            }
        }

        const datosLimpios: any = {};

        if (datos.fecha !== undefined) {
            const fechaSesion = fechaCalendarioAMediodiaUTC(datos.fecha);

            if(!fechaSesion){
                res.status(400).json({error: 'La fecha de la sesion debe tener formato AAAA-MM-DD y ser un dia valido'});
                return;
            }

            datosLimpios.fecha = fechaSesion;
        }

        if (datos.cupo_maximo !== undefined) {
            if (datos.cupo_maximo === null || datos.cupo_maximo === '') {
                datosLimpios.cupo_maximo = null;
            } else {
                const cupoLimpio = parseInt(datos.cupo_maximo);

                if(isNaN(cupoLimpio) || cupoLimpio <= 0){
                    res.status(400).json({error: 'El cupo maximo debe ser un numero entero mayor a cero'});
                    return;
                }

                datosLimpios.cupo_maximo = cupoLimpio;
            }
        }

        if (datos.rut_profesional !== undefined) datosLimpios.rut_profesional = datos.rut_profesional || null;
        if (datos.profesional_externo !== undefined) datosLimpios.profesional_externo = datos.profesional_externo || null;
        if (datos.observaciones !== undefined) datosLimpios.observaciones = datos.observaciones;

        const resultado = await sesionService.editarSesion(id, datosLimpios);

        res.status(200).json({
            mensaje: 'Sesión actualizada con éxito',
            datos: resultado,
        });

    } catch (error:any) {
        console.error('Error al actualizar la sesion ', error.message);

        if(error.code === 'P2025'){
            res.status(404).json({error: 'La sesion que intentas editar no existe '});
            return;

        }

        res.status(500).json({error: 'Error interno al actualizar la base de datos ', detalle: error.message});
    }
}



//* delete sesion/:id elimina de la db una sesion solo si no tiene inscripciones
export const eliminarSesion: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id de la sesión debe ser un número válido' });
            return;
        }

        await sesionService.eliminarSesion(id);

        res.status(200).json({ mensaje: `La sesión con id ${id} fue eliminada` });

    } catch (error: any) {
        console.error('Error al eliminar sesión:', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'La sesión que intentas eliminar no existe' });
            return;
        }

        // P2003 acá significa: hay InscripcionTaller que dependen de esta sesión
        if (error.code === 'P2003') {
            res.status(409).json({ error: 'No se puede eliminar: esta sesión ya tiene pacientes inscritos.' });
            return;
        }

        res.status(500).json({ error: 'Error interno al eliminar la sesión' });
    }
};
