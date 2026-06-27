import { Request, Response, RequestHandler } from 'express';
import * as pacienteService from '../services/paciente.service';
import prisma from '../config/prisma';

export const crearPaciente = async (req: Request, res: Response): Promise<void> => {
    try {
        const { paciente, tutor } = req.body;

        // validación 
        if (!paciente || !tutor) {
            res.status(400).json({ error: 'Faltan datos del paciente o del tutor en la petición' });
            return;
        }



        const pacienteLimpio = {
            rut: paciente.rut,
            nombre: paciente.nombre,
            apellido: paciente.apellido,
            nombre_social: paciente.nombre_social,
            fecha_nacimiento: new Date(paciente.fecha_nacimiento),
            sexo_biologico: paciente.sexo_biologico,
            identidad_genero: paciente.identidad_genero,
            nacionalidad: paciente.nacionalidad || 'Chilena',
            direccion: paciente.direccion,
            sector: paciente.sector,
            comuna: paciente.comuna,
            nhc: paciente.nhc,
            prevision: paciente.prevision,
            activo: paciente.activo !== undefined ? paciente.activo : true,
            fecha_inscripcion: paciente.fecha_inscripcion ? new Date(paciente.fecha_inscripcion) : new Date(),
            es_sename: paciente.es_sename !== undefined ? paciente.es_sename : false,
            es_naneas_prematuro: paciente.es_naneas_prematuro !== undefined ? paciente.es_naneas_prematuro : false,
            es_poblacion_trans: paciente.es_poblacion_trans !== undefined ? paciente.es_poblacion_trans : false,
            es_migrante: paciente.es_migrante !== undefined ? paciente.es_migrante : false,
        };


        const tutorLimpio = {
            rut: tutor.rut,
            nombre: tutor.nombre,
            apellido: tutor.apellido,
            telefono: tutor.telefono,
            parentesco: tutor.parentesco,
            correo: tutor.correo,
            direccion: tutor.direccion,
            comuna: tutor.comuna,
        };


        const resultado = await pacienteService.crearPacienteConTutor(pacienteLimpio, tutorLimpio);

        res.status(201).json({
            mensaje: 'Paciente y Tutor creados con éxito',
            datos: resultado,
        });

    } catch (error: any) {

        console.error(' ERROR ATRAPADO EN EL CONTROLADOR ');
        console.error('Motivo del fallo:', error.message);

        // Validar si es un error de RUT duplicado
        if (error.message && error.message.includes('Ya existe un paciente con el RUT')) {
            res.status(400).json({
                error: 'RUT duplicado',
                detalle: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Error interno en la Base de Datos',
            detalle: error.message
        });
    }
};


export const editarPaciente = async (req: Request, res: Response): Promise<void> => {

    try {
        //* saca el id de la url
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del paciente debe ser un numero valido en la url' });
            return;
        }

        const datos = req.body;
        const datosLimpios: any = {};

        if (datos.nombre) datosLimpios.nombre = datos.nombre;
        if (datos.apellido) datosLimpios.apellido = datos.apellido;
        if (datos.nombre_social) datosLimpios.nombre_social = datos.nombre_social;
        if (datos.fecha_nacimiento) { datosLimpios.fecha_nacimiento = new Date(datos.fecha_nacimiento); }
        if (datos.sexo_biologico) datosLimpios.sexo_biologico = datos.sexo_biologico;
        if (datos.identidad_genero) datosLimpios.identidad_genero = datos.identidad_genero;
        if (datos.nacionalidad) datosLimpios.nacionalidad = datos.nacionalidad;
        if (datos.direccion) datosLimpios.direccion = datos.direccion
        if (datos.sector) datosLimpios.sector = datos.sector;
        if (datos.comuna) datosLimpios.comuna = datos.comuna;
        if (datos.nhc) datosLimpios.nhc = datos.nhc;
        if (datos.prevision) datosLimpios.prevision = datos.prevision;
        if (datos.fecha_inscripcion) datosLimpios.fecha_inscripcion = datos.fecha_inscripcion;
        if (datos.activo !== undefined) datosLimpios.activo = datos.activo;
        const resultado = await pacienteService.actualizarPaciente(id, datosLimpios);

        res.status(200).json({
            mensaje: 'Paciente actualizado con exito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('Error al actualizar al paciente', error.message);


        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El paciente que intentas editar no existe en la base de datos' });
            return;
        }

        res.status(500).json({
            error: 'Error interno al actualizar la db',
            detalle: error.message
        });
    }
};
/*
export const obtenerTodosLosPacientes = async (req: Request, res: Response): Promise<void> => {
    try {
        const pacientes = await pacienteService.obtenerTodosLosPacientes();

        res.status(200).json(pacientes);
    } catch (error: any) {

        console.error(' Error al obtener pacientas', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};
*/

export const obtenerPacientes = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 30;
        const skip = (page - 1) * limit;

        // Prisma ejecuta ambas consultas eficientemente
        const [data, total] = await Promise.all([
            prisma.paciente.findMany({
                skip: skip,
                take: limit,
                orderBy: { creado_en: 'desc' }
            }),
            prisma.paciente.count()
        ]);

        res.status(200).json({
            data: data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('🚨 Error al obtener pacientes:', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};

export const obtenerPaciente: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del paciente debe ser un número valido' });
            return;
        }

        const paciente = await pacienteService.obtenerPacientePorId(id);

        if (!paciente) {
            // 🚨 AQUÍ ESTABA EL ERROR DE SINTAXIS. Ahora tiene su "clave: valor"
            res.status(404).json({ error: 'El paciente no existe en los registros' });
            return;
        }

        res.status(200).json(paciente);

    } catch (error: any) {
        console.error('Error al obtener paciente', error.message);
        res.status(500).json({ error: 'Error interno al consultar el paciente' });
    }
};

export const borrarPaciente: RequestHandler = async (req, res): Promise<void> => {

    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del paciente debe ser un numero valido' });
            return;
        }

        //llama el service
        await pacienteService.eliminarPaciente(id);

        res.status(200).json({ mensaje: `EL paciente con id ${id} fue eliminado` });


    } catch (error: any) {
        console.error(' Error al eliminar al paciente', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El paciente que intentas eliminar no existe' });
            return;
        }

        res.status(500).json({ error: 'Error interno al eliminar el paciente ' });

    }
};

// src/controllers/paciente.controller.ts

export const obtenerPacientePorRut: RequestHandler = async (req, res): Promise<void> => {
    try {
        // 1. Forzamos a que el RUT sea leído como un único String
        const rut = req.params.rut as string;

        // 2. Si por alguna razón viene vacío, cortamos de inmediato
        if (!rut) {
            res.status(400).json({ error: 'Debes proporcionar un RUT' });
            return;
        }

        // 3. Prisma ya no se quejará
        const paciente = await prisma.paciente.findUnique({
            where: { rut: rut },
            include: {
                tutor: true
            }
        });

        if (!paciente) {
            res.status(404).json({ error: 'El paciente no existe en los registros' });
            return;
        }

        res.status(200).json(paciente);
    } catch (error: any) {
        console.error('Error al obtener paciente por RUT:', error.message);
        res.status(500).json({ error: 'Error interno al consultar el paciente' });
    }
};