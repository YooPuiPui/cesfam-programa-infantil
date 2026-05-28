import { Router } from 'express';
import { crearPaciente } from '../controllers/paciente.controller';

const router = Router();

router.post('/', crearPaciente);

export default router;