import { Router } from 'express';
import { borrarPaciente, crearPaciente, editarPaciente, obtenerPaciente, obtenerTodosLosPacientes } from '../controllers/paciente.controller';
import { verificarToken } from '../middlewares/authMiddleware';
const router = Router();

router.post('/', verificarToken, crearPaciente);
router.put('/:id', verificarToken, editarPaciente);
router.get('/', verificarToken, obtenerTodosLosPacientes);
router.get('/:id', verificarToken, obtenerPaciente);
router.delete('/:id', verificarToken, borrarPaciente);

export default router;