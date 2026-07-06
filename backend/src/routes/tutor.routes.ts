import { Router } from 'express';
import {
    crearTutor,
    obtenerTutores,
    obtenerTutor,
    obtenerTutorporRut,
    editarTutor,
    eliminarTutor
} from '../controllers/tutor.controller';
import { verificarToken } from '../middlewares/authMiddleware';


const router = Router();

router.post('/',verificarToken, crearTutor);
router.get('/',verificarToken, obtenerTutores);
router.get('/rut/:rut',verificarToken, obtenerTutorporRut);
router.get('/:id',verificarToken, obtenerTutor);
router.put('/:id',verificarToken, editarTutor);
router.delete('/:id',verificarToken, eliminarTutor);

export default router;
