// Pruebas unitarias de las etiquetas y la validación al desactivar un paciente.
import { describe, it, expect } from 'vitest';
import { ETIQUETAS_MOTIVO, MOTIVOS_DESACTIVACION, errorDesactivacion, textoInactivo } from '../../frontend/src/utils/desactivacion';

describe('Etiquetas de desactivación', () => {
  it('PU-42 ofrece los 7 motivos con su etiqueta', () => {
    expect(MOTIVOS_DESACTIVACION.map((m) => [m, ETIQUETAS_MOTIVO[m]])).toEqual([
      ['TRASLADO', 'Traslado'], ['EGRESO_POR_EDAD', 'Egreso por edad'], ['FALLECIMIENTO', 'Fallecimiento'],
      ['NO_DESEA_CONTINUAR', 'No desea continuar'], ['INUBICABLE', 'Inubicable'],
      ['ERROR_DE_REGISTRO', 'Error de registro'], ['OTRO', 'Otro'],
    ]);
  });
  it('PU-43 muestra «Inactivo: <motivo> (<fecha>)»', () => {
    expect(textoInactivo({ motivo_desactivacion: 'EGRESO_POR_EDAD', fecha_desactivacion: '2026-11-25T15:00:00.000Z' }))
      .toBe('Inactivo: Egreso por edad (25-11-2026)');
  });
  it('PU-44 usa el día de Chile (01:30 UTC del 26 todavía es 25)', () => {
    expect(textoInactivo({ motivo_desactivacion: 'TRASLADO', fecha_desactivacion: '2026-11-26T01:30:00.000Z' }))
      .toBe('Inactivo: Traslado (25-11-2026)');
  });
  it('PU-45 sin motivo muestra «Sin motivo registrado»', () => {
    expect(textoInactivo({ motivo_desactivacion: null, fecha_desactivacion: null })).toBe('Sin motivo registrado');
    expect(textoInactivo({})).toBe('Sin motivo registrado');
  });
});

describe('Formulario de desactivación', () => {
  it('PU-46 exige elegir un motivo', () => {
    expect(errorDesactivacion('', 'Texto')).not.toBe('');
  });
  it('PU-47 exige el detalle solo en «Otro»', () => {
    expect(errorDesactivacion('OTRO', '   ')).not.toBe('');
    expect(errorDesactivacion('OTRO', 'Cambio de centro')).toBe('');
    expect(errorDesactivacion('TRASLADO', '')).toBe('');
  });
  it('PU-48 no acepta un detalle de más de 200 caracteres', () => {
    expect(errorDesactivacion('OTRO', 'x'.repeat(201))).not.toBe('');
    expect(errorDesactivacion('OTRO', ` ${'x'.repeat(200)} `)).toBe('');
  });
});
