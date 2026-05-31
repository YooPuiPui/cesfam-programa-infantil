import { Request, Response, RequestHandler } from 'express';
import * as profesionalService from '../services/profesional.service';

export const crearProfesional: RequestHandler = async (req, res): Promise<void> => {
    try {

        const datos = req.body;


        if (!datos.rut || !datos.nombre || !datos.apellido || !datos.estamento) {
            res.status(400).json({ error: 'Faltan datos obligatorios (RUT, nombre, apellido o estamento)' });
            return;
        }


        const profesionalLimpio = {
            rut: datos.rut,
            nombre: datos.nombre,
            apellido: datos.apellido,
            estamento: datos.estamento,
            activo: datos.activo !== undefined ? datos.activo : true,
        };

        const resultado = await profesionalService.crearProfesional(profesionalLimpio);

        res.status(201).json({
            mensaje: 'Profesional creado con éxito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error(' ERROR ATRAPADO EN EL CONTROLADOR ');
        console.error('Motivo del fallo:', error.message);
        res.status(500).json({ error: 'Error interno en la Base de Datos', detalle: error.message });
    }
};


export const obtenerTodosLosProfesionales: RequestHandler = async (req, res): Promise<void> => {
    try {
        const profesionales = await profesionalService.obtenerProfesionales();
        res.status(200).json(profesionales);
    } catch (error: any) {
        console.error('🚨 ERROR AL OBTENER PROFESIONALES 🚨', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};


export const obtenerProfesional: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del profesional debe ser un número valido' });
            return;
        }

        const profesional = await profesionalService.obtenerProfesionalPorId(id);

        if (!profesional) {
            res.status(404).json({ error: 'El profesional no existe en los registros' });
            return;
        }

        res.status(200).json(profesional);

    } catch (error: any) {
        console.error('Error al obtener profesional', error.message);
        res.status(500).json({ error: 'Error interno al consultar el profesional' });
    }
};

//! Editar profesional
export const editarProfesional: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del profesional debe ser un numero valido en la url' });
            return;
        }

        const datos = req.body;
        const datosLimpios: any = {};

        // Mapeo dinámico exacto a tu schema
        if (datos.rut) datosLimpios.rut = datos.rut;
        if (datos.nombre) datosLimpios.nombre = datos.nombre;
        if (datos.apellido) datosLimpios.apellido = datos.apellido;
        if (datos.estamento) datosLimpios.estamento = datos.estamento;
        if (datos.activo !== undefined) datosLimpios.activo = datos.activo;

        const resultado = await profesionalService.editarProfesional(id, datosLimpios);

        res.status(200).json({
            mensaje: 'Profesional actualizado con éxito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('Error al actualizar al profesional', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El profesional que intentas editar no existe en la base de datos' });
            return;
        }

        res.status(500).json({ error: 'Error interno al actualizar la db', detalle: error.message });
    }
};


export const borrarProfesional: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del profesional debe ser un numero valido' });
            return;
        }

        await profesionalService.eliminarProfesional(id);

        res.status(200).json({ mensaje: `El profesional con id ${id} fue eliminado` });

    } catch (error: any) {
        console.error(' Error al eliminar al profesional', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El profesional que intentas eliminar no existe' });
            return;
        }

        res.status(500).json({ error: 'Error interno al eliminar el profesional ' });
    }
};