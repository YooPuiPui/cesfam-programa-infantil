import { Router } from "express";
import { 
    crearControl, 
    obtenerControlPorRut, 
    obtenerControles, 
    editarControl, 
<<<<<<< HEAD
    eliminarControl 
=======
    eliminarControl,
    obtenerControlPorId
>>>>>>> feat/vista-ficha-pacientes
} from "../controllers/controlClinico.controller";

const router = Router();

<<<<<<< HEAD
router.post('/', crearControl);
router.get('/:rut', obtenerControlPorRut);
router.get('/', obtenerControles);
=======
router.get('/', obtenerControles);
router.post('/', crearControl);
router.get('/detalle/:id', obtenerControlPorId);
router.get('/:rut', obtenerControlPorRut);
>>>>>>> feat/vista-ficha-pacientes
router.put('/:id', editarControl);
router.delete('/:id', eliminarControl);

export default router;