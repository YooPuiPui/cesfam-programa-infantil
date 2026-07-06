import { Router } from 'express';
import {
    obtenerPacientes, obtenerPaciente,
    crearPaciente,
    editarPaciente, borrarPaciente,
    obtenerPacientePorRut,
    obtenerConteosPacientes
}
from '../controllers/paciente.controller';

import { verificarToken } from '../middlewares/authMiddleware';



const router = Router();

router.post('/', verificarToken, crearPaciente);
router.get('/rut/:rut', verificarToken, obtenerPacientePorRut);
router.get('/:id', verificarToken, obtenerPaciente);
router.get('/', verificarToken, obtenerPacientes);
router.put('/:id', verificarToken, editarPaciente);
router.delete('/:id', verificarToken, borrarPaciente);
router.get('/estadisticas/riesgo', verificarToken, obtenerConteosPacientes);













export default router;