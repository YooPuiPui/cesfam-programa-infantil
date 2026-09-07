



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


/**
 * Convierte una fecha de calendario recibida desde el cliente ("2026-09-15",
 * o un ISO completo del que solo interesa el día) a un Date al mediodía UTC,
 * que es como el proyecto guarda todas las fechas de negocio.
 *
 * El mediodía evita el desfase de un día: cualquier zona horaria entre UTC-11
 * y UTC+12 sigue cayendo en la misma fecha de calendario.
 *
 * Devuelve null si el texto no es una fecha válida (formato incorrecto o un día
 * que no existe, como 2026-02-31), para que el controlador responda 400 en vez
 * de dejar que un Invalid Date llegue a Prisma y termine en un 500.
 */
export function fechaCalendarioAMediodiaUTC(valor: unknown): Date | null {
    if (typeof valor !== 'string') return null;

    const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor.trim());
    if (!partes) return null;

    const anio = Number(partes[1]);
    const mes = Number(partes[2]) - 1;
    const dia = Number(partes[3]);

    const fecha = new Date(Date.UTC(anio, mes, dia, 12, 0, 0));

    //! Date.UTC no rechaza días inexistentes: los corre al mes siguiente
    //! (2026-02-31 se vuelve 2026-03-03). Comparamos para detectarlo.
    if (
        fecha.getUTCFullYear() !== anio ||
        fecha.getUTCMonth() !== mes ||
        fecha.getUTCDate() !== dia
    ) {
        return null;
    }

    return fecha;
}
