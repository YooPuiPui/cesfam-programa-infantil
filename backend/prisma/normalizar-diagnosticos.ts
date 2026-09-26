// Script de una sola vez: aplica MAPA_DIAGNOSTICOS_CANONICOS de
// src/services/importacion.service.ts a los pacientes ya existentes en la
// base, para que queden alineados con lo que dividirDiagnosticos() produce
// en futuras importaciones. Ver analisis previo en la conversacion con
// Claude sobre los ~82 valores distintos de "diagnosticos".
import prisma from '../src/config/prisma';

const MAPA_DIAGNOSTICOS_CANONICOS: Record<string, string> = {
    TEA: 'TEA',
    OBSTEA: 'Obs TEA',
    TEAGRADO1: 'TEA Grado 1',
    TEAG1: 'TEA Grado 1',
    TEAGRADO2: 'TEA Grado 2',
    TDHA: 'TDAH',
    TDAH: 'TDAH',
    EPILEPSIA: 'Epilepsia',
    SDDOWN: 'Síndrome de Down',
    ENESTUDIOGENETICA: 'En Estudio de Genética',
    ESTUDIOENGENETICA: 'En Estudio de Genética',
    TANSIOSO: 'Trastorno Ansioso',
    HIPOTIROIDISMO: 'Hipotiroidismo',
    HIPOTIROIDIMO: 'Hipotiroidismo',
    TELEXPRESIVO: 'TEL Expresivo',
    TELEXP: 'TEL Expresivo',
    TCONDUCTUAL: 'Trastorno Conductual',
    TCONDUCTA: 'Trastorno Conductual',
    TOPOSIC: 'TOD',
    TOD: 'TOD',
};

const NOTAS_NO_DIAGNOSTICO = new Set([
    'NOCONFIRMADOCONNEUROLOGOOPSIQUIATRIA',
    'TRASLADOATEMUCO',
]);

function claveDiagnostico(s: string): string {
    return s.trim().toUpperCase().replace(/[.'’]/g, '').replace(/\s+/g, '');
}

function normalizarDiagnostico(s: string): string | null {
    const clave = claveDiagnostico(s);
    if (NOTAS_NO_DIAGNOSTICO.has(clave)) return null;
    return MAPA_DIAGNOSTICOS_CANONICOS[clave] ?? s;
}

async function main() {
    const pacientes = await prisma.paciente.findMany({
        select: { rut: true, nombre: true, apellido: true, diagnosticos: true },
    });

    let pacientesActualizados = 0;
    const notasRemovidas: { rut: string; nombre: string; valor: string }[] = [];

    for (const p of pacientes) {
        const nuevos = Array.from(new Set(p.diagnosticos.map(normalizarDiagnostico).filter((s): s is string => s !== null)));

        const huboNota = p.diagnosticos.some((d) => NOTAS_NO_DIAGNOSTICO.has(claveDiagnostico(d)));
        if (huboNota) {
            for (const d of p.diagnosticos) {
                if (NOTAS_NO_DIAGNOSTICO.has(claveDiagnostico(d))) {
                    notasRemovidas.push({ rut: p.rut, nombre: `${p.nombre} ${p.apellido}`, valor: d });
                }
            }
        }

        const cambio = nuevos.length !== p.diagnosticos.length || nuevos.some((d, i) => d !== p.diagnosticos[i]);
        if (cambio) {
            await prisma.paciente.update({
                where: { rut: p.rut },
                data: { diagnosticos: nuevos },
            });
            pacientesActualizados++;
        }
    }

    console.log(`Pacientes actualizados: ${pacientesActualizados}`);
    console.log('Notas no-diagnostico removidas:');
    console.table(notasRemovidas);

    const todos = await prisma.paciente.findMany({ select: { diagnosticos: true } });
    const set = new Set<string>();
    for (const p of todos) for (const d of p.diagnosticos) set.add(d);
    console.log(`Diagnosticos distintos despues del cambio: ${set.size}`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
