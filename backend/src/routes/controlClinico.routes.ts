import { Router } from "express";
import { 
    crearControl, 
    obtenerControlPorRut, 
    obtenerControles, 
    editarControl, 
    eliminarControl 
} from "../controllers/controlClinico.controller";

const router = Router();

router.post('/', crearControl);
router.get('/:rut', obtenerControlPorRut);
router.get('/', obtenerControles);
router.put('/:id', editarControl);
router.delete('/:id', eliminarControl);

export default router;