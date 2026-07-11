import prisma from "../config/prisma";

const UMBRAL_PERDIDA_KG_MES = -0.3; // cualquier pérdida sostenida es atípica en un niño en crecimiento activo
const VENTANA_MESES_ALERTA = 24;
const MIN_DIAS_ENTRE_CONTROLES = 5; // ignora tramos demasiado cortos (ruido/errores de tipeo)

function mesesEntre(fechaA: Date, fechaB: Date): number {
    const dias = Math.abs(fechaA.getTime() - fechaB.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(dias / 30, 0.1);
}

function diasEntre(fechaA: Date, fechaB: Date): number {
    return Math.abs(fechaA.getTime() - fechaB.getTime()) / (1000 * 60 * 60 * 24);
}

const PUNTOS_EDAD_PESO = [0, 3, 6, 12, 24, 36, 48, 60, 72, 84, 96, 108];
const PUNTOS_PESO_REF = [3.3, 6.0, 7.8, 9.6, 12.2, 14.3, 16.3, 18.0, 20.5, 22.9, 25.6, 28.6];

function pesoEsperadoParaEdad(edadMeses: number): number {
    if (edadMeses <= PUNTOS_EDAD_PESO[0]) return PUNTOS_PESO_REF[0];
    if (edadMeses >= PUNTOS_EDAD_PESO[PUNTOS_EDAD_PESO.length - 1]) return PUNTOS_PESO_REF[PUNTOS_PESO_REF.length - 1];

    for (let i = 0; i < PUNTOS_EDAD_PESO.length - 1; i++) {
        if (edadMeses >= PUNTOS_EDAD_PESO[i] && edadMeses <= PUNTOS_EDAD_PESO[i + 1]) {
            const proporcion = (edadMeses - PUNTOS_EDAD_PESO[i]) / (PUNTOS_EDAD_PESO[i + 1] - PUNTOS_EDAD_PESO[i]);
            return PUNTOS_PESO_REF[i] + proporcion * (PUNTOS_PESO_REF[i + 1] - PUNTOS_PESO_REF[i]);
        }
    }
    return PUNTOS_PESO_REF[PUNTOS_PESO_REF.length - 1];
}

function gananciaEsperadaKgMes(edadMeses: number): number {
    const antes = pesoEsperadoParaEdad(Math.max(edadMeses - 1, 0));
    const despues = pesoEsperadoParaEdad(edadMeses + 1);
    return Math.max((despues - antes) / 2, 0.05);
}

function umbralGananciaKgMes(edadMeses: number): number {
    return Math.max(gananciaEsperadaKgMes(edadMeses) * 3, 0.4);
}

interface ControlLiviano {
    fecha_control: Date;
    peso_kg: number;
    talla_cm: number;
    edad_meses: number;
}

interface TramoDetectado {
    desde: string;
    hasta: string;
    tipo: string;
    tasaPesoKgMes: number;
    tasaTallaCmMes: number;
}

function calcularTramosConAlerta(controlesVentana: ControlLiviano[]): TramoDetectado[] {
    const tramos: TramoDetectado[] = [];

    for (let i = 1; i < controlesVentana.length; i++) {
        const anterior = controlesVentana[i - 1];
        const actual = controlesVentana[i];

        if (diasEntre(anterior.fecha_control, actual.fecha_control) < MIN_DIAS_ENTRE_CONTROLES) {
            continue;
        }

        const meses = mesesEntre(anterior.fecha_control, actual.fecha_control);
        const tasaPesoKgMes = Number(((actual.peso_kg - anterior.peso_kg) / meses).toFixed(2));
        const tasaTallaCmMes = Number(((actual.talla_cm - anterior.talla_cm) / meses).toFixed(2));

        let tipo: string | null = null;
        const umbralGanancia = umbralGananciaKgMes(actual.edad_meses);

        if (tasaPesoKgMes >= umbralGanancia) {
            tipo = 'Aumento de peso acelerado';
        } else if (tasaPesoKgMes <= UMBRAL_PERDIDA_KG_MES) {
            tipo = 'Pérdida de peso significativa';
        }

        if (tipo) {
            tramos.push({
                desde: anterior.fecha_control.toISOString(),
                hasta: actual.fecha_control.toISOString(),
                tipo,
                tasaPesoKgMes,
                tasaTallaCmMes,
            });
        }
    }

    return tramos;
}

export const obtenerReportePacientes = async (
    page: number,
    limit: number,
    filtro?: string,
    busqueda?: string
) => {
    const haceVeinticuatroMeses = new Date();
    haceVeinticuatroMeses.setMonth(haceVeinticuatroMeses.getMonth() - VENTANA_MESES_ALERTA);

    const pacientes = await prisma.paciente.findMany({
        where: { activo: true },
        select: {
            rut: true,
            nombre: true,
            apellido: true,
            controlClinico: {
                orderBy: { fecha_control: 'desc' },
                take: 30,
                select: {
                    fecha_control: true,
                    peso_kg: true,
                    talla_cm: true,
                    edad_meses: true,
                },
            },
            _count: { select: { controlClinico: true } },
        },
    });

    let reportes = pacientes.map((p) => {
        const controlesDesc = p.controlClinico;
        const ultimo = controlesDesc[0] ?? null;

        const controlesVentana = controlesDesc
            .filter((c) => c.fecha_control >= haceVeinticuatroMeses)
            .slice()
            .reverse();

        const tramosConAlerta = calcularTramosConAlerta(controlesVentana);

        const alertaMasReciente = tramosConAlerta.length > 0 ? tramosConAlerta[tramosConAlerta.length - 1] : null;

        let tasaPesoKgMes: number | null = null;
        let tasaTallaCmMes: number | null = null;

        if (alertaMasReciente) {
            tasaPesoKgMes = alertaMasReciente.tasaPesoKgMes;
            tasaTallaCmMes = alertaMasReciente.tasaTallaCmMes;
        } else if (controlesVentana.length >= 2) {
            const penultimo = controlesVentana[controlesVentana.length - 2];
            const ultimoEnVentana = controlesVentana[controlesVentana.length - 1];
            const meses = mesesEntre(penultimo.fecha_control, ultimoEnVentana.fecha_control);
            tasaPesoKgMes = Number(((ultimoEnVentana.peso_kg - penultimo.peso_kg) / meses).toFixed(2));
            tasaTallaCmMes = Number(((ultimoEnVentana.talla_cm - penultimo.talla_cm) / meses).toFixed(2));
        }

        return {
            rut: p.rut,
            nombre: `${p.nombre} ${p.apellido}`,
            edad_meses: ultimo?.edad_meses ?? null,
            ultimo_control: ultimo?.fecha_control ?? null,
            totalControles: p._count.controlClinico,
            controlesEnVentana: controlesVentana.length,
            tasaPesoKgMes,
            tasaTallaCmMes,
            alerta: alertaMasReciente?.tipo ?? null,
            totalAlertasEnVentana: tramosConAlerta.length,
        };
    });

    if (filtro === 'alerta') {
        reportes = reportes.filter((r) => r.alerta !== null);
    } else if (filtro === 'con_datos') {
        reportes = reportes.filter((r) => r.alerta === null && r.controlesEnVentana >= 2);
    } else if (filtro === 'sin_datos') {
        reportes = reportes.filter((r) => r.controlesEnVentana < 2);
    }

    if (busqueda && busqueda.trim() !== '') {
        const texto = busqueda.trim().toLowerCase();
        reportes = reportes.filter(
            (r) => r.rut.toLowerCase().includes(texto) || r.nombre.toLowerCase().includes(texto)
        );
    }

    reportes.sort((a, b) => {
        const rangoA = a.alerta ? 0 : a.controlesEnVentana >= 2 ? 1 : 2;
        const rangoB = b.alerta ? 0 : b.controlesEnVentana >= 2 ? 1 : 2;
        if (rangoA !== rangoB) return rangoA - rangoB;

        const fechaA = a.ultimo_control ? new Date(a.ultimo_control).getTime() : 0;
        const fechaB = b.ultimo_control ? new Date(b.ultimo_control).getTime() : 0;
        return fechaB - fechaA;
    });

    const total = reportes.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;
    const data = reportes.slice(start, start + limit);

    return {
        data,
        meta: { total, totalPages, page, limit },
    };
};

export const obtenerReporteDetalle = async (rut: string) => {
    const paciente = await prisma.paciente.findUnique({
        where: { rut },
        include: {
            controlClinico: { orderBy: { fecha_control: 'asc' } },
        },
    });

    if (!paciente) return null;

    return {
        rut: paciente.rut,
        nombre: `${paciente.nombre} ${paciente.apellido}`,
        historial: paciente.controlClinico.map((c) => ({
            fecha: c.fecha_control,
            peso_kg: c.peso_kg,
            talla_cm: c.talla_cm,
            imc: c.imc,
            edad_meses: c.edad_meses,
            perimetro_cefalico: c.perimetro_cefalico,
        })),
    };
};