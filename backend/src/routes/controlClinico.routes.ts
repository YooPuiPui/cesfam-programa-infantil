import { Router } from "express";
import { 
    crearControl, 
    obtenerControlPorRut, 
    obtenerControles, 
    editarControl, 
    eliminarControl,
    obtenerControlPorId
} from "../controllers/controlClinico.controller";

const router = Router();

router.get('/', obtenerControles);
router.post('/', crearControl);
router.get('/detalle/:id', obtenerControlPorId);
router.get('/:rut', obtenerControlPorRut);
router.put('/:id', editarControl);
router.delete('/:id', eliminarControl);

export default router;