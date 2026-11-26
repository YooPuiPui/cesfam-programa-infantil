import { MotivoDesactivacion } from '@prisma/client';

//? largo de la columna Paciente.detalle_desactivacion
const LARGO_MAXIMO_DETALLE = 200;

type CambioEstado =
    | { activo?: undefined }
    | { activo: true; motivo_desactivacion: null; detalle_desactivacion: null; fecha_desactivacion: null }
    | { activo: false; motivo_desactivacion: MotivoDesactivacion; detalle_desactivacion: string | null; fecha_desactivacion: Date };

type CuerpoEstado = { activo?: unknown; motivo_desactivacion?: unknown; detalle_desactivacion?: unknown };

//! reglas para cambiar Paciente.activo, toda ruta que reciba "activo" tiene que pasar por aqui
//? devuelve los campos a guardar, o el mensaje para responder 400
export const resolverEstadoPaciente = (cuerpo: CuerpoEstado): { datos: CambioEstado } | { error: string } => {
    const { activo, motivo_desactivacion: motivo, detalle_desactivacion: detalle } = cuerpo;
    const traeDatos = (motivo !== undefined && motivo !== null) || (detalle !== undefined && detalle !== null);

    if (activo === undefined) {
        if (traeDatos) return { error: 'Para registrar un motivo de desactivación debes enviar también activo en false.' };
        return { datos: {} };
    }

    if (typeof activo !== 'boolean') return { error: 'El campo activo debe ser true o false.' };

    if (activo) {
        if (traeDatos) return { error: 'No se puede indicar un motivo ni un detalle de desactivación en un paciente activo.' };
        return { datos: { activo: true, motivo_desactivacion: null, detalle_desactivacion: null, fecha_desactivacion: null } };
    }

    if (motivo === undefined || motivo === null || motivo === '') {
        return { error: 'Para desactivar un paciente debes indicar el motivo.' };
    }

    if (!Object.values(MotivoDesactivacion).includes(motivo as MotivoDesactivacion)) {
        return { error: 'El motivo de desactivación no es válido.' };
    }

    if (detalle !== undefined && detalle !== null && typeof detalle !== 'string') {
        return { error: 'El detalle de la desactivación debe ser un texto.' };
    }

    //? el detalle es opcional salvo en "Otro"
    const detalleLimpio = typeof detalle === 'string' ? detalle.trim() : '';

    if (motivo === MotivoDesactivacion.OTRO && !detalleLimpio) {
        return { error: 'Si el motivo es «Otro», debes describirlo en el detalle.' };
    }

    if (detalleLimpio.length > LARGO_MAXIMO_DETALLE) {
        return { error: `El detalle de la desactivación no puede superar los ${LARGO_MAXIMO_DETALLE} caracteres.` };
    }

    return {
        datos: {
            activo: false,
            motivo_desactivacion: motivo as MotivoDesactivacion,
            detalle_desactivacion: detalleLimpio || null,
            fecha_desactivacion: new Date(),
        },
    };
};
