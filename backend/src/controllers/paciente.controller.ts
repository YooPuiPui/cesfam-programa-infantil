import { Request, Response, RequestHandler } from 'express';
import * as pacienteService from '../services/paciente.service';

export const crearPaciente = async (req: Request, res: Response): Promise<void> => {
    try {
        const { paciente, tutor } = req.body;

        // Validación básica de supervivencia
        if (!paciente || !tutor) {
            res.status(400).json({ error: 'Faltan datos del paciente o del tutor en la petición' });
            return;
        }


        // Extraemos solo los campos que existen en el schema
        const pacienteLimpio = {
            rut: paciente.rut,
            nombre: paciente.nombre,
            apellido: paciente.apellido,
            fecha_nacimiento: new Date(paciente.fecha_nacimiento),
            sexo_biologico: paciente.sexo_biologico,
            nacionalidad: paciente.nacionalidad || 'Chilena',
            direccion: paciente.direccion,
            sector: paciente.sector,
            comuna: paciente.comuna,
            nhc: paciente.nhc,
            prevision: paciente.prevision,
            activo: paciente.activo !== undefined ? paciente.activo : true,
            fecha_inscripcion: paciente.fecha_inscripcion ? new Date(paciente.fecha_inscripcion) : undefined
        };


        const tutorLimpio = {
            rut: tutor.rut,
            nombre: tutor.nombre,
            apellido: tutor.apellido,
            telefono: tutor.telefono,
            parentesco: tutor.parentesco,
            correo: tutor.correo,
            direccion: tutor.direccion,
            comuna: tutor.comuna
        };

        // Mandamos los datos limpios al servicio
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

        // Prisma arroja el código P2025 cuando intentas actualizar un ID que no existe
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

export const obtenerTodosLosPacientes = async (req: Request, res: Response): Promise<void> => {
    try {
        const pacientes = await pacienteService.obtenerTodosLosPacientes();

        res.status(200).json(pacientes);
    } catch (error: any) {

        console.error(' Error al obtener pacientas', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};

// Forzamos a que TS entienda que esto es un RequestHandler oficial
export const obtenerPacientes: RequestHandler = async (req, res) => {
    try {
        const pacientes = await pacienteService.obtenerTodosLosPacientes();
        res.status(200).json(pacientes);
    } catch (error: any) {
        console.error('🚨 ERROR AL OBTENER PACIENTES 🚨', error.message);
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