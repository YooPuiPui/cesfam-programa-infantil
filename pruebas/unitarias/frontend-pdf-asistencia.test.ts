// Pruebas unitarias de las filas y totales de la lista de asistencia en PDF.
import { describe, it, expect } from 'vitest';
import { construirFilasAsistencia, nombreArchivoAsistencia, textoPdf, type SesionAsistencia } from '../../frontend/src/utils/pdfAsistencia';

type Inscripcion = SesionAsistencia['inscripciones'][number];

const inscripcion = (nombre: string, apellido: string, extra: Partial<Inscripcion> = {}): Inscripcion => ({
  estado_asistencia: 'pendiente',
  estado_convocatoria: 'no_contactado',
  telefono_contacto: null,
  observaciones: null,
  paciente: { rut: '12345678-5', nombre, apellido, fecha_nacimiento: '2018-03-15T00:00:00.000Z' },
  ...extra,
});

const sesion = (inscripciones: Inscripcion[]): SesionAsistencia => ({
  fecha: '2026-11-25T12:00:00.000Z',
  cupo_maximo: null,
  terminada: false,
  profesional: { nombre: 'María', apellido: 'Núñez' },
  profesional_externo: null,
  taller: { nombre: 'Estimulación Temprana' },
  inscripciones,
});

describe('Lista de asistencia: totales', () => {
  it('PU-51 cuenta inscritos, asistieron, no asistieron y pendientes', () => {
    const { totales } = construirFilasAsistencia(sesion([
      inscripcion('A', 'Uno', { estado_asistencia: 'asiste' }),
      inscripcion('B', 'Dos', { estado_asistencia: 'asiste' }),
      inscripcion('C', 'Tres', { estado_asistencia: 'no_asiste' }),
      inscripcion('D', 'Cuatro'),
    ]));
    expect(totales).toEqual({ inscritos: 4, asistieron: 2, noAsistieron: 1, pendientes: 1 });
  });
  it('PU-52 sin inscritos no hay filas y los totales quedan en cero', () => {
    expect(construirFilasAsistencia(sesion([]))).toEqual({
      filas: [], totales: { inscritos: 0, asistieron: 0, noAsistieron: 0, pendientes: 0 },
    });
  });
});

describe('Lista de asistencia: orden', () => {
  it('PU-53 ordena por apellido y luego por nombre, respetando tildes y ñ, y numera desde 1', () => {
    const entrada = [
      inscripcion('Ana', 'Zúñiga'), inscripcion('Luis', 'Ñancupil'), inscripcion('Sofía', 'Álvarez'),
      inscripcion('Pedro', 'Nuñez'), inscripcion('Beatriz', 'Álvarez'), inscripcion('Iván', 'oyarzo'),
    ];
    const { filas } = construirFilasAsistencia(sesion(entrada));
    expect(filas.map((f) => `${f.numero} ${f.nombre}`)).toEqual([
      '1 Álvarez, Beatriz', '2 Álvarez, Sofía', '3 Nuñez, Pedro', '4 Ñancupil, Luis', '5 oyarzo, Iván', '6 Zúñiga, Ana',
    ]);
  });
  it('PU-54 no modifica la sesión recibida', () => {
    const entrada = [inscripcion('Ana', 'Zúñiga'), inscripcion('Sofía', 'Álvarez')];
    const original = structuredClone(entrada);
    construirFilasAsistencia(sesion(entrada));
    expect(entrada).toEqual(original);
  });
});

describe('Lista de asistencia: estados y datos de cada fila', () => {
  it('PU-55 muestra la etiqueta de cada estado de asistencia', () => {
    const { filas } = construirFilasAsistencia(sesion([
      inscripcion('A', 'A', { estado_asistencia: 'pendiente' }),
      inscripcion('B', 'B', { estado_asistencia: 'asiste' }),
      inscripcion('C', 'C', { estado_asistencia: 'no_asiste' }),
    ]));
    expect(filas.map((f) => f.asistencia)).toEqual(['Pendiente', 'Asistió', 'No asistió']);
  });
  it('PU-56 muestra la etiqueta de cada estado de convocatoria', () => {
    const estados = ['no_contactado', 'contactado', 'confirma', 'no_confirma', 'no_contesta', 'no_puede', 'reconfirmar'] as const;
    const { filas } = construirFilasAsistencia(sesion(
      estados.map((estado, n) => inscripcion('A', `Apellido ${n}`, { estado_convocatoria: estado })),
    ));
    expect(filas.map((f) => f.convocatoria)).toEqual(
      ['No contactado', 'Contactado', 'Confirma', 'No confirma', 'No contesta', 'No puede', 'Reconfirmar']);
  });
  it('PU-57 formatea RUT, edad el día de la sesión, teléfono y observaciones', () => {
    const { filas } = construirFilasAsistencia(sesion([
      inscripcion('Ana', 'Soto', { telefono_contacto: ' +56912345678 ', observaciones: '  Llega tarde  ' }),
    ]));
    expect(filas[0]).toMatchObject({ rut: '12.345.678-5', edad: '8a 8m', telefono: '+56912345678', observaciones: 'Llega tarde' });
  });
  it('PU-58 sin teléfono muestra un guion y las observaciones quedan vacías', () => {
    const { filas } = construirFilasAsistencia(sesion([inscripcion('Ana', 'Soto', { telefono_contacto: '  ' })]));
    expect(filas[0]).toMatchObject({ telefono: '-', observaciones: '' });
  });
});

describe('Lista de asistencia: texto y nombre del archivo', () => {
  it('PU-59 cambia los caracteres que las fuentes del PDF no dibujan', () => {
    expect(textoPdf('“Mamá” avisó — llega ‘tarde’… 👍 Dvořák')).toBe('"Mamá" avisó - llega \'tarde\'... ? Dvorák');
    expect(textoPdf('Nuñez')).toBe('Nuñez');
  });
  it('PU-60 el nombre del archivo no lleva tildes, ñ ni espacios', () => {
    expect(nombreArchivoAsistencia({ fecha: '2026-11-25T12:00:00.000Z', taller: { nombre: '  Niñez y Alimentación (2° nivel) ' } }))
      .toBe('asistencia-ninez-y-alimentacion-2-nivel-2026-11-25.pdf');
  });
});
