import { Router } from "express";
import {
    crearInscripcion,
    obtenerInscripcionesPorSesion,
    obtenerInscripcionesPorPaciente,
    editarInscripcion,
    eliminarInscripcion,
} from "../controllers/inscripcionTaller.controller";
import { verificarToken } from "../middlewares/authMiddleware";

//?!anidado bajo una sesion /api/sesiones/:idSesion/inscripciones
const routerPorSesion = Router({ mergeParams: true });

routerPorSesion.post('/', verificarToken, crearInscripcion);
routerPorSesion.get('/', verificarToken, obtenerInscripcionesPorSesion);


//!anidado bajo un paciente api/pacientes/:rut/inscripciones-talleres
const routerPorPaciente = Router({ mergeParams: true });

routerPorPaciente.get('/', verificarToken, obtenerInscripcionesPorPaciente);


//! plano opera sobre una sesion especifica 
const routerPlano = Router();

routerPlano.put('/:id', verificarToken, editarInscripcion);
routerPlano.delete('/:id', verificarToken, eliminarInscripcion);



export { routerPorSesion, routerPorPaciente, routerPlano };