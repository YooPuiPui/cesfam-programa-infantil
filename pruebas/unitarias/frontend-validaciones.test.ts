// Pruebas unitarias de las funciones de validación y cálculo del frontend.
import { describe, it, expect } from 'vitest';
import { controlSchema } from '../../frontend/src/validation/controlClinicoSchema';
import { validarRUTCompleto, calcularIMC, normalizarTexto } from '../../frontend/src/utils/formatters';

const controlValido = {
  motivo_consulta: 'Control sano',
  anamnesis: 'Sin antecedentes relevantes desde el último control',
  peso_kg: 12.4,
  talla_cm: 86,
  exploracion_fisica: 'Examen normal',
  problemas_diagnosticados: 'Niño sano',
  indicaciones_acuerdos: 'Control en seis meses',
};

describe('Formulario de control clínico (Zod)', () => {
  it('PU-01 acepta un control con todos los campos dentro de rango', () => {
    expect(controlSchema.safeParse(controlValido).success).toBe(true);
  });
  it('PU-02 rechaza un peso menor a 0,5 kg', () => {
    expect(controlSchema.safeParse({ ...controlValido, peso_kg: 0.4 }).success).toBe(false);
  });
  it('PU-03 rechaza un peso mayor a 150 kg', () => {
    expect(controlSchema.safeParse({ ...controlValido, peso_kg: 151 }).success).toBe(false);
  });
  it('PU-04 rechaza una talla menor a 20 cm', () => {
    expect(controlSchema.safeParse({ ...controlValido, talla_cm: 19 }).success).toBe(false);
  });
  it('PU-05 rechaza una anamnesis de menos de 10 caracteres', () => {
    expect(controlSchema.safeParse({ ...controlValido, anamnesis: 'Corta' }).success).toBe(false);
  });
});

describe('Cálculo del IMC', () => {
  it('PU-06 calcula el IMC con un decimal (12,5 kg y 85 cm = 17,3)', () => {
    expect(calcularIMC(12.5, 85)).toBe(17.3);
  });
  it('PU-07 devuelve 0 si la talla es 0', () => {
    expect(calcularIMC(12.5, 0)).toBe(0);
  });
});

describe('Validación del RUT (dígito verificador)', () => {
  it('PU-08 acepta un RUT con dígito numérico correcto (12.345.678-5)', () => {
    expect(validarRUTCompleto('12.345.678-5')).toBe(true);
  });
  it('PU-09 rechaza un RUT con dígito incorrecto (12.345.678-9)', () => {
    expect(validarRUTCompleto('12.345.678-9')).toBe(false);
  });
  it('PU-10 acepta un RUT cuyo dígito verificador es K (10.000.013-K)', () => {
    expect(validarRUTCompleto('10.000.013-K')).toBe(true);
  });
});

describe('Búsqueda sin tildes ni mayúsculas', () => {
  it('PU-11 normaliza "Ángel" para que la búsqueda "angel" lo encuentre', () => {
    expect(normalizarTexto('Ángel')).toBe(normalizarTexto('angel'));
  });
});
