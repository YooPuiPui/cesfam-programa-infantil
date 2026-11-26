// Pruebas unitarias del importador de Excel: cómo resuelve los diagnósticos contra el catálogo.
// La conexión a la base (Prisma) se reemplaza por un doble de prueba que guarda en memoria.
import { createRequire } from 'node:module';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const base = vi.hoisted(() => {
  type Tipo = 'CONDICION' | 'CONTROL';
  const catalogo: { nombre: string; tipo: Tipo }[] = [];
  const existentes = new Set<string>(); // rut de pacientes ya registrados
  const desactivados = new Set<string>(); // rut de pacientes registrados que están desactivados
  const enlazados = new Map<string, string[]>(); // rut -> diagnósticos escritos

  // imita la escritura anidada diagnosticosRel.create con connectOrCreate
  const escribir = (rut: string, rel: any) => {
    if (!rel) return;
    const nombres: string[] = rel.create.map((c: any) => c.diagnostico.connectOrCreate.where.nombre);
    if (new Set(nombres).size !== nombres.length) throw new Error('diagnóstico repetido en el paciente');
    for (const { diagnostico: { connectOrCreate: { create } } } of rel.create) {
      if (!catalogo.some((d) => d.nombre === create.nombre)) catalogo.push({ ...create });
    }
    enlazados.set(rut, nombres);
  };

  return {
    catalogo, existentes, desactivados, enlazados,
    prisma: {
      diagnostico: { findMany: vi.fn(async () => catalogo.map((d) => ({ ...d }))) },
      comuna: { upsert: vi.fn(async () => ({ id_comuna: 1 })) },
      paciente: {
        findUnique: vi.fn(async ({ where }: any) => (existentes.has(where.rut) ? { rut: where.rut, id_cuidador: null, activo: !desactivados.has(where.rut) } : null)),
        create: vi.fn(async ({ data }: any) => escribir(data.rut, data.diagnosticosRel)),
        update: vi.fn(async ({ where, data }: any) => escribir(where.rut, data.diagnosticosRel)),
      },
    },
  };
});
vi.mock('../../backend/src/config/prisma', () => ({ default: base.prisma }));

import { importarExcelNaneas } from '../../backend/src/services/importacion.service';

const XLSX = createRequire(new URL('../../backend/package.json', import.meta.url))('xlsx');

// planilla con una fila por [rut, texto de la celda DIAGNOSTICO]
function planilla(filas: [string, string][]): Buffer {
  const encabezado = ['RUT', 'NOMBRE', 'F. NACIMIENTO', 'DIAGNOSTICO'];
  const hoja = XLSX.utils.aoa_to_sheet([encabezado, ...filas.map(([rut, dx]) => [rut, 'Paciente De Prueba', '2019-05-10', dx])]);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'NANEAS');
  return XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
}

const MOTIVO = 'diagnóstico de control no válido como condición';
const nombres = () => base.catalogo.map((d) => d.nombre);
const INICIAL = ['Asma', 'Parálisis Cerebral', 'TEA', 'Sobrepeso'];

beforeEach(() => {
  base.catalogo.splice(0, base.catalogo.length,
    { nombre: 'Asma', tipo: 'CONDICION' }, { nombre: 'Parálisis Cerebral', tipo: 'CONDICION' },
    { nombre: 'TEA', tipo: 'CONDICION' }, { nombre: 'Sobrepeso', tipo: 'CONTROL' });
  base.existentes.clear();
  base.desactivados.clear();
  base.enlazados.clear();
  vi.clearAllMocks();
});

describe('Importador: diagnósticos contra el catálogo', () => {
  it('PU-21 "asma", "ASMA" y " Asma " en una celda quedan como un solo diagnóstico', async () => {
    const r = await importarExcelNaneas(planilla([['11111111-1', 'asma, ASMA,  Asma ']]), false);
    expect(r.errores).toEqual([]);
    expect(base.enlazados.get('11111111-1')).toEqual(['Asma']);
    expect(nombres()).toEqual(INICIAL);
  });

  it('PU-22 las mismas variantes en filas distintas usan el diagnóstico existente', async () => {
    await importarExcelNaneas(planilla([['11111111-1', 'asma'], ['22222222-2', 'ASMA'], ['33333333-3', ' Asma ']]), false);
    expect([...base.enlazados.values()]).toEqual([['Asma'], ['Asma'], ['Asma']]);
    expect(nombres()).toEqual(INICIAL);
  });

  it('PU-23 ignora tildes y espacios repetidos al comparar', async () => {
    base.catalogo.push({ nombre: 'Retraso del Habla', tipo: 'CONDICION' });
    await importarExcelNaneas(planilla([['11111111-1', 'PARALISIS   CEREBRAL, retraso   del  hablá']]), false);
    expect(base.enlazados.get('11111111-1')).toEqual(['Parálisis Cerebral', 'Retraso del Habla']);
    expect(base.catalogo).toHaveLength(5);
  });

  it('PU-24 un diagnóstico nuevo se crea una sola vez como condición, con el nombre tal como viene', async () => {
    await importarExcelNaneas(planilla([['11111111-1', 'Síndrome  Raro, SINDROME RARO'], ['22222222-2', 'sindrome raro']]), false);
    expect(base.catalogo.slice(INICIAL.length)).toEqual([{ nombre: 'Síndrome  Raro', tipo: 'CONDICION' }]);
    expect([...base.enlazados.values()]).toEqual([['Síndrome  Raro'], ['Síndrome  Raro']]);
  });

  it('PU-25 un diagnóstico de control no se enlaza, se informa en su fila y las demás continúan', async () => {
    const r = await importarExcelNaneas(planilla([['11111111-1', 'SOBREPESO, TEA'], ['22222222-2', 'asma']]), false);
    expect(r.errores).toEqual([{ rut: '11111111-1', motivo: MOTIVO }]);
    expect(r.creados).toBe(2);
    expect(base.enlazados.get('11111111-1')).toEqual(['TEA']);
    expect(base.enlazados.get('22222222-2')).toEqual(['Asma']);
    expect(nombres()).toEqual(INICIAL);
  });

  it('PU-26 un paciente existente que solo trae un diagnóstico de control conserva los suyos', async () => {
    base.existentes.add('11111111-1');
    const r = await importarExcelNaneas(planilla([['11111111-1', 'sobrepeso']]), false);
    expect(r.errores).toEqual([{ rut: '11111111-1', motivo: MOTIVO }]);
    expect(base.prisma.paciente.update.mock.calls[0][0].data).not.toHaveProperty('diagnosticosRel');
  });

  it('PU-27 la simulación informa el error y no escribe nada', async () => {
    base.existentes.add('11111111-1');
    const r = await importarExcelNaneas(planilla([['11111111-1', 'Sobrepeso'], ['22222222-2', 'Diagnóstico Nuevo']]), true);
    expect(r.errores).toEqual([{ rut: '11111111-1', motivo: MOTIVO }]);
    expect(base.prisma.paciente.create).not.toHaveBeenCalled();
    expect(base.prisma.paciente.update).not.toHaveBeenCalled();
    expect(base.prisma.comuna.upsert).not.toHaveBeenCalled();
    expect(nombres()).toEqual(INICIAL);
  });

  it.each([['PU-49 al importar', false], ['PU-50 en la simulación', true]] as const)('%s un paciente desactivado no se actualiza y se informa en su fila', async (_, simulacion) => {
    base.existentes.add('11111111-1');
    base.desactivados.add('11111111-1');
    const r = await importarExcelNaneas(planilla([['11111111-1', 'asma']]), simulacion);
    expect(r.errores).toEqual([{ rut: '11111111-1', motivo: expect.stringContaining('desactivado') }]);
    expect(r.actualizados).toBe(0);
    expect(base.prisma.paciente.update).not.toHaveBeenCalled();
  });
});
