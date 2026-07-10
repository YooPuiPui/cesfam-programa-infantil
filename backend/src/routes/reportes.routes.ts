import { Router } from "express";
import { obtenerReportes, obtenerReporteDetalle } from "../controllers/reportes.controller";

const router = Router();

router.get('/', obtenerReportes);
router.get('/:rut', obtenerReporteDetalle);

export default router;