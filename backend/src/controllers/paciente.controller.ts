import { Request, Response, RequestHandler } from 'express';
import * as pacienteService from '../services/paciente.service';
import prisma from '../config/prisma';
import { normalizarTexto } from '../services/importacion.service';
import { validarRut } from '../utils/validarRut';
import { validarDiagnosticosIds } from '../services/diagnostico.service';
import { aplanarDiagnosticos, incluirDiagnosticos } from '../utils/aplanarDiagnosticos';
import { resolverEstadoPaciente } from '../utils/estadoPaciente';

//? revisa que el id_comuna sea un entero y exista en la tabla Comuna
const comunaExiste = async (idComuna: any): Promise<boolean> => {
    const id = Number(idComuna);
    if (!Number.isInteger(id)) return false;

    const comuna = await prisma.comuna.findUnique({ where: { id_comuna: id } });
    return comuna !== null;
};

//? el cuidador llega plano (cuidador_nombre/telefono/parentesco), se limpian los espacios
const textoLimpio = (valor: any): string => String(valor ?? '').trim();

export const crearPaciente = async (req: Request, res: Response): Promise<void> => {
    try {
        const { paciente, tutor } = req.body;

        //* validacion
        if (!paciente || !tutor) {
            res.status(400).json({ error: 'Faltan datos del paciente o del tutor en la petición' });
            return;
        }

        if (!validarRut(paciente.rut)) {
            res.status(400).json({ error: 'El RUT del paciente no es válido. Revisa el dígito verificador.' });
            return;
        }

        if (!validarRut(tutor.rut)) {
            res.status(400).json({ error: 'El RUT del tutor no es válido. Revisa el dígito verificador.' });
            return;
        }

        //! las comunas del paciente y del tutor deben existir
        if (!(await comunaExiste(paciente.id_comuna))) {
            res.status(400).json({ error: 'La comuna del paciente no existe.' });
            return;
        }

        if (!(await comunaExiste(tutor.id_comuna))) {
            res.status(400).json({ error: 'La comuna del tutor no existe.' });
            return;
        }

        //* cuidador: con nombre se crea; telefono/parentesco solos no se pueden guardar
        const cuidadorNombre = textoLimpio(paciente.cuidador_nombre);
        const cuidadorApellidos = textoLimpio(paciente.cuidador_apellidos);
        const cuidadorTelefono = textoLimpio(paciente.cuidador_telefono);
        const cuidadorParentesco = textoLimpio(paciente.cuidador_parentesco);

        if (!cuidadorNombre && (cuidadorApellidos || cuidadorTelefono || cuidadorParentesco)) {
            res.status(400).json({ error: 'Para registrar un cuidador debes indicar su nombre.' });
            return;
        }

        const cuidadorLimpio = cuidadorNombre
            ? {
                nombre: cuidadorNombre,
                apellidos: cuidadorApellidos || null,
                telefono: cuidadorTelefono || null,
                parentesco: cuidadorParentesco || null,
            }
            : null;

        //! los diagnosticos deben ser condiciones de base activas del catalogo
        const diagnosticos = await validarDiagnosticosIds(paciente.diagnosticos_ids ?? [], 'CONDICION');
        if ('error' in diagnosticos) {
            res.status(400).json({ error: diagnosticos.error });
            return;
        }

        //! inscribir un paciente ya desactivado exige las mismas reglas que desactivarlo
        const estado = resolverEstadoPaciente(paciente);
        if ('error' in estado) {
            res.status(400).json({ error: estado.error });
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
            id_comuna: Number(paciente.id_comuna),
            nhc: paciente.nhc,
            prevision: paciente.prevision,
            //? sin "activo" en el body queda activo
            ...estado.datos,
            fecha_inscripcion: paciente.fecha_inscripcion ? new Date(paciente.fecha_inscripcion) : new Date(),
            es_sename: paciente.es_sename !== undefined ? paciente.es_sename : false,
            es_naneas_prematuro: paciente.es_naneas_prematuro !== undefined ? paciente.es_naneas_prematuro : false,
            es_poblacion_trans: paciente.es_poblacion_trans !== undefined ? paciente.es_poblacion_trans : false,
            es_migrante: paciente.es_migrante !== undefined ? paciente.es_migrante : false,
            es_salud_mental: paciente.es_salud_mental !== undefined ? paciente.es_salud_mental : false,
            credencial_discapacidad: paciente.credencial_discapacidad || 'sin_dato',
            credencial_discapacidad_detalle: paciente.credencial_discapacidad_detalle || null,
        };


        const tutorLimpio = {
            rut: tutor.rut,
            nombre: tutor.nombre,
            apellido: tutor.apellido,
            telefono: tutor.telefono,
            telefono_secundario: tutor.telefono_secundario || null,
            parentesco: tutor.parentesco,
            correo: tutor.correo,
            direccion: tutor.direccion,
            id_comuna: Number(tutor.id_comuna),
        };


        const resultado = await pacienteService.crearPacienteConTutor(pacienteLimpio, tutorLimpio, cuidadorLimpio, diagnosticos.ids);

        res.status(201).json({
            mensaje: 'Paciente y Tutor creados con éxito',
            datos: resultado,
        });

    } catch (error: any) {

        console.error(' ERROR ATRAPADO EN EL CONTROLADOR ');
        console.error('Motivo del fallo:', error);

        //! rut duplicado
        if (error.message && error.message.includes('Ya existe un paciente con el RUT')) {
            res.status(400).json({
                error: 'RUT duplicado',
                detalle: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Error interno en la Base de Datos'
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

        //! desactivar exige motivo y reactivar borra los datos de la desactivacion
        const estado = resolverEstadoPaciente(datos);
        if ('error' in estado) {
            res.status(400).json({ error: estado.error });
            return;
        }

        //! un paciente desactivado no se edita, lo unico que acepta es reactivarlo
        //? asi tampoco se pisan el motivo y la fecha originales, si el paciente no existe el update responde 404
        if (estado.datos.activo !== true) {
            const actual = await prisma.paciente.findUnique({ where: { id_paciente: id }, select: { activo: true } });
            if (actual && !actual.activo) {
                res.status(400).json({
                    error: estado.datos.activo === false
                        ? 'El paciente ya está desactivado. Reactívalo si necesitas cambiar el motivo.'
                        : 'El paciente está desactivado. Reactívalo para editar sus datos.',
                });
                return;
            }
        }

        if (datos.nombre) datosLimpios.nombre = datos.nombre;
        if (datos.apellido) datosLimpios.apellido = datos.apellido;
        if (datos.nombre_social) datosLimpios.nombre_social = datos.nombre_social;
        if (datos.fecha_nacimiento) { datosLimpios.fecha_nacimiento = new Date(datos.fecha_nacimiento); }
        if (datos.sexo_biologico) datosLimpios.sexo_biologico = datos.sexo_biologico;
        if (datos.identidad_genero) datosLimpios.identidad_genero = datos.identidad_genero;
        if (datos.nacionalidad) datosLimpios.nacionalidad = datos.nacionalidad;
        if (datos.direccion) datosLimpios.direccion = datos.direccion
        if (datos.sector) datosLimpios.sector = datos.sector;
        if (datos.id_comuna !== undefined) {
            if (!(await comunaExiste(datos.id_comuna))) {
                res.status(400).json({ error: 'La comuna del paciente no existe.' });
                return;
            }
            datosLimpios.id_comuna = Number(datos.id_comuna);
        }
        if (datos.nhc) datosLimpios.nhc = datos.nhc;
        if (datos.prevision) datosLimpios.prevision = datos.prevision;
        if (datos.fecha_inscripcion) datosLimpios.fecha_inscripcion = datos.fecha_inscripcion;

        Object.assign(datosLimpios, estado.datos);

        //! flags de riesgo social: van con "!== undefined" porque si se desmarca una casilla (false) un if normal no lo guardaria
        if (datos.es_sename !== undefined) datosLimpios.es_sename = datos.es_sename;
        if (datos.es_naneas_prematuro !== undefined) datosLimpios.es_naneas_prematuro = datos.es_naneas_prematuro;
        if (datos.es_migrante !== undefined) datosLimpios.es_migrante = datos.es_migrante;
        if (datos.es_poblacion_trans !== undefined) datosLimpios.es_poblacion_trans = datos.es_poblacion_trans;
        if (datos.es_salud_mental !== undefined) datosLimpios.es_salud_mental = datos.es_salud_mental;

        if (datos.credencial_discapacidad !== undefined) datosLimpios.credencial_discapacidad = datos.credencial_discapacidad;
        if (datos.credencial_discapacidad_detalle !== undefined) datosLimpios.credencial_discapacidad_detalle = datos.credencial_discapacidad_detalle;

        //* cuidador: solo se toca si viene alguno de los cuatro campos
        //? undefined = no tocar, null = desvincular del paciente, objeto = actualizar o crear
        let datosCuidador: { nombre: string; apellidos?: string | null; telefono?: string | null; parentesco?: string | null } | null | undefined = undefined;

        if (datos.cuidador_nombre !== undefined || datos.cuidador_apellidos !== undefined || datos.cuidador_telefono !== undefined || datos.cuidador_parentesco !== undefined) {
            const cuidadorNombre = textoLimpio(datos.cuidador_nombre);
            const cuidadorApellidos = textoLimpio(datos.cuidador_apellidos);
            const cuidadorTelefono = textoLimpio(datos.cuidador_telefono);
            const cuidadorParentesco = textoLimpio(datos.cuidador_parentesco);

            if (cuidadorNombre) {
                datosCuidador = { nombre: cuidadorNombre };
                if (datos.cuidador_apellidos !== undefined) datosCuidador.apellidos = cuidadorApellidos || null;
                if (datos.cuidador_telefono !== undefined) datosCuidador.telefono = cuidadorTelefono || null;
                if (datos.cuidador_parentesco !== undefined) datosCuidador.parentesco = cuidadorParentesco || null;
            } else if (cuidadorApellidos || cuidadorTelefono || cuidadorParentesco) {
                res.status(400).json({ error: 'Para registrar un cuidador debes indicar su nombre.' });
                return;
            } else {
                datosCuidador = null;
            }
        }

        //! los diagnosticos solo se reemplazan si vienen en el body
        let diagnosticosIds: number[] | undefined = undefined;

        if (datos.diagnosticos_ids !== undefined) {
            const diagnosticos = await validarDiagnosticosIds(datos.diagnosticos_ids, 'CONDICION');
            if ('error' in diagnosticos) {
                res.status(400).json({ error: diagnosticos.error });
                return;
            }
            diagnosticosIds = diagnosticos.ids;
        }

        const resultado = await pacienteService.actualizarPaciente(id, datosLimpios, datosCuidador, diagnosticosIds);

        res.status(200).json({
            mensaje: 'Paciente actualizado con exito',
            datos: resultado,
        });

    } catch (error: any) {
        console.error('Error al actualizar al paciente', error);


        if (error.code === 'P2025') {
            res.status(404).json({ error: 'El paciente que intentas editar no existe en la base de datos' });
            return;
        }

        res.status(500).json({
            error: 'Error interno al actualizar la db'
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
        const riesgo = req.query.riesgo as string | undefined;
        const busqueda = req.query.busqueda as string | undefined;

        let where: any = {};

        switch (riesgo) {
            case 'sename':
                where.es_sename = true;
                break;
            case 'naneas':
                where.es_naneas_prematuro = true;
                break;
            case 'trans':
                where.es_poblacion_trans = true;
                break;
            case 'migrante':
                where.es_migrante = true;
                break;
            case 'regular':
                where = {
                    es_sename: false,
                    es_naneas_prematuro: false,
                    es_poblacion_trans: false,
                    es_migrante: false,
                };
                break;
            case 'inactivo':
                where.activo = false;
                break;
        }

        //? los desactivados van al final, dentro de cada grupo los mas recientes primero
        const orden = [{ activo: 'desc' as const }, { creado_en: 'desc' as const }];

        //? "insensitive" de postgres ignora mayusculas pero no tildes, por eso se filtra en memoria
        if (busqueda && busqueda.trim() !== '') {
            const palabrasBuscadas = normalizarTexto(busqueda).split(/\s+/);

            const candidatos = await prisma.paciente.findMany({
                where,
                orderBy: orden,
                include: {
                    controlClinico: {
                        orderBy: { fecha_control: 'desc' },
                        take: 1
                    },
                    ...incluirDiagnosticos,
                }
            });

            const filtrados = candidatos.filter((paciente) => {
                const textoPaciente = normalizarTexto(`${paciente.rut} ${paciente.nombre} ${paciente.apellido}`);
                return palabrasBuscadas.every((palabra) => textoPaciente.includes(palabra));
            });

            res.status(200).json({
                data: filtrados.slice(skip, skip + limit).map(aplanarDiagnosticos),
                meta: {
                    total: filtrados.length,
                    page,
                    limit,
                    totalPages: Math.ceil(filtrados.length / limit)
                }
            });
            return;
        }

        const [data, total] = await Promise.all([
            prisma.paciente.findMany({
                where,
                skip: skip,
                take: limit,
                orderBy: orden,
                include: {
                    controlClinico: {
                        orderBy: { fecha_control: 'desc' },
                        take: 1
                    },
                    ...incluirDiagnosticos,
                }
            }),
            prisma.paciente.count({ where })
        ]);

        res.status(200).json({
            data: data.map(aplanarDiagnosticos),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error al obtener pacientes:', error.message);
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

        //* llama al service
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


export const obtenerPacientePorRut: RequestHandler = async (req, res): Promise<void> => {
    try {
        //? el rut viene de la url, se fuerza a string
        const rut = req.params.rut as string;

        //! si viene vacio se corta
        if (!rut) {
            res.status(400).json({ error: 'Debes proporcionar un RUT' });
            return;
        }

        //* busca al paciente con su tutor
        const paciente = await pacienteService.buscarPacientePorRutConTutor(rut);

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

export const obtenerConteosPacientes = async (req: Request, res: Response): Promise<void> => {
    try {
        const conteos = await prisma.paciente.count().then(async (total) => {
            const [sename, naneas, trans, migrante, regular] = await Promise.all([
                prisma.paciente.count({ where: { es_sename: true } }),
                prisma.paciente.count({ where: { es_naneas_prematuro: true } }),
                prisma.paciente.count({ where: { es_poblacion_trans: true } }),
                prisma.paciente.count({ where: { es_migrante: true } }),
                prisma.paciente.count({
                    where: { es_sename: false, es_naneas_prematuro: false, es_poblacion_trans: false, es_migrante: false },
                }),
            ]);
            return { total, sename, naneas, trans, migrante, regular };
        });

        res.status(200).json(conteos);
    } catch (error: any) {
        console.error('Error al obtener conteos de pacientes:', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};

export const obtenerCaracterizacionPacientes: RequestHandler = async (req, res): Promise<void> => {
    try {
        const caracterizacion = await pacienteService.obtenerCaracterizacionPacientes();

        res.status(200).json(caracterizacion);

    } catch (error: any) {
        console.error('Error al obtener la caracterizacion de pacientes:', error.message);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};