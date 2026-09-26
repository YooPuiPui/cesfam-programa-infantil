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


export const buscarPacientePorRut = async (rut: string) => {
    return await prisma.paciente.findUnique({
        where: { rut },
        select: { rut: true, fecha_nacimiento: true }
    });
};

export const buscarPacientePorRutConTutor = async (rut: string) => {
    return await prisma.paciente.findUnique({
        where: { rut },
        include: {
            tutor: true
        }
    });
};


export const obtenerCaracterizacionPacientes = async () => {

    //?  1. EDAD (0-9 años y 10-18 años
    const hoy = new Date();
    const fechaLimite10 = new Date(hoy.getFullYear() - 10, hoy.getMonth(), hoy.getDate());
    const fechaLimite19 = new Date(hoy.getFullYear() - 19, hoy.getMonth(), hoy.getDate());

    const [cantidad0a9, cantidad10a18] = await Promise.all([
        prisma.paciente.count({
            where: { fecha_nacimiento: { gt: fechaLimite10 } },
        }),
        prisma.paciente.count({
            where: { fecha_nacimiento: { lte: fechaLimite10, gt: fechaLimite19 } },
        }),
    ]);

    //?  2. ESTADO (activo / inactivo) 
    const [activos, inactivos] = await Promise.all([
        prisma.paciente.count({ where: { activo: true } }),
        prisma.paciente.count({ where: { activo: false } }),
    ]);

    //?  3. DIAGNOSTICOS 
    const pacientesConDiagnostico = await prisma.paciente.findMany({
        select: { diagnosticos: true },
    });

    const conteoDiagnosticos: Record<string, number> = {};
    for (const paciente of pacientesConDiagnostico) {
        for (const diagnostico of paciente.diagnosticos) {
            conteoDiagnosticos[diagnostico] = (conteoDiagnosticos[diagnostico] || 0) + 1;
        }
    }

    //?  4. CREDENCIAL DE DISCAPACIDAD 
    const credencialAgrupada = await prisma.paciente.groupBy({
        by: ['credencial_discapacidad'],
        _count: true,
    });

    const nombresCredencial: Record<string, string> = {
        sin_dato: 'Sin dato',
        si: 'Sí',
        no: 'No',
        en_tramite: 'En trámite',
    };

    //? 5. CUIDADOR (tiene / no tiene)
    const [conCuidador, sinCuidador] = await Promise.all([
        prisma.paciente.count({
            where: { AND: [{ cuidador_nombre: { not: null } }, { cuidador_nombre: { not: '' } }] },
        }),
        prisma.paciente.count({
            where: { OR: [{ cuidador_nombre: null }, { cuidador_nombre: '' }] },
        }),
        
    ]);

    return {
        edad: [
            { name: '0-9 años', value: cantidad0a9 },
            { name: '10-18 años', value: cantidad10a18 },
        ],
        estado: [
            { name: 'Activos', value: activos },
            { name: 'Inactivos', value: inactivos },
        ],
        diagnosticos: Object.entries(conteoDiagnosticos).map(([name, value]) => ({ name, value })),
        credencial_discapacidad: credencialAgrupada.map((item) => ({
            name: nombresCredencial[item.credencial_discapacidad] || item.credencial_discapacidad,
            value: item._count,
        })),
        cuidador: [
            { name: 'Con cuidador', value: conCuidador },
            { name: 'Sin cuidador', value: sinCuidador },
        ],
    };

};