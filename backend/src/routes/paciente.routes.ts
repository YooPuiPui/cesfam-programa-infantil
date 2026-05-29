import { Router } from 'express';
import { borrarPaciente, crearPaciente, editarPaciente, obtenerPaciente, obtenerTodosLosPacientes } from '../controllers/paciente.controller';

const router = Router();

router.post('/', crearPaciente);
router.put('/:id', editarPaciente);
router.get('/', obtenerTodosLosPacientes);
router.get('/:id', obtenerPaciente);
router.delete('/:id', borrarPaciente);

export default router;