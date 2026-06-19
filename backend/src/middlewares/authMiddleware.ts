import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';


export interface AuthRequest extends Request {
    usuario?: any;
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Acceso denegado: No se proporcionó token" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const verificado = jwt.verify(token, JWT_SECRET);
        req.usuario = verificado; // guardamos la info del usuario en la petición
        next(); 
    } catch (error) {
        res.status(403).json({ error: "Token no válido o expirado" });
    }
};