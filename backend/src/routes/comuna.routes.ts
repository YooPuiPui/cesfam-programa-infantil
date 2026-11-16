import { Router } from "express";
import { obtenerTodasLasComunas } from "../controllers/comuna.controller";
import { verificarToken } from "../middlewares/authMiddleware";


const router = Router();


router.get('/', verificarToken, obtenerTodasLasComunas);



export default router;