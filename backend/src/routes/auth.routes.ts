import { Router } from 'express';
<<<<<<< HEAD
import { login } from '../controllers/auth.controller';
=======
import { login, registro } from '../controllers/auth.controller';
>>>>>>> feat/vista-ficha-pacientes

const router = Router();


router.post('/login', login);
<<<<<<< HEAD
=======
router.post('/registro', registro);
>>>>>>> feat/vista-ficha-pacientes

export default router;