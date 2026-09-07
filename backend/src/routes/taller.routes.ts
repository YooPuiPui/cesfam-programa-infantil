import { Router } from "express";
import { verificarToken } from "../middlewares/authMiddleware";
import {
    crearTaller,
    obtenerTalleres,
    obtenerTallerPorId,
    editarTaller,
    desactivarTaller
}from "../controllers/taller.controller"

const router = Router();

router.get('/', verificarToken, obtenerTalleres);
router.post('/', verificarToken, crearTaller);
router.get('/:id', verificarToken, obtenerTallerPorId);
router.put('/:id', verificarToken, desactivarTaller);

export default router;
