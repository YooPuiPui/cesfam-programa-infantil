// Script de corrección única para el campo `sector` de pacientes que ya
// estaban en la base de datos antes de que la importación de Excel empezara
// a normalizarlo (ver normalizarSector() en importacion.service.ts).
//
// Uso:
//   npx ts-node scripts/corregir-sector-existente.ts              -> vista previa, no escribe nada
//   npx ts-node scripts/corregir-sector-existente.ts --aplicar    -> aplica los cambios de verdad
//
// No es una ruta de la API ni se conecta a ningún botón de la interfaz.
// Se ejecuta a mano, una vez, desde la terminal.

import { PrismaClient } from '@prisma/client';
import { normalizarSector } from '../src/services/importacion.service';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');

async function main() {
    const pacientes = await prisma.paciente.findMany({
        where: { sector: { not: null } },
        select: { id_paciente: true, rut: true, sector: true },
    });

    const candidatos = pacientes
        .map((p) => ({ ...p, sectorNuevo: normalizarSector(p.sector) }))
        .filter((p) => p.sectorNuevo !== null && p.sectorNuevo !== p.sector);

    if (candidatos.length === 0) {
        console.log('No hay pacientes con el sector sin normalizar. No hay nada que hacer.');
        return;
    }

    // Agrupar por "valor original -> valor nuevo" para el resumen
    const grupos = new Map<string, number>();
    for (const p of candidatos) {
        const clave = `"${p.sector}" -> "${p.sectorNuevo}"`;
        grupos.set(clave, (grupos.get(clave) || 0) + 1);
    }

    console.log(APLICAR ? '=== Aplicando corrección de sector ===' : '=== Vista previa (nada se ha guardado todavía) ===');
    console.log(`Pacientes a corregir: ${candidatos.length}\n`);
    for (const [clave, cantidad] of grupos) {
        console.log(`  ${clave}: ${cantidad} paciente(s)`);
    }

    if (!APLICAR) {
        console.log('\nEsto fue solo una vista previa. Nada se guardó en la base de datos.');
        console.log('Para aplicar los cambios de verdad, vuelve a correr:');
        console.log('  npx ts-node scripts/corregir-sector-existente.ts --aplicar');
        return;
    }

    let actualizados = 0;
    for (const p of candidatos) {
        await prisma.paciente.update({
            where: { id_paciente: p.id_paciente },
            data: { sector: p.sectorNuevo },
        });
        actualizados++;
    }

    console.log(`\nListo. Se actualizó el campo sector de ${actualizados} paciente(s).`);
}

main()
    .catch((error) => {
        console.error('Error al corregir el sector de los pacientes:', error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
