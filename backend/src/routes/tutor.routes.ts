import { Router } from 'express';
import {
    crearTutor,
    obtenerTutores,
    obtenerTutor,
    obtenerTutorporRut,
    editarTutor,
    eliminarTutor
} from '../controllers/tutor.controller';

const router = Router();

router.post('/', crearTutor);
router.get('/', obtenerTutores);
router.get('/rut/:rut', obtenerTutorporRut);
router.get('/:id', obtenerTutor);
router.put('/:id', editarTutor);
router.delete('/:id', eliminarTutor);

export default router;
