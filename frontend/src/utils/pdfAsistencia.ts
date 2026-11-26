//* lista de asistencia de una sesion de taller en PDF
//! jspdf y jspdf-autotable se cargan con import() dentro de generarPdfAsistencia, no agregar imports estaticos
import { formatearRUT } from './formatters';

export type EstadoAsistencia = 'pendiente' | 'asiste' | 'no_asiste';
export type EstadoConvocatoria =
    | 'no_contactado'
    | 'contactado'
    | 'confirma'
    | 'no_confirma'
    | 'no_contesta'
    | 'no_puede'
    | 'reconfirmar';

//? las mismas etiquetas se usan en pantalla, el orden es el del selector
export const ETIQUETAS_CONVOCATORIA: Record<EstadoConvocatoria, string> = {
    no_contactado: 'No contactado',
    contactado: 'Contactado',
    confirma: 'Confirma',
    no_confirma: 'No confirma',
    no_contesta: 'No contesta',
    no_puede: 'No puede',
    reconfirmar: 'Reconfirmar',
};

export const ETIQUETAS_ASISTENCIA: Record<EstadoAsistencia, string> = {
    pendiente: 'Pendiente',
    asiste: 'Asistió',
    no_asiste: 'No asistió',
};

//* solo lo que el PDF necesita de GET /sesiones/:id
export interface SesionAsistencia {
    fecha: string;
    cupo_maximo: number | null;
    terminada: boolean;
    profesional: { nombre: string; apellido: string } | null;
    profesional_externo: string | null;
    taller: { nombre: string };
    inscripciones: {
        estado_asistencia: EstadoAsistencia;
        estado_convocatoria: EstadoConvocatoria;
        telefono_contacto?: string | null;
        observaciones?: string | null;
        paciente: { rut: string; nombre: string; apellido: string; fecha_nacimiento: string };
    }[];
}

export interface FilaAsistencia {
    numero: number;
    nombre: string;
    rut: string;
    edad: string;
    telefono: string;
    convocatoria: string;
    asistencia: string;
    observaciones: string;
}

export interface TotalesAsistencia {
    inscritos: number;
    asistieron: number;
    noAsistieron: number;
    pendientes: number;
}

export const responsableSesion = (sesion: Pick<SesionAsistencia, 'profesional' | 'profesional_externo'>): string => {
    if (sesion.profesional) return `${sesion.profesional.nombre} ${sesion.profesional.apellido}`;
    if (sesion.profesional_externo) return sesion.profesional_externo;
    return 'Sin asignar';
};

//? las fuentes por defecto de jsPDF solo dibujan Latin-1, lo tipografico se cambia por su equivalente simple
const EQUIVALENTES: [RegExp, string][] = [
    [/[‘’‚‛′]/g, "'"],
    [/[“”„‟″]/g, '"'],
    [/[‐-―−]/g, '-'],
    [/…/g, '...'],
    [/•/g, '-'],
    [/[\t  -  ]/g, ' '],
    [/\r\n?/g, '\n'],
    [/[­​-‏⁠️﻿]/g, ''],
];

const esImprimible = (c: string): boolean => /^[\n\x20-\x7E¡-ÿ]$/.test(c);

export function textoPdf(texto: string): string {
    const base = EQUIVALENTES.reduce((t, [patron, reemplazo]) => t.replace(patron, reemplazo), texto.normalize('NFC'));

    return Array.from(base, (c) => {
        if (esImprimible(c)) return c;
        //? una letra con una tilde que Latin-1 no tiene queda sin tilde, el resto (emojis, etc.) como "?"
        const sinTilde = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
        return esImprimible(sinTilde) ? sinTilde : '?';
    }).join('');
}

//? edad cumplida el dia de la sesion, comparando fechas de calendario (AAAA-MM-DD)
function edadEnFecha(nacimiento: string, fecha: string): string {
    const [anioN, mesN, diaN] = nacimiento.slice(0, 10).split('-').map(Number);
    const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);

    let meses = (anio - anioN) * 12 + (mes - mesN);
    if (dia < diaN) meses--;
    if (!Number.isFinite(meses) || meses < 0) return '-';

    return `${Math.floor(meses / 12)}a ${meses % 12}m`;
}

const comparar = (a: string, b: string): number => a.trim().localeCompare(b.trim(), 'es', { sensitivity: 'base' });

//* funcion pura: filas ordenadas por apellido (y nombre) mas los totales
export function construirFilasAsistencia(sesion: SesionAsistencia): { filas: FilaAsistencia[]; totales: TotalesAsistencia } {
    const ordenadas = [...sesion.inscripciones].sort((a, b) =>
        comparar(a.paciente.apellido, b.paciente.apellido) || comparar(a.paciente.nombre, b.paciente.nombre));

    const filas = ordenadas.map((i, indice) => ({
        numero: indice + 1,
        nombre: textoPdf(`${i.paciente.apellido.trim()}, ${i.paciente.nombre.trim()}`),
        rut: textoPdf(formatearRUT(i.paciente.rut)),
        edad: edadEnFecha(i.paciente.fecha_nacimiento, sesion.fecha),
        telefono: textoPdf(i.telefono_contacto?.trim() || '-'),
        convocatoria: ETIQUETAS_CONVOCATORIA[i.estado_convocatoria] ?? textoPdf(i.estado_convocatoria),
        asistencia: ETIQUETAS_ASISTENCIA[i.estado_asistencia] ?? textoPdf(i.estado_asistencia),
        observaciones: textoPdf(i.observaciones?.trim() ?? ''),
    }));

    const contar = (estado: EstadoAsistencia) => sesion.inscripciones.filter((i) => i.estado_asistencia === estado).length;

    return {
        filas,
        totales: {
            inscritos: sesion.inscripciones.length,
            asistieron: contar('asiste'),
            noAsistieron: contar('no_asiste'),
            pendientes: contar('pendiente'),
        },
    };
}

//? asistencia-<taller>-<AAAA-MM-DD>.pdf sin tildes, ñ ni espacios
export function nombreArchivoAsistencia(sesion: Pick<SesionAsistencia, 'fecha' | 'taller'>): string {
    const taller = sesion.taller.nombre
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `asistencia-${taller || 'taller'}-${sesion.fecha.slice(0, 10)}.pdf`;
}

//? "25-11-2026 14:05" en hora de Chile
function fechaHoraChile(momento: Date): string {
    const partes = Object.fromEntries(
        new Intl.DateTimeFormat('es-CL', {
            timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(momento).map((p) => [p.type, p.value]),
    );
    return `${partes.day}-${partes.month}-${partes.year} ${partes.hour}:${partes.minute}`;
}

//* arma el PDF (carta vertical) y lo descarga
export async function generarPdfAsistencia(sesion: SesionAsistencia, nombreUsuario: string): Promise<void> {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

    const { filas, totales } = construirFilasAsistencia(sesion);
    const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

    const MARGEN = 12;
    const MARGEN_INFERIOR = 18; // deja libre el pie
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const anchoUtil = ancho - MARGEN * 2;

    // encabezado
    let y = MARGEN + 5;
    doc.setFont('helvetica', 'bold').setFontSize(16);
    doc.text('Lista de asistencia', MARGEN, y);
    y += 8;

    const fecha = new Date(sesion.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
    const datos: [string, string][] = [
        ['Taller', sesion.taller.nombre],
        ['Fecha de la sesión', fecha],
        ['Profesional', responsableSesion(sesion)],
        ['Cupo', sesion.cupo_maximo === null ? 'Sin cupo máximo' : String(sesion.cupo_maximo)],
        ['Estado', sesion.terminada ? 'Terminada' : 'No terminada'],
    ];
    doc.setFontSize(10);
    for (const [titulo, valor] of datos) {
        doc.setFont('helvetica', 'bold').text(`${titulo}:`, MARGEN, y);
        doc.setFont('helvetica', 'normal');
        const lineas: string[] = doc.splitTextToSize(textoPdf(valor), anchoUtil - 38);
        doc.text(lineas, MARGEN + 38, y);
        y += 5 * lineas.length;
    }

    autoTable(doc, {
        startY: y + 1,
        margin: { top: MARGEN, right: MARGEN, bottom: MARGEN_INFERIOR, left: MARGEN },
        head: [['N°', 'Nombre', 'RUT', 'Edad', 'Teléfono de contacto', 'Convocatoria', 'Asistencia', 'Observaciones']],
        body: filas.map((f) => [f.numero, f.nombre, f.rut, f.edad, f.telefono, f.convocatoria, f.asistencia, f.observaciones]),
        showHead: 'everyPage',
        rowPageBreak: 'avoid',
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.5, overflow: 'linebreak', valign: 'top', textColor: 20, lineColor: 180 },
        headStyles: { fillColor: [226, 232, 240], textColor: 20, fontStyle: 'bold' },
        // Observaciones usa el ancho que sobra
        columnStyles: {
            0: { cellWidth: 8, halign: 'right' },
            1: { cellWidth: 36 },
            2: { cellWidth: 21 },
            3: { cellWidth: 15 }, // "10a 10m" en una línea
            4: { cellWidth: 24 },
            5: { cellWidth: 23 },
            6: { cellWidth: 19 },
        },
    });

    // totales y firma van juntos, si no caben pasan a otra pagina
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    if (y + 34 > alto - MARGEN_INFERIOR) {
        doc.addPage();
        y = MARGEN + 5;
    }

    doc.setFont('helvetica', 'bold').setFontSize(10);
    doc.text(
        `Inscritos: ${totales.inscritos}    Asistieron: ${totales.asistieron}    No asistieron: ${totales.noAsistieron}    Pendientes: ${totales.pendientes}`,
        MARGEN, y,
    );

    y += 24;
    const centro = ancho / 2;
    doc.setDrawColor(60).line(centro - 40, y, centro + 40, y);
    doc.setFont('helvetica', 'normal').setFontSize(9);
    doc.text('Firma del profesional', centro, y + 5, { align: 'center' });
    if (sesion.profesional || sesion.profesional_externo) {
        doc.text(textoPdf(responsableSesion(sesion)), centro, y + 10, { align: 'center' });
    }

    // pie en todas las paginas, al final porque recien aqui se sabe el total
    const generado = textoPdf(`Generado el ${fechaHoraChile(new Date())} por ${nombreUsuario.trim() || 'usuario no identificado'}`);
    const paginas = doc.getNumberOfPages();
    for (let pagina = 1; pagina <= paginas; pagina++) {
        doc.setPage(pagina);
        doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(90);
        doc.text(generado, MARGEN, alto - 8);
        doc.text(`Página ${pagina} de ${paginas}`, ancho - MARGEN, alto - 8, { align: 'right' });
    }

    doc.save(nombreArchivoAsistencia(sesion));
}
