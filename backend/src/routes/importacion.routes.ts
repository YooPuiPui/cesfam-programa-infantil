import { Router } from 'express';
import multer from 'multer';
import { importarExcel } from '../controllers/importacion.controller';
import { verificarToken } from '../middlewares/authMiddleware';




const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 100 * 1024 * 1024 },

});


const router = Router();

router.post('/excel', verificarToken, upload.single('archivo'), importarExcel);


export default router;
