import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'; // ¡Cámbialo en producción!

export const login = async (req: Request, res: Response) => {
    const { rut, password } = req.body;

    // buscar usuario
    const usuario = await prisma.usuario.findUnique({ where: { rut } });
    if (!usuario) return res.status(401).json({ error: "Credenciales inválidas" });

    // verificar contraseña
    const esValida = await bcrypt.compare(password, usuario.password);
    if (!esValida) return res.status(401).json({ error: "Credenciales inválidas" });

    // generar token
    const token = jwt.sign({ id: usuario.id, rut: usuario.rut }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, usuario: { nombre: usuario.nombre, rol: usuario.rol } });
};