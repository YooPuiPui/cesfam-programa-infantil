import { Request, Response, RequestHandler } from "express";
import * as controlService from '../services/controlClinico.service';
import prisma from "../../src/config/prisma";

export const crearControl: RequestHandler = async (req, res): Promise<void> => {
    try {
<<<<<<< HEAD
        
=======

>>>>>>> feat/vista-ficha-pacientes
        const { paciente, control, tutor } = req.body;

        // validacion inicial
        if (!paciente || !paciente.rut || !control) {
            res.status(400).json({
                error: 'JSON inválido. Debes enviar el "rut" dentro del bloque "paciente" y los datos en el bloque "control".'
            });
            return;
        }

        //  validación de campos obligatorios del control
        if (!control.edad_meses || !control.peso_kg || !control.talla_cm || !control.imc ||
            !control.fecha_proximoControl || !control.rut_profesional) {
            res.status(400).json({
                error: 'Faltan datos obligatorios en el control (edad, peso, talla, imc, fecha_proximoControl, id_profesional).'
            });
            return;
        }

        let id_paciente_final: number;

        const pacienteExistente = await prisma.paciente.findUnique({
            where: { rut: paciente.rut }
        });

        if (pacienteExistente) {
<<<<<<< HEAD
            
=======

>>>>>>> feat/vista-ficha-pacientes
            id_paciente_final = pacienteExistente.id_paciente;
        } else {
            // el paciente no existe. 

            res.status(404).json({
                error: `No se encontró ningún paciente con el RUT ${paciente.rut}. Por favor, registre al paciente en Admisión primero.`
            });
            return;
        }

        // mapeo y conversión de tipos usando el ID que acabamos de encontrar
        const controlLimpio = {
<<<<<<< HEAD
=======
            motivo_consulta: control.motivo_consulta || null,
            anamnesis: control.anamnesis || null,
            exploracion_fisica: control.exploracion_fisica || null,
>>>>>>> feat/vista-ficha-pacientes
            edad_meses: parseInt(control.edad_meses),
            peso_kg: parseFloat(control.peso_kg),
            talla_cm: parseFloat(control.talla_cm),
            perimetro_cefalico: control.perimetro_cefalico ? parseFloat(control.perimetro_cefalico) : null,
            imc: parseFloat(control.imc),
            presion_arterial: control.presion_arterial || null,
            diagnostico_nutricional: control.diagnostico_nutricional || null,
            tipo_lactancia: control.tipo_lactancia || null,
            resultado_dpm: control.resultado_dpm || null,
            meses_dpm_aplicado: control.meses_dpm_aplicado ? parseInt(control.meses_dpm_aplicado) : null,
            score_ira: control.score_ira || null,
<<<<<<< HEAD
            problemas_diagnosticados: control.problemas_diagnosticados || null, // Corregí el nombre para que calce con tu Prisma
=======
            problemas_diagnosticados: control.problemas_diagnosticados || null,
>>>>>>> feat/vista-ficha-pacientes
            indicaciones_acuerdos: control.indicaciones_acuerdos || null,
            fecha_proximoControl: new Date(control.fecha_proximoControl),

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
        console.error('ERROR AL CREAR CONTROL:', error.message);

        if (error.code === 'P2003') {
            res.status(400).json({ error: 'El profesional especificado no existe en la base de datos.' });
            return;
        }

        res.status(500).json({ error: 'Error interno en la Base de Datos', detalle: error.message });
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

        const datos = req.body;
        const datosLimpios: any = {};

        if (datos.edad_meses !== undefined) datosLimpios.edad_meses = parseInt(datos.edad_meses);
<<<<<<< HEAD
=======
        if (datos.motivo_consulta !== undefined) datosLimpios.motivo_consulta = datos.motivo_consulta;
        if (datos.anamnesis !== undefined) datosLimpios.anamnesis = datos.anamnesis;
        if (datos.exploracion_fisica !== undefined) datosLimpios.exploracion_fisica = datos.exploracion_fisica;
>>>>>>> feat/vista-ficha-pacientes
        if (datos.peso_kg !== undefined) datosLimpios.peso_kg = parseFloat(datos.peso_kg);
        if (datos.talla_cm !== undefined) datosLimpios.talla_cm = parseFloat(datos.talla_cm);
        if (datos.perimetro_cefalico !== undefined) datosLimpios.perimetro_cefalico = datos.perimetro_cefalico ? parseFloat(datos.perimetro_cefalico) : null;
        if (datos.imc !== undefined) datosLimpios.imc = parseFloat(datos.imc);
        if (datos.presion_arterial !== undefined) datosLimpios.presion_arterial = datos.presion_arterial;
        if (datos.diagnostico_nutricional !== undefined) datosLimpios.diagnostico_nutricional = datos.diagnostico_nutricional;
        if (datos.tipo_lactancia !== undefined) datosLimpios.tipo_lactancia = datos.tipo_lactancia;
        if (datos.resultado_dpm !== undefined) datosLimpios.resultado_dpm = datos.resultado_dpm;
        if (datos.meses_dpm_aplicado !== undefined) datosLimpios.meses_dpm_aplicado = datos.meses_dpm_aplicado ? parseInt(datos.meses_dpm_aplicado) : null;
        if (datos.score_ira !== undefined) datosLimpios.score_ira = datos.score_ira;
<<<<<<< HEAD
        if (datos.problemas_diagnosticos !== undefined) datosLimpios.problemas_diagnosticos = datos.problemas_diagnosticos;
=======
        if (datos.problemas_diagnosticados !== undefined) datosLimpios.problemas_diagnosticados = datos.problemas_diagnosticados;
>>>>>>> feat/vista-ficha-pacientes
        if (datos.indicaciones_acuerdos !== undefined) datosLimpios.indicaciones_acuerdos = datos.indicaciones_acuerdos;
        if (datos.fecha_proximoControl !== undefined) datosLimpios.fecha_proximoControl = new Date(datos.fecha_proximoControl);
        if (datos.rut_paciente !== undefined) datosLimpios.rut_paciente = parseInt(datos.rut_paciente);
        if (datos.rut_profesional !== undefined) datosLimpios.rut_profesional = datos.rut_profesional;

        const resultado = await controlService.editarControl(id, datosLimpios);

        res.status(200).json({
            mensaje: 'Control actualizado con éxito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('Error al actualizar control:', error.message);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El control que intentas editar no existe en la base de datos' });
            return;
        }

        if (error.code === 'P2003') {
            res.status(400).json({ error: 'El paciente o profesional no existe' });
            return;
        }

        res.status(500).json({ error: 'Error interno al actualizar la base de datos', detalle: error.message });
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
<<<<<<< HEAD
};
=======
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
>>>>>>> feat/vista-ficha-pacientes
