import * as XLSX from 'xlsx';
import prisma from '../config/prisma';

interface FilaImportada {
    rut: string;
    nombreCompleto: string;
    fechaNacimiento: Date | null;
    sexo: string | null;
    direccion: string | null;
    sector: string | null;
    telefono: string | null;
    diagnosticoRaw: string | null;
    credencialDiscapacidadRaw: string | null;
    cuidadorRaw: string | null;
}

export interface ResumenImportacion {
    modo_simulacion: boolean;
    total_filas_leidas: number;
    creados: number;
    actualizados: number;
    detalle_creados: { rut: string; nombre: string }[];
    detalle_actualizados: { rut: string }[];
    errores: { rut: string; motivo: string }[];
}

// normalizadores 
// cada uno documenta la regla que aplica, para que se pueda auditar despues

function normalizarRut(valor: unknown): string | null {
    if (!valor) return null;
    const limpio = String(valor).trim().toUpperCase().replace(/\./g, '');
    if (!limpio || limpio.length < 3) return null;
    if (!limpio.includes('-')) {
        const cuerpo = limpio.slice(0, -1);
        const dv = limpio.slice(-1);
        return `${cuerpo}-${dv}`;
    }
    return limpio;
}

// El Excel a veces trae mas de un numero en la misma celda (ej.
// "978501519/ 972128005" o "988267468-992763091"). Tutor.telefono es
// VarChar(15), asi que un valor asi tal cual revienta el insert. El primer
// numero va a telefono, el segundo (si existe) a telefono_secundario; si
// alguno igual queda muy largo, se recorta.
function normalizarTelefono(valor: unknown): { principal: string; secundario: string | null } {
    if (!valor) return { principal: 'Sin dato', secundario: null };
    const v = String(valor).trim();
    if (!v) return { principal: 'Sin dato', secundario: null };

    const partes = v.split(/[/\-]/).map((p) => p.trim()).filter((p) => p.length > 0);
    const truncar = (s: string) => (s.length > 15 ? s.slice(0, 15) : s);

    return {
        principal: truncar(partes[0] || v),
        secundario: partes[1] ? truncar(partes[1]) : null,
    };
}

function normalizarSexo(valor: unknown): string | null {
    if (!valor) return null;
    const v = String(valor).trim().toUpperCase();
    if (v.startsWith('MASC') || v === 'M') return 'Masculino';
    if (v.startsWith('FEM') || v === 'F') return 'Femenino';
    return null;
}

// "TEA, TDAH, TOD" -> ["TEA","TDAH","TOD"]; "TEA-ASMA" -> ["TEA","ASMA"]
// Un guion entre dos numeros (ej. "TEA G1-2") es notacion de grado/rango
// clinico, no un separador de diagnosticos -> se protege antes de partir.
// Limitacion conocida: otras frases con guion que no son separadores (poco
// frecuentes en el excel real) quedan cortadas igual. Revisar
// detalle_creados/actualizados despues de importar.
function dividirDiagnosticos(raw: unknown): string[] {
    if (!raw) return [];

    const textoProtegido = String(raw).replace(/(\d)-(\d)/g, '$1~$2');

    return textoProtegido
        .split(/[,\-]+/)
        .map((s) => s.trim().replace(/~/g, '-'))
        .filter((s) => s.length > 0);
}


export function normalizarSector(valor: unknown): string | null {
    if (valor === null || valor === undefined) return null;
    const v = String(valor).trim();
    if (!v) return null;

    if (/^1$/.test(v)) return 'Sector 1 - Azul';
    if (/^2$/.test(v)) return 'Sector 2 - Rojo';
    if (/^fs$/i.test(v)) return 'Fuera de Sector';
    if (/^sector 1 - azul$/i.test(v)) return 'Sector 1 - Azul';
    if (/^sector 2 - rojo$/i.test(v)) return 'Sector 2 - Rojo';

    return v;
}

function normalizarCredencial(raw: unknown): 'sin_dato' | 'si' | 'no' | 'en_tramite' {
    if (!raw) return 'sin_dato';
    const v = String(raw).trim().toLowerCase();
    if (v.startsWith('si')) return 'si';
    if (v.startsWith('no')) return 'no';
    if (v.includes('tramite') || v.includes('trámite') || v.includes('proceso') || v.includes('inicia')) return 'en_tramite';
    return 'sin_dato';
}

// EUDALIA CARCAMO (MADRE) -> nombre: "EUDALIA CARCAMO", parentesco: "MADRE" 
function separarCuidador(raw: unknown): { nombre: string | null; parentesco: string | null } {
    if (!raw) return { nombre: null, parentesco: null };
    const texto = String(raw).trim();
    const match = texto.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (match) {
        return { nombre: match[1].trim(), parentesco: match[2].trim() };
    }
    return { nombre: texto, parentesco: null };
}

function separarNombreApellido(nombreCompleto: string): { nombre: string; apellido: string } {
    const palabras = nombreCompleto.trim().split(/\s+/).filter(Boolean);
    if (palabras.length <= 1) return { nombre: palabras[0] || '', apellido: '' };
    if (palabras.length === 2) return { nombre: palabras[0], apellido: palabras[1] };
    if (palabras.length === 3) return { nombre: palabras[0], apellido: palabras.slice(1).join(' ') };
    const mitad = Math.ceil(palabras.length / 2);
    return { nombre: palabras.slice(0, mitad).join(' '), apellido: palabras.slice(mitad).join(' ') };
}

function leerHoja(workbook: XLSX.WorkBook, nombreHoja: 'NANEAS' | 'TEA'): FilaImportada[] {
    const ws = workbook.Sheets[nombreHoja];
    if (!ws) return [];

    const filasRaw: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    const headers: string[] = (filasRaw[0] || []).map((h: any) => (h ? String(h).trim().toUpperCase() : ''));

    const idx = (nombre: string) => headers.findIndex((h) => h.includes(nombre));

    const iRut = idx('RUT');
    const iNombre = idx('NOMBRE');
    const iFecha = idx('F. NACIMIENTO');
    const iSexo = idx('SEXO');
    const iDireccion = idx('DIRECC');
    const iSector = idx('SECTOR');
    const iTelefono = idx('TELEFONO');
    const iDiagnostico = idx('DIAGNOSTICO');
    const iCredencial = idx('CREDENCIAL DISCAPACIDAD');
    const iCuidador = nombreHoja === 'NANEAS' ? idx('CUIDADOR') : -1;

    const filas: FilaImportada[] = [];

    for (let r = 1; r < filasRaw.length; r++) {
        const fila = filasRaw[r];
        if (!fila) continue;

        const rut = normalizarRut(iRut >= 0 ? fila[iRut] : null);
        if (!rut) continue; // fila fantasma (formula HOY arrastrada) o sin RUT real


        let fechaNacimiento: Date | null = null;
        if (iFecha >= 0 && fila[iFecha]) {
            const candidata = fila[iFecha] instanceof Date ? fila[iFecha] : new Date(fila[iFecha]);
            if (!isNaN(candidata.getTime())) fechaNacimiento = candidata;
        }

        filas.push({
            rut,
            nombreCompleto: iNombre >= 0 ? String(fila[iNombre] || '').trim() : '',
            fechaNacimiento,
            sexo: iSexo >= 0 ? fila[iSexo] : null,
            direccion: iDireccion >= 0 ? fila[iDireccion] : null,
            sector: iSector >= 0 ? fila[iSector] : null,
            telefono: iTelefono >= 0 ? fila[iTelefono] : null,
            diagnosticoRaw: iDiagnostico >= 0 ? fila[iDiagnostico] : null,
            credencialDiscapacidadRaw: iCredencial >= 0 ? fila[iCredencial] : null,
            cuidadorRaw: iCuidador >= 0 ? fila[iCuidador] : null,
        });
    }

    return filas;
}

export const importarExcelNaneas = async (buffer: Buffer, dryRun: boolean): Promise<ResumenImportacion> => {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const filasNaneas = leerHoja(workbook, 'NANEAS');
    const filasTea = leerHoja(workbook, 'TEA');

    // Si el mismo RUT aparece en ambas hojas, se usa la fila de TEA (trae mas
    // detalle clinico), pero se conserva el diagnostico de NANEAS si TEA no trae uno.
    const filasPorRut = new Map<string, FilaImportada>();
    for (const f of filasNaneas) filasPorRut.set(f.rut, f);
    for (const f of filasTea) {
        const existente = filasPorRut.get(f.rut);
        if (existente && !f.diagnosticoRaw) f.diagnosticoRaw = existente.diagnosticoRaw;
        filasPorRut.set(f.rut, f);
    }

    const resumen: ResumenImportacion = {
        modo_simulacion: dryRun,
        total_filas_leidas: filasPorRut.size,
        creados: 0,
        actualizados: 0,
        detalle_creados: [],
        detalle_actualizados: [],
        errores: [],
    };

    for (const fila of filasPorRut.values()) {
        try {
            const diagnosticos = dividirDiagnosticos(fila.diagnosticoRaw);
            const credencial = normalizarCredencial(fila.credencialDiscapacidadRaw);
            const credencialDetalle = fila.credencialDiscapacidadRaw ? String(fila.credencialDiscapacidadRaw).trim() : null;
            const { nombre: cuidadorNombre, parentesco: cuidadorParentesco } = separarCuidador(fila.cuidadorRaw);
            const sectorNormalizado = normalizarSector(fila.sector);
            const telefonoTutor = normalizarTelefono(fila.telefono);

            const existente = await prisma.paciente.findUnique({ where: { rut: fila.rut } });

            if (existente) {
                if (!dryRun) {
                    await prisma.paciente.update({
                        where: { rut: fila.rut },
                        data: {
                            es_naneas_prematuro: true,
                            diagnosticos: diagnosticos.length > 0 ? diagnosticos : existente.diagnosticos,
                            credencial_discapacidad: credencial !== 'sin_dato' ? credencial : existente.credencial_discapacidad,
                            credencial_discapacidad_detalle: credencialDetalle || existente.credencial_discapacidad_detalle,
                            cuidador_nombre: cuidadorNombre || existente.cuidador_nombre,
                            cuidador_parentesco: cuidadorParentesco || existente.cuidador_parentesco,
                            sector: sectorNormalizado || existente.sector,
                        },
                    });
                }
                resumen.actualizados++;
                resumen.detalle_actualizados.push({ rut: fila.rut });
            } else {
                if (!fila.nombreCompleto || !fila.fechaNacimiento) {
                    resumen.errores.push({ rut: fila.rut, motivo: 'Este paciente no se pudo agregar porque el Excel no trae su nombre completo o su fecha de nacimiento.' });
                    continue;
                }

                const { nombre, apellido } = separarNombreApellido(fila.nombreCompleto);
                const sexoNormalizado = normalizarSexo(fila.sexo) || 'Femenino';

                if (!dryRun) {
                    await prisma.paciente.create({
                        data: {
                            rut: fila.rut,
                            nombre,
                            apellido,
                            fecha_nacimiento: fila.fechaNacimiento,
                            sexo_biologico: sexoNormalizado,
                            direccion: fila.direccion ? String(fila.direccion) : 'Sin dato',
                            sector: sectorNormalizado,
                            comuna: 'Concepción',
                            activo: true,
                            es_naneas_prematuro: true,
                            diagnosticos,
                            credencial_discapacidad: credencial,
                            credencial_discapacidad_detalle: credencialDetalle,
                            cuidador_nombre: cuidadorNombre,
                            cuidador_parentesco: cuidadorParentesco,
                            tutor: {
                                create: {
                                    nombre: 'Apoderado',
                                    apellido: 'Por confirmar',
                                    parentesco: 'Por confirmar',
                                    telefono: telefonoTutor.principal,
                                    telefono_secundario: telefonoTutor.secundario,
                                    direccion: fila.direccion ? String(fila.direccion) : 'Sin dato',
                                    comuna: 'Concepción',
                                    verificado: false,
                                    
                                },
                            },
                        },
                    });
                }
                resumen.creados++;
                resumen.detalle_creados.push({ rut: fila.rut, nombre: `${nombre} ${apellido}` });
            }
        } catch (error: any) {
            console.error(`Error al importar el paciente con RUT ${fila.rut}:`, error);


            const esMensajePropio = error.message && error.message.length < 150 && !error.message.includes('prisma.');
            resumen.errores.push({
                rut: fila.rut,
                motivo: esMensajePropio ? error.message : 'Este paciente no se pudo agregar por un problema con sus datos. Pide a quien administra el sistema que revise el detalle en el registro del servidor.',
            });

        }
    }

    return resumen;
};