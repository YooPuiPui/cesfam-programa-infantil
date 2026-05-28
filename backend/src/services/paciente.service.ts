import prisma from '../config/prisma';

export const crearPacienteConTutor = async (datosPaciente: any, datosTutor: any) => {
  // Prisma ejecuta una "Transacción": O se guardan los dos, o no se guarda ninguno
    const nuevoPaciente = await prisma.paciente.create({
    data: {
        ...datosPaciente,
        tutor: {
        create: datosTutor,
    },
    },
    include: {
        tutor: true, 
    },
    });

    return nuevoPaciente;
};