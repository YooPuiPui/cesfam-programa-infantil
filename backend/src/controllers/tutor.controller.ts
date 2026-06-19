import { Request, Response, RequestHandler } from "express";
import * as tutorService from '../services/tutor.service';

export const crearTutor: RequestHandler = async (req, res): Promise<void> => {
    try {
        const datos = req.body;

        // validar que esten todos los datos
        if (!datos.nombre || !datos.apellido || !datos.telefono || !datos.parentesco || !datos.direccion || !datos.comuna) {
            res.status(400).json({ error: 'Faltan datos obligatorios (nombre, apellido, teléfono, parentesco, dirección, comuna)' });
            return;
        }

        // mapeo de los datos 
        const tutorLimpio = {
            rut: datos.rut || null,
            nombre: datos.nombre,
            apellido: datos.apellido,
            telefono: datos.telefono,
            parentesco: datos.parentesco,
            correo: datos.correo || null,
            direccion: datos.direccion,
            sector: datos.sector || null,
            comuna: datos.comuna,
        };

        const resultado = await tutorService.crearTutor(tutorLimpio);

        res.status(201).json({
            mensaje: 'Tutor creado con éxito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('ERROR AL CREAR TUTOR:', error.message);
        
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'El RUT ya está registrado en el sistema' });
            return;
        }

        res.status(500).json({ error: 'Error interno en la Base de Datos', detalle: error.message });
    }
};

export const obtenerTutores: RequestHandler = async (req, res): Promise<void> => {
    try {
        const tutores = await tutorService.obtenerTutores();
        res.status(200).json(tutores);
    } catch (error: any) {
        console.error('ERROR AL OBTENER TUTORES:', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};

export const obtenerTutor: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del tutor debe ser un número válido' });
            return;
        }

        const tutor = await tutorService.obtenerTutorPorId(id);

        if (!tutor) {
            res.status(404).json({ error: 'El tutor no existe en los registros' });
            return;
        }

        res.status(200).json(tutor);

    } catch (error: any) {
        console.error('Error al obtener tutor:', error.message);
        res.status(500).json({ error: 'Error interno al consultar el tutor' });
    }
};

export const obtenerTutorporRut: RequestHandler = async (req, res): Promise<void> => {
    try {
        const rut = req.params.rut as string;
        
        if (!rut) {
            res.status(400).json({ error: 'El RUT es requerido' });
            return;
        }

        const tutor = await tutorService.obtenerTutorPorRut(rut);

        if (!tutor) {
            res.status(404).json({ message: 'Tutor no encontrado en el sistema' });
            return;
        }

        res.status(200).json({ tutor });

    } catch (error: any) {
        console.error('Error al buscar tutor por RUT:', error.message);
        res.status(500).json({ message: 'Error al buscar el tutor', error: error.message });
    }
};

export const editarTutor: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del tutor debe ser un número válido en la URL' });
            return;
        }

        const datos = req.body;
        const datosLimpios: any = {};

        // mapeo de los datos
        if (datos.rut) datosLimpios.rut = datos.rut;
        if (datos.nombre) datosLimpios.nombre = datos.nombre;
        if (datos.apellido) datosLimpios.apellido = datos.apellido;
        if (datos.telefono) datosLimpios.telefono = datos.telefono;
        if (datos.parentesco) datosLimpios.parentesco = datos.parentesco;
        if (datos.correo !== undefined) datosLimpios.correo = datos.correo;
        if (datos.direccion) datosLimpios.direccion = datos.direccion;
        if (datos.sector !== undefined) datosLimpios.sector = datos.sector;
        if (datos.comuna) datosLimpios.comuna = datos.comuna;

        const resultado = await tutorService.editarTutor(id, datosLimpios);

        res.status(200).json({
            mensaje: 'Tutor actualizado con éxito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('Error al actualizar tutor:', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El tutor que intentas editar no existe en la base de datos' });
            return;
        }

        if (error.code === 'P2002') {
            res.status(400).json({ error: 'El RUT ya está registrado en el sistema' });
            return;
        }

        res.status(500).json({ error: 'Error interno al actualizar la base de datos', detalle: error.message });
    }
};

export const eliminarTutor: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del tutor debe ser un número válido' });
            return;
        }

        await tutorService.eliminarTutor(id);

        res.status(200).json({ mensaje: `El tutor con id ${id} fue eliminado` });

    } catch (error: any) {
        console.error('Error al eliminar tutor:', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El tutor que intentas eliminar no existe' });
            return;
        }

        res.status(500).json({ error: 'Error interno al eliminar el tutor' });
    }
};
