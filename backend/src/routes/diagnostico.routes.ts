import { Router } from "express";
import { obtenerDiagnosticos } from "../controllers/diagnostico.controller";
import { verificarToken } from "../middlewares/authMiddleware";


const router = Router();


router.get('/', verificarToken, obtenerDiagnosticos);


export default router;
