import { Request, Response, RequestHandler } from "express";
import * as pacienteService from '../services/paciente.service';
import * as inscripcionService from '../services/inscripcionTaller.service';
import * as sesionService from '../services/sesionTaller.service';





//*post /sesiones/:idSesion/inscripciones inscribir un paciente en una sesion
export const crearInscripcion: RequestHandler = async (req, res): Promise<void> => {
    try {
        const idSesion = parseInt(req.params.idSesion as string);

        if (isNaN(idSesion)) {
            res.status(400).json({ error: 'El id de la sesión debe ser un número válido en la URL' });
            return;
        }

        const { rut_paciente, telefono_contacto, observaciones } = req.body;

        if (!rut_paciente || rut_paciente.trim() === '') {
            res.status(400).json({ error: 'El RUT del paciente es obligatorio.' });
            return;
        }

        // Verificamos que el paciente exista antes de intentar el insert,
        // para dar un 404 claro en vez de depender del P2003 genérico de Prisma
        const paciente = await pacienteService.buscarPacientePorRut(rut_paciente.trim());

        if (!paciente) {
            res.status(404).json({ error: `No se encontró ningún paciente con el RUT ${rut_paciente}.` });
            return;
        }

        const sesion = await sesionService.buscarSesionPorId(idSesion);

        if (!sesion) {
            res.status(404).json({ error: 'La sesión indicada no existe.' });
            return;
        }

        // cupo_maximo === null significa "sin tope"
        if (sesion.cupo_maximo !== null) {
            const inscritosActuales = await inscripcionService.contarInscripcionPorSesion(idSesion);

            if (inscritosActuales >= sesion.cupo_maximo) {
                res.status(409).json({ error: `Esta sesión ya alcanzó su cupo máximo (${sesion.cupo_maximo}).` });
                return;
            }
        }

        const inscripcionLimpia = {
            id_sesion: idSesion,
            rut_paciente: rut_paciente.trim(),
            telefono_contacto: telefono_contacto || null,
            observaciones: observaciones || null,
        };

        const resultado = await inscripcionService.crearInscripcion(inscripcionLimpia);

        res.status(201).json({
            mensaje: 'Paciente inscrito con éxito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('ERROR AL CREAR INSCRIPCIÓN:', error.message);

        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Este paciente ya está inscrito en esta sesión.' });
            return;
        }

        res.status(500).json({ error: 'Error interno en la Base de Datos', detalle: error.message });
    }
};


//* get lista quienes estan inscritos en unas sesion de un taller 
export const obtenerInscripcionesPorSesion: RequestHandler = async (req, res): Promise<void> => {
    try {
        const idSesion = parseInt(req.params.idSesion as string);

        if (isNaN(idSesion)) {
            res.status(400).json({ error: 'El id de la sesión debe ser un número válido en la URL' });
            return;

        }

        const inscripciones = await inscripcionService.buscarInscripcionesPorSesion(idSesion);
        res.status(200).json(inscripciones);


    } catch (error: any) {
        console.error('ERROR AL OBTENER INSCRIPCIONES:', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });

    }

};



//*get historial de talleres de un paciente
export const obtenerInscripcionesPorPaciente: RequestHandler = async (req, res ): Promise<void> => {
    try {
        const rut = req.params.rut as string;

        if(!rut || rut.trim() === ''){
            res.status(400).json({error: 'El rut del paciente es obligatorio '});
            return;

        }

        const inscripciones = await inscripcionService.buscarInscripcionesPorPaciente(rut);
        res.status(200).json(inscripciones);


    } catch (error: any) {
        console.error('Error al obtener el historial ', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });

    }

};




//* put actualiza convocatoria, asistencia u observaciones
export const editarInscripcion: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id de la inscripción debe ser un número válido' });
            return;
        }

        const datos = req.body;
        const datosLimpios: any = {};


        if (datos.estado_convocatoria !== undefined) datosLimpios.estado_convocatoria = datos.estado_convocatoria;
        if (datos.estado_asistencia !== undefined) datosLimpios.estado_asistencia = datos.estado_asistencia;
        if (datos.telefono_contacto !== undefined) datosLimpios.telefono_contacto = datos.telefono_contacto;
        if (datos.observaciones !== undefined) datosLimpios.observaciones = datos.observaciones;
        if (datos.fecha_contacto !== undefined) datosLimpios.fecha_contacto = datos.fecha_contacto ? new Date(datos.fecha_contacto) : null;

        const resultado = await inscripcionService.editarInscripcion(id, datosLimpios);

        res.status(200).json({
            mensaje: 'Inscripción actualizada con éxito',
            datos: resultado,

        });

    } catch (error: any) {
        console.error('Error al actualizar inscripción:', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'La inscripción que intentas editar no existe' });
            return;

        }

        res.status(500).json({ error: 'Error interno al actualizar la base de datos', detalle: error.message });
    }

};

//*delete elimina una inscripcion
export const eliminarInscripcion: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id de la inscripción debe ser un número válido' });
            return;
        }

        await inscripcionService.eliminarInscripcion(id);

        res.status(200).json({ mensaje: `La inscripción con id ${id} fue eliminada` });


    } catch (error: any) {
        console.error('Error al eliminar inscripción:', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'La inscripción que intentas eliminar no existe' });
            return;
        }

        res.status(500).json({ error: 'Error interno al eliminar la inscripción' });

    }

};