import prisma from '../config/prisma';

//? relaciones que se devuelven siempre con el paciente: tutor (con su comuna), comuna y cuidador
const incluirRelaciones = {
    tutor: { include: { comuna: true } },
    comuna: true,
    cuidador: true,
} as const;

type DatosCuidador = { nombre: string; apellidos?: string | null; telefono?: string | null; parentesco?: string | null };

export const crearPacienteConTutor = async (datosPaciente: any, datosTutor: any, datosCuidador: DatosCuidador | null = null) => {

    //! revisa que no exista un paciente con ese rut antes de crear
    const pacienteExistente = await prisma.paciente.findUnique({
        where: { rut: datosPaciente.rut }
    });

    if (pacienteExistente) {
        throw new Error(`Ya existe un paciente con el RUT ${datosPaciente.rut}`);
    }

    //! prisma no deja mezclar el campo suelto id_comuna con relaciones anidadas, por eso se separa y se usa connect
    const { id_comuna: idComunaPaciente, ...restoPaciente } = datosPaciente;
    const { id_comuna: idComunaTutor, ...restoTutor } = datosTutor;

    const nuevoPaciente = await prisma.paciente.create({
        data: {
            ...restoPaciente,
            comuna: { connect: { id_comuna: idComunaPaciente } },
            //? si no hay cuidador no se manda nada y queda sin cuidador
            ...(datosCuidador ? { cuidador: { create: datosCuidador } } : {}),
            tutor: {
                connectOrCreate: {
                    where: { rut: datosTutor.rut },
                    create: {
                        ...restoTutor,
                        comuna: { connect: { id_comuna: idComunaTutor } },
                    },
                }
            },
        },
        include: incluirRelaciones,
    });

    return nuevoPaciente;
};



//? datosCuidador: undefined = no tocar el cuidador, null = desvincularlo, objeto = actualizarlo o crearlo
export const actualizarPaciente = async (idPaciente: number, datosPaciente: any, datosCuidador?: DatosCuidador | null) => {

    //! con relaciones anidadas prisma no acepta el campo suelto id_comuna, va con connect
    const { id_comuna, ...restoPaciente } = datosPaciente;
    const data: any = { ...restoPaciente };

    if (id_comuna !== undefined) {
        data.comuna = { connect: { id_comuna } };
    }

    if (datosCuidador === null) {
        //* solo se desvincula, la fila del cuidador no se borra
        data.cuidador = { disconnect: true };
    } else if (datosCuidador !== undefined) {
        const pacienteActual = await prisma.paciente.findUnique({
            where: { id_paciente: idPaciente },
            select: { id_cuidador: true },
        });

        //? si el paciente no existe el update lanza P2025 y el controlador responde 404
        data.cuidador = pacienteActual?.id_cuidador
            ? { update: datosCuidador }
            : { create: datosCuidador };
    }

    //* Busca al paciente por su id y reemplaza los compos enviados
    const pacienteActualizado = await prisma.paciente.update({
        where: {
            id_paciente: idPaciente,
        },
        data,
        include: incluirRelaciones,
    });

    return pacienteActualizado;
};


export const obtenerTodosLosPacientes = async () => {

    return await prisma.paciente.findMany({
        include: incluirRelaciones,
    });
};

export const obtenerPacientePorId = async (idPaciente: number) => {

    return await prisma.paciente.findUnique({
        where: {
            id_paciente: idPaciente
        },

        include: incluirRelaciones,
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
        select: { rut: true, fecha_nacimiento: true, activo: true }
    });
};

export const buscarPacientePorRutConTutor = async (rut: string) => {
    return await prisma.paciente.findUnique({
        where: { rut },
        include: incluirRelaciones,
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
        prisma.paciente.count({ where: { id_cuidador: { not: null } } }),
        prisma.paciente.count({ where: { id_cuidador: null } }),
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