import { Router } from "express";
import {
        crearSesion,
        obtenerSesionesPorTaller,
        obtenerSesionPorId,
        editarSesion,
        terminarSesion,
        eliminarSesion
} from "../controllers/sesionTaller.controller";
import { verificarToken } from '../middlewares/authMiddleware';

//* anidado bajo un taller /api/talleres/:idTaller/sesiones
//? mergeParams para que :idTaller llegue al controlador
const routerAnidado = Router({ mergeParams: true });
routerAnidado.post('/', verificarToken, crearSesion);
routerAnidado.get('/', verificarToken, obtenerSesionesPorTaller);

//! plano opera sobre una sesion especifica
const routerPlano = Router();
routerPlano.get('/:id', verificarToken, obtenerSesionPorId);
routerPlano.put('/:id', verificarToken, editarSesion);
routerPlano.post('/:id/terminar', verificarToken, terminarSesion);
routerPlano.delete('/:id', verificarToken, eliminarSesion);

export { routerAnidado, routerPlano };
