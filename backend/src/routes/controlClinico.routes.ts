import { Router } from "express";
import { 
    crearControl, 
    obtenerControlPorRut, 
    obtenerControles, 
    editarControl, 
    eliminarControl,
    obtenerControlPorId,
    obtenerControlesPaginado,
    obtenerConteosAgenda
} from "../controllers/controlClinico.controller";

const router = Router();

router.get('/', obtenerControles);
router.post('/', crearControl);
router.get('/agenda/paginado', obtenerControlesPaginado);
router.get('/agenda/conteos', obtenerConteosAgenda);
router.get('/detalle/:id', obtenerControlPorId);
router.get('/:rut', obtenerControlPorRut);
router.put('/:id', editarControl);
router.delete('/:id', eliminarControl);

export default router;