import { Router } from "express";
import { obtenerReportes, obtenerReporteDetalle } from "../controllers/reportes.controller";
import { verificarToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', verificarToken, obtenerReportes);
router.get('/:rut', verificarToken, obtenerReporteDetalle);

export default router;