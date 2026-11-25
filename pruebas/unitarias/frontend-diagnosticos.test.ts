// Pruebas unitarias de los diagnósticos en el frontend: regla del formulario, buscador y texto de las vistas.
import { describe, it, expect } from 'vitest';
import { controlSchema, MENSAJE_SIN_DIAGNOSTICO } from '../../frontend/src/validation/controlClinicoSchema';
import { compararDiagnosticos, filtrarDiagnosticos, nombreDiagnostico, textoDiagnosticoControl } from '../../frontend/src/utils/diagnosticos';

const controlSinDiagnostico = {
  motivo_consulta: 'Control sano',
  anamnesis: 'Sin antecedentes relevantes desde el último control',
  peso_kg: 12.4,
  talla_cm: 86,
  exploracion_fisica: 'Examen normal',
  indicaciones_acuerdos: 'Control en seis meses',
};
const erroresDe = (datos: object) => {
  const r = controlSchema.safeParse(datos);
  return r.success ? [] : r.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
};
const ERROR_DIAGNOSTICO = { campo: 'diagnosticos_ids', mensaje: MENSAJE_SIN_DIAGNOSTICO };

describe('Diagnóstico obligatorio en el control', () => {
  it('PU-28 rechaza un control sin diagnósticos ni texto', () => {
    expect(erroresDe(controlSinDiagnostico)).toEqual([ERROR_DIAGNOSTICO]);
    expect(erroresDe({ ...controlSinDiagnostico, diagnosticos_ids: [], problemas_diagnosticados: '   ' })).toEqual([ERROR_DIAGNOSTICO]);
  });
  it('PU-29 acepta un control solo con el texto de «Otro», aunque sea corto', () => {
    expect(erroresDe({ ...controlSinDiagnostico, diagnosticos_ids: [], problemas_diagnosticados: 'Tos' })).toEqual([]);
  });
  it('PU-30 acepta un control solo con diagnósticos del catálogo', () => {
    expect(erroresDe({ ...controlSinDiagnostico, diagnosticos_ids: [3, 7] })).toEqual([]);
  });
  it('PU-31 avisa la falta de diagnóstico junto con los demás errores', () => {
    const campos = erroresDe({ ...controlSinDiagnostico, anamnesis: 'Corta', diagnosticos_ids: [] }).map((e) => e.campo);
    expect(campos.sort()).toEqual(['anamnesis', 'diagnosticos_ids']);
  });
});

describe('Buscador de diagnósticos', () => {
  const opciones = ['Asma', 'Parálisis Cerebral', 'Síndrome de Down', 'Rinofaringitis aguda (resfriado común)']
    .map((nombre, i) => ({ id_diagnostico: i + 1, nombre, tipo: 'CONDICION' as const }));
  const buscar = (texto: string) => filtrarDiagnosticos(opciones, texto).map((d) => d.nombre);

  it('PU-32 encuentra sin importar tildes ni mayúsculas', () => {
    expect(buscar('paralisis')).toEqual(['Parálisis Cerebral']);
    expect(buscar('SINDROME')).toEqual(['Síndrome de Down']);
    expect(buscar('  Comun ')).toEqual(['Rinofaringitis aguda (resfriado común)']);
  });
  it('PU-33 sin texto muestra todas las opciones', () => {
    expect(buscar('   ')).toHaveLength(opciones.length);
  });
  it('PU-34 devuelve una lista vacía si no hay coincidencias', () => {
    expect(buscar('fractura')).toEqual([]);
  });
});

describe('Texto del diagnóstico de un control', () => {
  it('PU-35 separa por coma los diagnósticos y agrega «Otro»', () => {
    expect(textoDiagnosticoControl({ diagnosticos: ['Obesidad', 'Sobrepeso'], problemas_diagnosticados: ' Tos persistente ' }))
      .toBe('OBESIDAD, SOBREPESO. Otro: Tos persistente');
  });
  it('PU-36 sin texto muestra solo los diagnósticos', () => {
    expect(textoDiagnosticoControl({ diagnosticos: ['Obesidad'], problemas_diagnosticados: null })).toBe('OBESIDAD');
  });
  it('PU-37 un control antiguo muestra solo su texto', () => {
    expect(textoDiagnosticoControl({ diagnosticos: [], problemas_diagnosticados: 'Resfrío común' })).toBe('Resfrío común');
    expect(textoDiagnosticoControl({ problemas_diagnosticados: 'Resfrío común' })).toBe('Resfrío común');
  });
  it('PU-38 devuelve vacío si no hay nada registrado', () => {
    expect(textoDiagnosticoControl({ diagnosticos: [], problemas_diagnosticados: null })).toBe('');
  });
});

describe('Nombre y orden de los diagnósticos en pantalla', () => {
  it('PU-39 muestra el nombre en mayúsculas, conservando las tildes', () => {
    expect(nombreDiagnostico('Parálisis Cerebral')).toBe('PARÁLISIS CEREBRAL');
    expect(nombreDiagnostico('  retraso dsm ')).toBe('RETRASO DSM');
  });
  it('PU-40 ordena alfabéticamente sin importar mayúsculas ni tildes', () => {
    expect(['PREMATURO 30 SEMANAS', 'Parálisis Cerebral', 'RETRASO DSM'].sort(compararDiagnosticos))
      .toEqual(['Parálisis Cerebral', 'PREMATURO 30 SEMANAS', 'RETRASO DSM']);
  });
  it('PU-41 el texto de un control lista los diagnósticos ordenados y no altera «Otro» ni el original', () => {
    const control = { diagnosticos: ['Sobrepeso', 'amigdalitis aguda'], problemas_diagnosticados: 'Tos leve' };
    expect(textoDiagnosticoControl(control)).toBe('AMIGDALITIS AGUDA, SOBREPESO. Otro: Tos leve');
    expect(control.diagnosticos).toEqual(['Sobrepeso', 'amigdalitis aguda']);
  });
});
