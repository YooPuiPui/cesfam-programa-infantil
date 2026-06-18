import { Router } from 'express';
import { obtenerPacientes, obtenerPaciente, crearPaciente, editarPaciente, borrarPaciente } from '../controllers/paciente.controller';import { verificarToken } from '../middlewares/authMiddleware';
const router = Router();

router.post('/', verificarToken, crearPaciente);
router.put('/:id', verificarToken, editarPaciente);
router.get('/:id', verificarToken, obtenerPaciente);
router.get('/', verificarToken, obtenerPacientes);
router.delete('/:id', verificarToken, borrarPaciente);

export default router;