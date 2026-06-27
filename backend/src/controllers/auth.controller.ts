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

<<<<<<< HEAD
    res.json({ token, usuario: { nombre: usuario.nombre, rol: usuario.rol } });
=======
    res.json({ token, usuario: { rut: usuario.rut, nombre: usuario.nombre, rol: usuario.rol } });
};

export const registro = async (req: Request, res: Response) => {
    try {
        const { rut, nombre, password, rol } = req.body;

        // verificar si el usuario ya existe
        const usuarioExistente = await prisma.usuario.findUnique({ where: { rut } });
        if (usuarioExistente) {
            return res.status(400).json({ error: "El RUT ya está registrado en el sistema" });
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // crear el usuario en la base de datos
        const nuevoUsuario = await prisma.usuario.create({
            data: {
                rut,
                nombre,
                password: hashedPassword,
                rol: rol || 'PROFESIONAL' // Valor por defecto si no lo envían
            }
        });

        // generar token 
        const token = jwt.sign({ id: nuevoUsuario.id, rut: nuevoUsuario.rut }, JWT_SECRET, { expiresIn: '8h' });

        res.status(201).json({
            mensaje: "Usuario creado exitosamente",
            token,
            usuario: { nombre: nuevoUsuario.nombre, rol: nuevoUsuario.rol }
        });

    } catch (error: any) {
        console.error("Error en el registro:", error);
        res.status(500).json({ error: "Error interno del servidor al registrar el usuario" });
    }
>>>>>>> feat/vista-ficha-pacientes
};