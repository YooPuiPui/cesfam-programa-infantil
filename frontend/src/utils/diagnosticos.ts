import type { Control, Diagnostico } from '../types';
import { normalizarTexto } from './formatters';

//* como se muestra en pantalla el nombre de un diagnostico del catalogo, el dato guardado no cambia
export function nombreDiagnostico(nombre: string): string {
    return nombre.trim().toLocaleUpperCase('es-CL');
}

//* orden alfabetico sin importar mayusculas ni tildes, para usar con sort()
export function compararDiagnosticos(a: string, b: string): number {
    return nombreDiagnostico(a).localeCompare(nombreDiagnostico(b), 'es', { sensitivity: 'base' });
}

//* filtra las opciones del buscador sin importar mayusculas ni tildes
export function filtrarDiagnosticos(opciones: Diagnostico[], busqueda: string): Diagnostico[] {
    const texto = normalizarTexto(busqueda);
    if (!texto) return opciones;
    return opciones.filter((d) => normalizarTexto(d.nombre).includes(texto));
}

//* arma en una linea el diagnostico de un control: "A, B. Otro: texto"
//? los controles antiguos no tienen diagnosticos del catalogo y muestran solo su texto
//? devuelve '' si no hay nada, cada vista pone su propio texto por defecto
export function textoDiagnosticoControl(control: Pick<Control, 'diagnosticos' | 'problemas_diagnosticados'>): string {
    const nombres = control.diagnosticos ?? [];
    const otro = control.problemas_diagnosticados?.trim() ?? '';

    if (nombres.length === 0) return otro;

    const lista = nombres.map(nombreDiagnostico).sort(compararDiagnosticos).join(', ');
    return otro ? `${lista}. Otro: ${otro}` : lista;
}
