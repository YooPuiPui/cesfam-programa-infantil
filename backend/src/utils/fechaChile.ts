



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