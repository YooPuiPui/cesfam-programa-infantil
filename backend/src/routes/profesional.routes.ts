import { Router } from 'express';
import {
    crearProfesional,
    editarProfesional,
    obtenerTodosLosProfesionales,
    obtenerProfesional,
    borrarProfesional
} from '../controllers/profesional.controller';
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/',verificarToken, crearProfesional);
router.get('/',verificarToken, obtenerTodosLosProfesionales);
router.get('/:id',verificarToken, obtenerProfesional);
router.put('/:id',verificarToken, editarProfesional);
router.delete('/:id',verificarToken, borrarProfesional);

export default router;