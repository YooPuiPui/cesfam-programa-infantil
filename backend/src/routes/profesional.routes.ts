import { Router } from 'express';
import {
    crearProfesional,
    editarProfesional,
    obtenerTodosLosProfesionales,
    obtenerProfesional,
    borrarProfesional
} from '../controllers/profesional.controller';

const router = Router();

router.post('/', crearProfesional);
router.get('/', obtenerTodosLosProfesionales);
router.get('/:id', obtenerProfesional);
router.put('/:id', editarProfesional);
router.delete('/:id', borrarProfesional);

export default router;