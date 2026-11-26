import type { DatosDesactivacion, MotivoDesactivacion } from '../types';

//? mismo largo que acepta el backend
export const LARGO_MAXIMO_DETALLE = 200;

export const SIN_MOTIVO = 'Sin motivo registrado';

export const ETIQUETAS_MOTIVO: Record<MotivoDesactivacion, string> = {
    TRASLADO: 'Traslado',
    EGRESO_POR_EDAD: 'Egreso por edad',
    FALLECIMIENTO: 'Fallecimiento',
    NO_DESEA_CONTINUAR: 'No desea continuar',
    INUBICABLE: 'Inubicable',
    ERROR_DE_REGISTRO: 'Error de registro',
    OTRO: 'Otro',
};

//* opciones del selector, en el orden en que se muestran
export const MOTIVOS_DESACTIVACION = Object.keys(ETIQUETAS_MOTIVO) as MotivoDesactivacion[];

//? la fecha es un instante, se muestra el dia que era en Chile
export function fechaEnChile(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

//* "Inactivo: Traslado (25-11-2026)", o "Sin motivo registrado" en los desactivados antes de pedirlo
export function textoInactivo({ motivo_desactivacion, fecha_desactivacion }: DatosDesactivacion): string {
    if (!motivo_desactivacion) return SIN_MOTIVO;

    const texto = `Inactivo: ${ETIQUETAS_MOTIVO[motivo_desactivacion]}`;
    if (!fecha_desactivacion) return texto;

    return `${texto} (${fechaEnChile(fecha_desactivacion)})`;
}

//* revisa el formulario antes de desactivar, devuelve '' si esta completo
export function errorDesactivacion(motivo: MotivoDesactivacion | '', detalle: string): string {
    if (!motivo) return 'Selecciona el motivo de la desactivación.';
    if (motivo === 'OTRO' && !detalle.trim()) return 'Si el motivo es «Otro», describe el detalle.';
    if (detalle.trim().length > LARGO_MAXIMO_DETALLE) return `El detalle no puede superar los ${LARGO_MAXIMO_DETALLE} caracteres.`;
    return '';
}
