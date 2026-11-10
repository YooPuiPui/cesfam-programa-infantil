// Pruebas unitarias de reglas del backend que no requieren base de datos.
// La conexión a la base (Prisma) se reemplaza por un doble de prueba.
import { describe, it, expect, vi, afterEach } from 'vitest';

const pacienteFindUnique = vi.fn();
vi.mock('../../backend/src/config/prisma', () => ({
  default: { paciente: { findUnique: (...a: unknown[]) => pacienteFindUnique(...a) } },
}));
vi.mock('xlsx', () => ({}));

import { fechaCalendarioAMediodiaUTC, hoyChileMediodiaUTC } from '../../backend/src/utils/fechaChile';
import { obtenerReporteDetalle } from '../../backend/src/services/reportes.service';
import { normalizarSector } from '../../backend/src/services/importacion.service';

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (n: number) => new Date(Date.now() - n * DIA);

function pacienteConControles(controles: { dias: number; peso: number; talla: number; edad: number }[]) {
  return {
    rut: '12345678-5', nombre: 'Prueba', apellido: 'Unitaria',
    controlClinico: controles.map((c) => ({
      fecha_control: haceDias(c.dias), peso_kg: c.peso, talla_cm: c.talla,
      imc: null, edad_meses: c.edad, perimetro_cefalico: null,
    })),
  };
}

afterEach(() => { vi.useRealTimers(); pacienteFindUnique.mockReset(); });

describe('Fechas en zona horaria de Chile', () => {
  it('PU-12 convierte "2026-11-05" al mediodía UTC del mismo día', () => {
    expect(fechaCalendarioAMediodiaUTC('2026-11-05')?.toISOString()).toBe('2026-11-05T12:00:00.000Z');
  });
  it('PU-13 rechaza un día inexistente (2026-02-30)', () => {
    expect(fechaCalendarioAMediodiaUTC('2026-02-30')).toBeNull();
  });
  it('PU-14 rechaza una fecha con formato DD-MM-AAAA', () => {
    expect(fechaCalendarioAMediodiaUTC('05-11-2026')).toBeNull();
  });
  it('PU-15 a las 23:30 de Chile (02:30 UTC del día siguiente) la fecha del control sigue siendo la de Chile', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T02:30:00Z'));
    expect(hoyChileMediodiaUTC().toISOString()).toBe('2026-11-05T12:00:00.000Z');
  });
});

describe('Alertas de variación de peso (reportes)', () => {
  it('PU-16 marca "Pérdida de peso significativa" si el peso baja 1 kg en 60 días', async () => {
    pacienteFindUnique.mockResolvedValue(pacienteConControles([
      { dias: 70, peso: 10.0, talla: 80, edad: 16 }, { dias: 10, peso: 9.0, talla: 81, edad: 18 },
    ]));
    const r = await obtenerReporteDetalle('12345678-5');
    expect(r?.alertaDetalle?.tipo).toBe('Pérdida de peso significativa');
  });
  it('PU-17 marca "Aumento de peso acelerado" si el peso sube 2 kg en 60 días', async () => {
    pacienteFindUnique.mockResolvedValue(pacienteConControles([
      { dias: 70, peso: 10.0, talla: 80, edad: 16 }, { dias: 10, peso: 12.0, talla: 81, edad: 18 },
    ]));
    const r = await obtenerReporteDetalle('12345678-5');
    expect(r?.alertaDetalle?.tipo).toBe('Aumento de peso acelerado');
  });
  it('PU-18 no marca alerta con una ganancia normal (0,4 kg en 60 días)', async () => {
    pacienteFindUnique.mockResolvedValue(pacienteConControles([
      { dias: 70, peso: 10.0, talla: 80, edad: 16 }, { dias: 10, peso: 10.4, talla: 81.5, edad: 18 },
    ]));
    const r = await obtenerReporteDetalle('12345678-5');
    expect(r?.alertaDetalle).toBeNull();
  });
  it('PU-19 no calcula alerta con un solo control', async () => {
    pacienteFindUnique.mockResolvedValue(pacienteConControles([{ dias: 10, peso: 10.0, talla: 80, edad: 18 }]));
    const r = await obtenerReporteDetalle('12345678-5');
    expect(r?.alertaDetalle).toBeNull();
  });
});

describe('Normalización de la planilla del catastro NANEAS', () => {
  it('PU-20 convierte los sectores "1", "2" y "FS" a su nombre completo', () => {
    expect([normalizarSector('1'), normalizarSector('2'), normalizarSector('fs')])
      .toEqual(['Sector 1 - Azul', 'Sector 2 - Rojo', 'Fuera de Sector']);
  });
});
