import prisma from '../config/prisma';

export const crearPacienteConTutor = async (datosPaciente: any, datosTutor: any) => {

    // Verificar si ya existe un paciente con ese RUT antes de intentar crear
    const pacienteExistente = await prisma.paciente.findUnique({
        where: { rut: datosPaciente.rut }
    });

    if (pacienteExistente) {
        throw new Error(`Ya existe un paciente con el RUT ${datosPaciente.rut}`);
    }

    const nuevoPaciente = await prisma.paciente.create({
        data: {
            ...datosPaciente,
            tutor: {
                connectOrCreate: {
                    where: { rut: datosTutor.rut },
                    create: datosTutor,
                }
            },
        },
        include: {
            tutor: true,
        },
    });

    return nuevoPaciente;
};



export const actualizarPaciente = async (idPaciente: number, datosPaciente: any) => {

    //* Busca al paciente por su id y reemplaza los compos enviados
    const pacienteActualizado = await prisma.paciente.update({
        where: {
            id_paciente: idPaciente,
        },
        data: datosPaciente,
    });

    return pacienteActualizado;
};


export const obtenerTodosLosPacientes = async () => {

    return await prisma.paciente.findMany({
        include: {
            tutor: true,
        },
    });
};

export const obtenerPacientePorId = async (idPaciente: number) => {

    return await prisma.paciente.findUnique({
        where: {
            id_paciente: idPaciente
        },

        include: {
            tutor: true,
        },
    });
};


export const eliminarPaciente = async (idPaciente: number) => {
    return await prisma.paciente.delete({
        where: {
            id_paciente: idPaciente,
        },
    });
};

export const obtenerConteosPacientes = async () => {
    const [total, sename, naneas, trans, migrante, regular] = await Promise.all([
        prisma.paciente.count(),
        prisma.paciente.count({ where: { es_sename: true } }),
        prisma.paciente.count({ where: { es_naneas_prematuro: true } }),
        prisma.paciente.count({ where: { es_poblacion_trans: true } }),
        prisma.paciente.count({ where: { es_migrante: true } }),
        prisma.paciente.count({
            where: {
                es_sename: false,
                es_naneas_prematuro: false,
                es_poblacion_trans: false,
                es_migrante: false,
            },
        }),
    ]);

    return { total, sename, naneas, trans, migrante, regular };
};