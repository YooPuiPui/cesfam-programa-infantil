import { Request, Response } from 'express';
import * as pacienteService from '../services/paciente.service';

export const crearPaciente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paciente, tutor } = req.body;

    // Validación básica de supervivencia
    if (!paciente || !tutor) {
      res.status(400).json({ error: 'Faltan datos del paciente o del tutor en la petición' });
      return;
    }

    // 🛠️ MAPEO SEGURO DE PACIENTE
    // Extraemos solo los campos que existen en tu schema y convertimos la fecha
    const pacienteLimpio = {
      rut: paciente.rut,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      fecha_nacimiento: new Date(paciente.fecha_nacimiento), // Conversión obligatoria
      sexo_biologico: paciente.sexo_biologico,
      nacionalidad: paciente.nacionalidad || 'Chilena',
      direccion: paciente.direccion,
      sector: paciente.sector,
      comuna: paciente.comuna
    };

    // 🛠️ MAPEO SEGURO DE TUTOR
    const tutorLimpio = {
      rut: tutor.rut,
      nombre: tutor.nombre,
      apellido: tutor.apellido,
      telefono: tutor.telefono,
      parentesco: tutor.parentesco,
      correo: tutor.correo,
      direccion: tutor.direccion,
      comuna: tutor.comuna
    };

    // Mandamos los datos limpios al servicio
    const resultado = await pacienteService.crearPacienteConTutor(pacienteLimpio, tutorLimpio);

    res.status(201).json({
      mensaje: 'Paciente y Tutor creados con éxito',
      datos: resultado,
    });

  } catch (error: any) {
    // 🛡️ ESCUDO ANTI-DESMAYOS
    // Si Prisma falla, atrapamos el error, lo leemos y respondemos sin colgar la conexión
    console.error('========================================');
    console.error('🚨 ERROR ATRAPADO EN EL CONTROLADOR 🚨');
    console.error('Motivo del fallo:', error.message);
    console.error('========================================');
    
    res.status(500).json({ 
      error: 'Error interno en la Base de Datos', 
      detalle: error.message 
    });
  }
};