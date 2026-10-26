import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'; //! cambiar en produccion

export const login = async (req: Request, res: Response) => {
    try {
        const { rut, password } = req.body ?? {};

        if (typeof rut !== 'string' || typeof password !== 'string' || !rut.trim() || !password) {
            return res.status(400).json({ error: 'Debe ingresar RUT y contraseña' });
        }

        //* busca al usuario
        const usuario = await prisma.usuario.findUnique({ where: { rut } });
        if (!usuario) return res.status(401).json({ error: "Credenciales inválidas" });

        //* revisa la contraseña
        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) return res.status(401).json({ error: "Credenciales inválidas" });

        //* genera el token
        const token = jwt.sign({ id: usuario.id, rut: usuario.rut }, JWT_SECRET, { expiresIn: '30d' });

        res.json({ token, usuario: { rut: usuario.rut, nombre: usuario.nombre, rol: usuario.rol } });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
