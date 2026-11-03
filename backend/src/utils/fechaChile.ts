



function obtenerComponentesFechaChile(fecha: Date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const partes = formatter.formatToParts(fecha);
    const mapa: Record<string, string> = {};
    partes.forEach((p) => {
        if (p.type !== 'literal') mapa[p.type] = p.value;
    });

    return {
        anio: parseInt(mapa.year),
        mes: parseInt(mapa.month) - 1, 
        dia: parseInt(mapa.day),
        hora: parseInt(mapa.hour),
        minuto: parseInt(mapa.minute),
        segundo: parseInt(mapa.second),
    };
}


export function hoyChileMediodiaUTC(): Date {
    const c = obtenerComponentesFechaChile();
    return new Date(Date.UTC(c.anio, c.mes, c.dia, 12, 0, 0));
}


export function obtenerHoyChile() {
    return obtenerComponentesFechaChile();
}


//* convierte una fecha "2026-09-15" (o un iso, solo importa el dia) a mediodia UTC
//? asi se guardan todas las fechas del proyecto, al mediodia no se corre el dia por la zona horaria
//! devuelve null si la fecha no existe (ej: 2026-02-31) para responder 400 y no un 500 por Invalid Date
export function fechaCalendarioAMediodiaUTC(valor: unknown): Date | null {
    if (typeof valor !== 'string') return null;

    const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor.trim());
    if (!partes) return null;

    const anio = Number(partes[1]);
    const mes = Number(partes[2]) - 1;
    const dia = Number(partes[3]);

    const fecha = new Date(Date.UTC(anio, mes, dia, 12, 0, 0));

    //! Date.UTC no rechaza dias que no existen, los pasa al mes siguiente (2026-02-31 -> 2026-03-03)
    //? por eso se compara para detectarlo
    if (
        fecha.getUTCFullYear() !== anio ||
        fecha.getUTCMonth() !== mes ||
        fecha.getUTCDate() !== dia
    ) {
        return null;
    }

    return fecha;
}
