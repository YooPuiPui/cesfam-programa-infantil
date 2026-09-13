import { Router } from "express";
import {
        crearSesion,
        obtenerSesionesPorTaller,
        obtenerSesionPorId,
        editarSesion,
        eliminarSesion
} from "../controllers/sesionTaller.controller";
import { verificarToken } from '../middlewares/authMiddleware';

//? Router anidado: todo lo que depende de un taller específico.
//? mergeParams es obligatorio para que :idTaller del padre llegue al controlador.
const routerAnidado = Router({ mergeParams: true });
routerAnidado.post('/', verificarToken, crearSesion);
routerAnidado.get('/', verificarToken, obtenerSesionesPorTaller);

//? Router plano: operaciones sobre una sesión puntual, ya conocido su id
const routerPlano = Router();
routerPlano.get('/:id', verificarToken, obtenerSesionPorId);
routerPlano.put('/:id', verificarToken, editarSesion);
routerPlano.delete('/:id', verificarToken, eliminarSesion);

export { routerAnidado, routerPlano };
