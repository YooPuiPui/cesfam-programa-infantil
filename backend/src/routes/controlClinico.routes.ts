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
import { verificarToken } from '../middlewares/authMiddleware';



const router = Router();

router.get('/', verificarToken, obtenerControles);
router.post('/', verificarToken, crearControl);
router.get('/agenda/paginado',verificarToken, obtenerControlesPaginado);
router.get('/agenda/conteos', verificarToken, obtenerConteosAgenda);
router.get('/detalle/:id', verificarToken, obtenerControlPorId);
router.get('/:rut',verificarToken, obtenerControlPorRut);
router.put('/:id',verificarToken, editarControl);
router.delete('/:id',verificarToken, eliminarControl);

export default router;