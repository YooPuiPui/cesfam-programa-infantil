import { Request, Response, RequestHandler } from "express";
import * as controlService from '../services/controlClinico.service';
import prisma from "../config/prisma";
import { hoyChileMediodiaUTC, fechaCalendarioAMediodiaUTC } from '../utils/fechaChile';




export const crearControl: RequestHandler = async (req, res): Promise<void> => {
    try {
        const { paciente, control, tutor } = req.body;

        //* validacion inicial
        if (!paciente || !paciente.rut || !control) {
            res.status(400).json({
                error: 'JSON inválido. Debes enviar el "rut" dentro del bloque "paciente" y los datos en el bloque "control".'
            });
            return;
        }

        //? el imc solo aplica desde los 2 años (24 meses), antes se usa peso/edad que ya va en peso_kg
        const edadMesesNum = Number(control.edad_meses);
        const aplicaImc = !Number.isNaN(edadMesesNum) && edadMesesNum >= 24;

        //! campos obligatorios del control
        //? edad_meses no se valida con "!" porque 0 meses (recien nacido) es valido
        if (
            control.edad_meses === undefined || control.edad_meses === null ||
            !control.peso_kg || !control.talla_cm ||
            (aplicaImc && !control.imc) ||
            !control.fecha_proximoControl || !control.rut_profesional
        ) {
            res.status(400).json({
                error: 'Faltan datos obligatorios en el control (edad, peso, talla, fecha_proximoControl, rut_profesional, y el imc si el paciente tiene 2 años o más).'
            });
            return;
        }

        let id_paciente_final: number;

        const pacienteExistente = await prisma.paciente.findUnique({
            where: { rut: paciente.rut }
        });

        if (pacienteExistente) {
            id_paciente_final = pacienteExistente.id_paciente;
        } else {
            //! el paciente tiene que estar creado antes
            res.status(404).json({
                error: `No se encontró ningún paciente con el RUT ${paciente.rut}. Por favor, registre al paciente en Admisión primero.`
            });
            return;
        }

        //! un paciente desactivado no admite controles nuevos
        if (!pacienteExistente.activo) {
            res.status(400).json({ error: 'El paciente está desactivado. Reactívalo para registrar controles.' });
            return;
        }

        const fechaProximoControl = fechaCalendarioAMediodiaUTC(control.fecha_proximoControl);
        if (!fechaProximoControl) {
            res.status(400).json({ error: 'La fecha del próximo control no es válida. Usa el formato AAAA-MM-DD.' });
            return;
        }

        //* limpia los datos y pasa los numeros a number
        const controlLimpio = {
            fecha_control: hoyChileMediodiaUTC(),
            motivo_consulta: control.motivo_consulta || null,
            anamnesis: control.anamnesis || null,
            exploracion_fisica: control.exploracion_fisica || null,
            edad_meses: parseInt(control.edad_meses),
            peso_kg: parseFloat(control.peso_kg),
            talla_cm: parseFloat(control.talla_cm),
            perimetro_cefalico: control.perimetro_cefalico ? parseFloat(control.perimetro_cefalico) : null,
            imc: aplicaImc ? parseFloat(control.imc) : null,
            problemas_diagnosticados: control.problemas_diagnosticados || null,
            indicaciones_acuerdos: control.indicaciones_acuerdos || null,
            fecha_proximoControl: fechaProximoControl,

            // inyectamos el id que se encontró gracais al rut
            rut_paciente: pacienteExistente.rut,

            rut_profesional: control.rut_profesional,
        };


        const resultado = await controlService.crearControl(controlLimpio);

        res.status(201).json({
            mensaje: 'Control clínico creado con éxito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('ERROR AL CREAR CONTROL:', error);

        if (error.code === 'P2003') {
            res.status(400).json({ error: 'El profesional especificado no existe en la base de datos.' });
            return;
        }

        res.status(500).json({ error: 'Error interno en la Base de Datos' });
    }
};

export const obtenerControles: RequestHandler = async (req, res): Promise<void> => {
    try {
        const controles = await controlService.buscarControl();
        res.status(200).json(controles);
    } catch (error: any) {
        console.error('ERROR AL OBTENER CONTROLES:', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};

export const obtenerControlPorRut: RequestHandler = async (req, res): Promise<void> => {
    try {
        const rut = req.params.rut as string;

        if (!rut || rut.trim() === '') {
            res.status(400).json({ error: 'El RUT del paciente es obligatorio' });
            return;
        }
        const control = await controlService.buscarControlPorRut(rut);

        if (!control || control.length === 0) {
            res.status(404).json({ error: 'El control no existe en los registros' });
            return;
        }

        res.status(200).json(control);

    } catch (error: any) {
        console.error('Error al obtener control:', error.message);
        res.status(500).json({ error: 'Error interno al consultar el control' });
    }
};

export const editarControl: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del control debe ser un número válido en la URL' });
            return;
        }

        //! un control de un paciente desactivado no se puede editar
        const controlActual = await controlService.buscarControlPorId(id);

        if (!controlActual) {
            res.status(404).json({ error: 'El control que intentas editar no existe en la base de datos' });
            return;
        }

        if (!controlActual.paciente.activo) {
            res.status(400).json({ error: 'El paciente está desactivado. Reactívalo para editar controles.' });
            return;
        }

        const datos = req.body;
        const datosLimpios: any = {};

        if (datos.edad_meses !== undefined) datosLimpios.edad_meses = parseInt(datos.edad_meses);
        if (datos.motivo_consulta !== undefined) datosLimpios.motivo_consulta = datos.motivo_consulta;
        if (datos.anamnesis !== undefined) datosLimpios.anamnesis = datos.anamnesis;
        if (datos.exploracion_fisica !== undefined) datosLimpios.exploracion_fisica = datos.exploracion_fisica;
        if (datos.peso_kg !== undefined) datosLimpios.peso_kg = parseFloat(datos.peso_kg);
        if (datos.talla_cm !== undefined) datosLimpios.talla_cm = parseFloat(datos.talla_cm);
        if (datos.perimetro_cefalico !== undefined) datosLimpios.perimetro_cefalico = datos.perimetro_cefalico ? parseFloat(datos.perimetro_cefalico) : null;
        if (datos.imc !== undefined) datosLimpios.imc = datos.imc ? parseFloat(datos.imc) : null;
        if (datos.problemas_diagnosticados !== undefined) datosLimpios.problemas_diagnosticados = datos.problemas_diagnosticados;
        if (datos.indicaciones_acuerdos !== undefined) datosLimpios.indicaciones_acuerdos = datos.indicaciones_acuerdos;
        if (datos.fecha_proximoControl !== undefined) {
            const fechaProximoControl = fechaCalendarioAMediodiaUTC(datos.fecha_proximoControl);
            if (!fechaProximoControl) {
                res.status(400).json({ error: 'La fecha del próximo control no es válida. Usa el formato AAAA-MM-DD.' });
                return;
            }
            datosLimpios.fecha_proximoControl = fechaProximoControl;
        }
        if (datos.rut_paciente !== undefined) {
            datosLimpios.rut_paciente = String(datos.rut_paciente).trim();

            //! tampoco se puede mover el control a un paciente desactivado
            if (datosLimpios.rut_paciente !== controlActual.rut_paciente) {
                const pacienteDestino = await prisma.paciente.findUnique({ where: { rut: datosLimpios.rut_paciente } });

                if (pacienteDestino && !pacienteDestino.activo) {
                    res.status(400).json({ error: 'El paciente está desactivado. Reactívalo para editar controles.' });
                    return;
                }
            }
        }
        if (datos.rut_profesional !== undefined) datosLimpios.rut_profesional = datos.rut_profesional;

        const resultado = await controlService.editarControl(id, datosLimpios);

        res.status(200).json({
            mensaje: 'Control actualizado con éxito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('Error al actualizar control:', error);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El control que intentas editar no existe en la base de datos' });
            return;
        }

        if (error.code === 'P2003') {
            res.status(400).json({ error: 'El paciente o profesional no existe' });
            return;
        }

        res.status(500).json({ error: 'Error interno al actualizar la base de datos' });
    }
};

export const eliminarControl: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del control debe ser un número válido' });
            return;
        }

        await controlService.eliminarControl(id);

        res.status(200).json({ mensaje: `El control con id ${id} fue eliminado` });

    } catch (error: any) {
        console.error('Error al eliminar control:', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El control que intentas eliminar no existe' });
            return;
        }

        res.status(500).json({ error: 'Error interno al eliminar el control' });
    }
};

export const obtenerControlPorId: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).json({ error: 'El id del control debe ser un número válido' });
            return;
        }

        const control = await controlService.buscarControlPorId(id);

        if (!control) {
            res.status(404).json({ error: 'El control clínico solicitado no existe' });
            return;
        }

        res.status(200).json(control);
    } catch (error: any) {
        console.error('Error al obtener control por ID:', error.message);
        res.status(500).json({ error: 'Error interno al consultar el control' });
    }
};

export const obtenerControlesPaginado: RequestHandler = async (req, res): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 30;
        const filtro = req.query.filtro as string | undefined;
        const fechaDesde = req.query.fechaDesde as string | undefined;
        const fechaHasta = req.query.fechaHasta as string | undefined;
        const orden = req.query.orden as string | undefined;
        const busqueda = req.query.busqueda as string | undefined;

        const resultado = await controlService.buscarControlPaginado(page, limit, filtro, fechaDesde, fechaHasta, orden, busqueda);
        res.status(200).json(resultado);
    } catch (error: any) {
        console.error('ERROR AL OBTENER CONTROLES PAGINADOS:', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};

export const obtenerConteosAgenda: RequestHandler = async (req, res): Promise<void> => {
    try {
        const conteos = await controlService.obtenerConteosAgenda();
        res.status(200).json(conteos);
    } catch (error: any) {
        console.error('ERROR AL OBTENER CONTEOS DE AGENDA:', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};