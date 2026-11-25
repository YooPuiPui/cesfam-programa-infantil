import { TipoDiagnostico } from '@prisma/client';
import prisma from '../config/prisma';

//* catalogo activo ordenado por nombre, sin tipo devuelve ambos
export const obtenerDiagnosticos = async (tipo?: TipoDiagnostico) => {
    return await prisma.diagnostico.findMany({
        where: { activo: true, ...(tipo ? { tipo } : {}) },
        select: { id_diagnostico: true, nombre: true, tipo: true, codigo_cie10: true },
        orderBy: { nombre: 'asc' },
    });
};

const MAX_ID = 2147483647; //? limite del Int de postgres

const descripcionTipo: Record<TipoDiagnostico, string> = {
    CONDICION: 'una condición de base del paciente',
    CONTROL: 'un diagnóstico de control',
};

//* revisa que diagnosticos_ids sea una lista de ids existentes, activos y del tipo pedido
//? devuelve los ids sin repetidos, o el mensaje para responder 400
export const validarDiagnosticosIds = async (
    valor: unknown,
    tipo: TipoDiagnostico,
): Promise<{ ids: number[] } | { error: string }> => {
    const esId = (id: unknown): id is number => Number.isInteger(id) && (id as number) > 0 && (id as number) <= MAX_ID;

    if (!Array.isArray(valor) || !valor.every(esId)) {
        return { error: 'Los diagnósticos deben enviarse como una lista de identificadores numéricos (diagnosticos_ids).' };
    }

    const ids = Array.from(new Set<number>(valor));
    if (ids.length === 0) return { ids };

    const validos = await prisma.diagnostico.count({
        where: { id_diagnostico: { in: ids }, tipo, activo: true },
    });

    if (validos !== ids.length) {
        return { error: `Hay diagnósticos que no existen, están inactivos o no corresponden a ${descripcionTipo[tipo]}.` };
    }

    return { ids };
};
