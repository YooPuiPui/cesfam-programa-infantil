// =============================================================================
// SEED DE DATOS DE PRUEBA — SGPI (CESFAM Programa Infantil)
// =============================================================================
// Genera datos FALSOS (faker) coherentes con el schema y las reglas actuales,
// pensados para que todos los módulos tengan algo que mostrar:
//
//   Dashboard ....... flags de riesgo (SENAME, NANEAS, trans, migrante) y
//                     caracterización (0-9 / 10-18 años, activos, diagnósticos,
//                     credencial de discapacidad, cuidador)
//   Pacientes ....... activos/inactivos, tutores verificados y "Por confirmar"
//                     (como los que crea la importación Excel), hermanos con el
//                     mismo tutor, pacientes recién inscritos sin controles
//   Agenda .......... próximos controles atrasados / hoy / esta semana / mes
//   Controles ....... IMC solo desde los 2 años, perímetro cefálico hasta los 3
//   Reportes ........ alertas de aumento y pérdida de peso que SÍ superan los
//                     umbrales de reportes.service.ts
//   Talleres ........ talleres activos e inactivo, sesiones pasadas (asistencia
//                     marcada), una sesión HOY y sesiones futuras (pendientes)
//
// Alcance: Programa Infantil 0-9 años; solo pacientes NANEAS llegan hasta 18.
//
// USO (desde /backend):
//   npx prisma db seed                    -> solo si la base NO tiene pacientes
//   npx prisma db seed -- --reset         -> BORRA pacientes, tutores, controles,
//                                            profesionales y talleres, y regenera
//
// Usuario de login (opcional): si defines SEED_PASSWORD se crea/actualiza el
// usuario del profesional principal con esa clave. La tabla Usuario NUNCA se
// borra. La clave no va en el código porque el repo es público:
//   read -s SEED_PASSWORD && export SEED_PASSWORD
//   npx prisma db seed -- --reset
//
// ⚠️ NO correr con --reset en una base con datos reales (ej. después de
// importar el Excel del CESFAM): se pierden.
// =============================================================================

import { PrismaClient, EstadoAsistencia, EstadoConvocatoria, EstadoCredencialDiscapacidad } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';
import bcrypt from 'bcrypt';
import { obtenerHoyChile } from '../src/utils/fechaChile';

const prisma = new PrismaClient();
const RESET = process.argv.includes('--reset');

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
const TOTAL_TUTORES = 70;
const TOTAL_PACIENTES_INFANTIL = 100; // 0-9 años sin diagnóstico NANEAS
const TOTAL_PACIENTES_NANEAS = 50; // 1.5-17 años con diagnóstico
const PACIENTES_SIN_CONTROL = 8; // recién inscritos, aún sin control
const CANTIDAD_ALERTA_GANANCIA = 6;
const CANTIDAD_ALERTA_PERDIDA = 6;
const CANTIDAD_SENAME = 10;
const CANTIDAD_TRANS = 8;
const EDAD_MINIMA_MESES_TRANS = 48;
const EDAD_MAXIMA_MESES_PREMATURO = 60;
const EDAD_MESES_IMC = 24; // IMC solo desde los 2 años (validación clínica)

// Profesional principal (login). Mismo RUT que los seeds anteriores.
const PROFESIONAL_PRINCIPAL = { rut: '21118397-7', nombre: 'Francisca', apellido: 'Huaique', estamento: 'Médico' };

const SECTORES = [
    { value: 'Sector 1 - Azul', weight: 45 },
    { value: 'Sector 2 - Rojo', weight: 45 },
    { value: 'Fuera de Sector', weight: 10 },
];
const COMUNA_UNICA = 'Concepción';

// Diagnósticos con los mismos valores que guardan la importación Excel
// (MAPA_DIAGNOSTICOS_CANONICOS) y los checkboxes de editarPaciente.tsx.
const DIAGNOSTICOS = [
    { value: 'TEA', weight: 30 },
    { value: 'TEA Grado 1', weight: 14 },
    { value: 'TEA Grado 2', weight: 6 },
    { value: 'Obs TEA', weight: 10 },
    { value: 'TDAH', weight: 16 },
    { value: 'TEL Expresivo', weight: 10 },
    { value: 'Epilepsia', weight: 6 },
    { value: 'Síndrome de Down', weight: 4 },
    { value: 'Trastorno Ansioso', weight: 6 },
    { value: 'Trastorno Conductual', weight: 6 },
    { value: 'TOD', weight: 5 },
    { value: 'Hipotiroidismo', weight: 4 },
    { value: 'En Estudio de Genética', weight: 3 },
    { value: 'TRASTORNOS GENERALIZADOS DEL DESARROLLO', weight: 3 },
    { value: 'PARALISIS CEREBRAL', weight: 2 },
    { value: 'ASMA', weight: 5 },
];
const DIAGNOSTICOS_SALUD_MENTAL = new Set(['TDAH', 'Trastorno Ansioso', 'Trastorno Conductual', 'TOD']);
const esTEA = (d: string) => d.includes('TEA');

const ESTAMENTOS_EXTRA = [
    'Enfermera/o', 'Enfermera/o', 'Nutricionista', 'Psicóloga/o', 'Fonoaudióloga/o',
    'Terapeuta Ocupacional', 'Kinesióloga/o', 'Educadora de Párvulos', 'Médico',
];
const ESTAMENTOS_CONTROL = new Set(['Médico', 'Enfermera/o', 'Nutricionista']);

// Los tres primeros son los talleres reales del CESFAM (hojas de asistencia).
type FiltroTaller = 'naneas' | 'tea' | 'todos';
const TALLERES: { nombre: string; descripcion: string; edad_min: number; edad_max: number; estamento: string; filtro: FiltroTaller; activo: boolean; sesionHoy: boolean }[] = [
    { nombre: 'Manejo de Desregulaciones', descripcion: 'Estrategias para prevenir y acompañar episodios de desregulación emocional y conductual, con participación de cuidadores.', edad_min: 3, edad_max: 12, estamento: 'Terapeuta Ocupacional', filtro: 'naneas', activo: true, sesionHoy: true },
    { nombre: 'Sexualidad en TEA', descripcion: 'Educación en sexualidad, autocuidado y límites corporales adaptada a niños, niñas y adolescentes con TEA.', edad_min: 10, edad_max: 18, estamento: 'Psicóloga/o', filtro: 'tea', activo: true, sesionHoy: false },
    { nombre: 'Trabajando Mis Habilidades Sociales', descripcion: 'Espacio grupal para trabajar interacción, turnos, juego compartido y resolución de conflictos.', edad_min: 5, edad_max: 14, estamento: 'Psicóloga/o', filtro: 'naneas', activo: true, sesionHoy: false },
    { nombre: 'Estimulación del Lenguaje', descripcion: 'Actividades lúdicas de estimulación del lenguaje expresivo y comprensivo.', edad_min: 2, edad_max: 6, estamento: 'Fonoaudióloga/o', filtro: 'todos', activo: true, sesionHoy: false },
    { nombre: 'Alimentación Saludable en Familia', descripcion: 'Taller educativo para niños, niñas y sus familias sobre hábitos alimentarios.', edad_min: 3, edad_max: 9, estamento: 'Nutricionista', filtro: 'todos', activo: false, sesionHoy: false },
];
const PROFESIONALES_EXTERNOS = ['Fundación Amanecer (externo)', 'Equipo CESFAM Tucapel (externo)', 'Voluntariado UBB Psicología (externo)'];

// ---------------------------------------------------------------------------
// Fechas (hora Chile, guardadas a mediodía UTC para evitar corrimientos)
// ---------------------------------------------------------------------------
const hoyChile = obtenerHoyChile();
const HOY_ANIO = hoyChile.anio;
const HOY_MES = hoyChile.mes;
const HOY_DIA = hoyChile.dia;

function fechaSoloDia(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
}
function hoyMasDias(dias: number): Date {
    return fechaSoloDia(HOY_ANIO, HOY_MES, HOY_DIA + dias);
}
function sumarDias(fecha: Date, dias: number): Date {
    const nueva = new Date(fecha);
    nueva.setUTCDate(nueva.getUTCDate() + dias);
    return nueva;
}
function restarMeses(fecha: Date, meses: number): Date {
    return fechaSoloDia(fecha.getUTCFullYear(), fecha.getUTCMonth() - meses, fecha.getUTCDate());
}
// Misma regla que calcularEdadEnMeses() del frontend (meses cumplidos)
function mesesCumplidos(nacimiento: Date, referencia: Date): number {
    let meses = (referencia.getUTCFullYear() - nacimiento.getUTCFullYear()) * 12 + referencia.getUTCMonth() - nacimiento.getUTCMonth();
    if (referencia.getUTCDate() < nacimiento.getUTCDate()) meses--;
    return Math.max(meses, 0);
}
const HOY = hoyMasDias(0);

// ---------------------------------------------------------------------------
// RUT chileno válido (dígito verificador correcto) y único
// ---------------------------------------------------------------------------
const ANCLAS_ANIO = [1960, 1970, 1980, 1990, 2000, 2010, 2015, 2018, 2020, 2022, 2024, 2026];
const ANCLAS_RUT = [4000000, 6500000, 9000000, 11800000, 14000000, 18500000, 21000000, 23000000, 24500000, 26000000, 27300000, 28300000];
const rutsUsados = new Set<string>([PROFESIONAL_PRINCIPAL.rut]);

function interpolarRutBase(anio: number): number {
    if (anio <= ANCLAS_ANIO[0]) return ANCLAS_RUT[0];
    if (anio >= ANCLAS_ANIO[ANCLAS_ANIO.length - 1]) return ANCLAS_RUT[ANCLAS_RUT.length - 1];
    for (let i = 0; i < ANCLAS_ANIO.length - 1; i++) {
        if (anio >= ANCLAS_ANIO[i] && anio <= ANCLAS_ANIO[i + 1]) {
            const p = (anio - ANCLAS_ANIO[i]) / (ANCLAS_ANIO[i + 1] - ANCLAS_ANIO[i]);
            return ANCLAS_RUT[i] + p * (ANCLAS_RUT[i + 1] - ANCLAS_RUT[i]);
        }
    }
    return ANCLAS_RUT[ANCLAS_RUT.length - 1];
}
function digitoVerificador(numero: number): string {
    let suma = 0;
    let mult = 2;
    for (const d of numero.toString().split('').reverse()) {
        suma += parseInt(d) * mult;
        mult = mult === 7 ? 2 : mult + 1;
    }
    const resto = 11 - (suma % 11);
    return resto === 11 ? '0' : resto === 10 ? 'K' : resto.toString();
}
function generarRUT(anioNacimiento: number): string {
    for (;;) {
        const numero = Math.max(Math.round(interpolarRutBase(anioNacimiento) + faker.number.int({ min: -300000, max: 300000 })), 1000000);
        const rut = `${numero}-${digitoVerificador(numero)}`;
        if (!rutsUsados.has(rut)) {
            rutsUsados.add(rut);
            return rut;
        }
    }
}
const anioNacimientoAdulto = () => HOY_ANIO - faker.number.int({ min: 22, max: 62 });
const telefonoMovil = () => `+569${faker.number.int({ min: 10000000, max: 99999999 })}`;

// ---------------------------------------------------------------------------
// Curvas de crecimiento aproximadas 0-18 años (promedio ambos sexos)
// ---------------------------------------------------------------------------
const PUNTOS_EDAD = [0, 3, 6, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 144, 168, 192, 216];
const PUNTOS_PESO = [3.3, 6.0, 7.8, 9.6, 12.2, 14.3, 16.3, 18.0, 20.5, 22.9, 25.6, 28.6, 32.0, 40.5, 50.5, 57.5, 61.5];
const PUNTOS_TALLA = [50, 61, 67, 75, 87, 96, 103, 110, 116, 122, 128, 133, 138, 150, 162, 168, 171];
const PUNTOS_PERIMETRO = [34, 40, 43, 46, 48, 49, 50, 50, 51, 51, 52, 52, 52, 53, 54, 55, 55];

function interpolar(x: number, xs: number[], ys: number[]): number {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    for (let i = 0; i < xs.length - 1; i++) {
        if (x >= xs[i] && x <= xs[i + 1]) return ys[i] + ((x - xs[i]) / (xs[i + 1] - xs[i])) * (ys[i + 1] - ys[i]);
    }
    return ys[ys.length - 1];
}
const pesoEsperado = (m: number) => interpolar(m, PUNTOS_EDAD, PUNTOS_PESO);
const tallaEsperada = (m: number) => interpolar(m, PUNTOS_EDAD, PUNTOS_TALLA);
const perimetroEsperado = (m: number) => interpolar(m, PUNTOS_EDAD, PUNTOS_PERIMETRO);

// ---------------------------------------------------------------------------
// Escenarios clínicos (texto de controles)
// ---------------------------------------------------------------------------
interface Escenario { motivo: string; anamnesis: string; exploracion: string; diagnostico: string; indicaciones: string }
const ESCENARIOS: Escenario[] = [
    { motivo: 'Control sano', anamnesis: 'Asiste a control de salud según calendario. Tutor refiere buen apetito, sueño adecuado y sin síntomas desde el último control.', exploracion: 'Activo, reactivo, en buen estado general. Sin signos de alarma. Piel y mucosas normocoloreadas.', diagnostico: 'Desarrollo acorde a la edad', indicaciones: 'Mantener alimentación acorde a la edad. Continuar esquema de vacunación. Próximo control según calendario.' },
    { motivo: 'Consulta por resfrío', anamnesis: 'Cuadro de 3 días con congestión nasal, tos leve y febrícula ocasional. Sin dificultad respiratoria ni rechazo alimentario.', exploracion: 'Rinorrea serosa. Auscultación pulmonar sin ruidos agregados.', diagnostico: 'Rinofaringitis aguda', indicaciones: 'Lavado nasal frecuente. Reconsultar si aparece fiebre alta persistente o dificultad respiratoria.' },
    { motivo: 'Control de peso y talla', anamnesis: 'Control antropométrico de rutina. Sin preocupaciones adicionales.', exploracion: 'Buenas condiciones generales. Medidas dentro de rango esperado.', diagnostico: 'Estado nutricional normal', indicaciones: 'Mantener hábitos alimenticios. Reforzar actividad física.' },
    { motivo: 'Seguimiento nutricional', anamnesis: 'En seguimiento por evaluación nutricional previa. Adherencia parcial a indicaciones dietéticas.', exploracion: 'Sin signos clínicos de compromiso nutricional agudo.', diagnostico: 'Requiere seguimiento nutricional', indicaciones: 'Derivar a nutricionista. Control de seguimiento en el plazo indicado.' },
    { motivo: 'Consulta por fiebre', anamnesis: 'Alza térmica de 24 horas cuantificada en domicilio, irritabilidad leve.', exploracion: 'Febril, reactivo. Orofaringe levemente eritematosa, sin foco evidente.', diagnostico: 'Síndrome febril sin foco aparente', indicaciones: 'Antipiréticos según indicación. Reconsultar si persiste más de 48 horas.' },
    { motivo: 'Control de vacunas', anamnesis: 'Asiste según calendario PNI. Sin reacciones adversas a dosis previas.', exploracion: 'Buen estado general, afebril, sin contraindicaciones.', diagnostico: 'Apto para inmunización según esquema PNI', indicaciones: 'Se administra dosis correspondiente. Observar sitio de punción 48 horas.' },
    { motivo: 'Evaluación de desarrollo psicomotor', anamnesis: 'Evaluación de hitos del desarrollo. Tutor no refiere preocupaciones.', exploracion: 'Cumple hitos esperados en las áreas evaluadas.', diagnostico: 'Desarrollo psicomotor acorde a la edad', indicaciones: 'Continuar estimulación en el hogar. Próxima evaluación según calendario.' },
    { motivo: 'Consulta salud mental', anamnesis: 'Tutor consulta por cambios conductuales en el último mes, en contexto escolar.', exploracion: 'Colaborador, sin signos de alarma en examen mental breve.', diagnostico: 'En observación, sin diagnóstico definido', indicaciones: 'Reforzar rutinas y contención familiar. Control para reevaluar.' },
    { motivo: 'Sobrepeso en seguimiento', anamnesis: 'Control por sobrepeso detectado previamente. Cambios parciales en hábitos.', exploracion: 'Evolución antropométrica en contexto de seguimiento.', diagnostico: 'Sobrepeso leve', indicaciones: 'Alimentación saludable y actividad física diaria. Control de seguimiento.' },
];
const ESCENARIO_ADOLESCENTE: Escenario = { motivo: 'Control adolescente', anamnesis: 'Control de salud adolescente. Refiere asistencia escolar regular y actividad física 2 veces por semana.', exploracion: 'Buen estado general. Desarrollo puberal acorde a la edad.', diagnostico: 'Adolescente sano', indicaciones: 'Reforzar hábitos saludables, uso de pantallas y horas de sueño.' };
const ESCENARIO_NANEAS: Escenario = { motivo: 'Control NANEAS', anamnesis: 'Control de seguimiento en programa NANEAS. Cuidador refiere asistencia a terapias y adherencia a indicaciones.', exploracion: 'Buen estado general. Se revisa evolución según diagnóstico de base.', diagnostico: 'Seguimiento NANEAS sin descompensación', indicaciones: 'Mantener terapias en curso. Coordinar con equipo de talleres NANEAS.' };

// ---------------------------------------------------------------------------
// Series de controles
// ---------------------------------------------------------------------------
type TipoForzado = 'ninguno' | 'ganancia' | 'perdida';
interface ControlGenerado { fecha: Date; edadMeses: number; peso: number; talla: number; esUltimo: boolean }

function generarSerieControles(nacimiento: Date, numControles: number, tipoForzado: TipoForzado): ControlGenerado[] {
    const factor = faker.number.float({ min: 0.88, max: 1.12, fractionDigits: 2 });
    const edadHoy = mesesCumplidos(nacimiento, HOY);
    // Lactantes se controlan más seguido que escolares/adolescentes.
    // Las alertas usan tramos cortos para que el cambio de peso sea claro.
    const intervaloMeses = tipoForzado !== 'ninguno' ? faker.number.int({ min: 2, max: 3 })
        : edadHoy < 24 ? faker.number.int({ min: 1, max: 3 })
        : edadHoy < 120 ? faker.number.int({ min: 3, max: 6 })
        : faker.number.int({ min: 6, max: 12 });

    // Último control real: entre hoy y 60 días atrás
    const ultimaFecha = hoyMasDias(-faker.number.int({ min: 0, max: 60 }));
    const controles: ControlGenerado[] = [];

    for (let k = numControles - 1; k >= 0; k--) {
        const fecha = restarMeses(ultimaFecha, k * intervaloMeses);
        if (fecha.getTime() < sumarDias(nacimiento, 7).getTime()) continue; // nada antes de nacer
        const edad = mesesCumplidos(nacimiento, fecha);

        let peso = pesoEsperado(edad) * factor + faker.number.float({ min: -0.2, max: 0.2, fractionDigits: 2 });
        let talla = tallaEsperada(edad) * Math.sqrt(factor) + faker.number.float({ min: -0.3, max: 0.3, fractionDigits: 2 });
        const previo = controles[controles.length - 1];
        if (previo) {
            talla = Math.max(talla, previo.talla);
            peso = Math.max(peso, previo.peso - 0.1);
        }
        controles.push({ fecha, edadMeses: edad, peso: +peso.toFixed(1), talla: +talla.toFixed(1), esUltimo: false });
    }
    if (controles.length) controles[controles.length - 1].esUltimo = true;

    // Fuerza el último tramo para que supere los umbrales de reportes.service.ts
    // (ganancia >= 3x lo esperado y mínimo 0.4 kg/mes; pérdida <= -0.3 kg/mes)
    if (tipoForzado !== 'ninguno' && controles.length >= 2) {
        const pen = controles[controles.length - 2];
        const ult = controles[controles.length - 1];
        const meses = Math.max((ult.fecha.getTime() - pen.fecha.getTime()) / (1000 * 60 * 60 * 24 * 30.44), 1);
        ult.peso = tipoForzado === 'ganancia'
            ? +(pen.peso + meses * faker.number.float({ min: 1.2, max: 1.6, fractionDigits: 2 })).toFixed(1)
            : +Math.max(pen.peso - meses * faker.number.float({ min: 0.6, max: 0.9, fractionDigits: 2 }), 3).toFixed(1);
    }
    return controles;
}

// Próximo control del control vigente: reparte la agenda en todas sus pestañas
function proximoControlDistribuido(): Date {
    const cat = faker.helpers.weightedArrayElement([
        { weight: 15, value: 'atrasado' }, { weight: 10, value: 'hoy' }, { weight: 20, value: 'semana' },
        { weight: 30, value: 'mes' }, { weight: 25, value: 'lejano' },
    ]);
    const off = cat === 'atrasado' ? -faker.number.int({ min: 1, max: 45 })
        : cat === 'hoy' ? 0
        : cat === 'semana' ? faker.number.int({ min: 1, max: 6 })
        : cat === 'mes' ? faker.number.int({ min: 7, max: 30 })
        : faker.number.int({ min: 31, max: 180 });
    return hoyMasDias(off);
}

// ---------------------------------------------------------------------------
// Datos del paciente
// ---------------------------------------------------------------------------
function generarDiagnosticos(edadMeses: number): string[] {
    const cantidad = faker.helpers.weightedArrayElement([{ weight: 60, value: 1 }, { weight: 30, value: 2 }, { weight: 10, value: 3 }]);
    const set = new Set<string>();
    while (set.size < cantidad) set.add(faker.helpers.weightedArrayElement(DIAGNOSTICOS));
    // Solo una variante de TEA por paciente
    const teas = [...set].filter(esTEA);
    teas.slice(1).forEach((d) => set.delete(d));
    // TDAH no se diagnostica antes de los 4 años
    if (edadMeses < 48 && set.has('TDAH')) {
        set.delete('TDAH');
        if (set.size === 0) set.add('Obs TEA');
    }
    return [...set];
}

function generarCredencial(esNaneas: boolean): { estado: EstadoCredencialDiscapacidad; detalle: string | null } {
    if (!esNaneas) return { estado: 'sin_dato', detalle: null };
    const estado = faker.helpers.weightedArrayElement<EstadoCredencialDiscapacidad>([
        { weight: 35, value: 'si' }, { weight: 25, value: 'no' }, { weight: 20, value: 'en_tramite' }, { weight: 20, value: 'sin_dato' },
    ]);
    const detalle = estado === 'si' ? faker.helpers.arrayElement(['Vigente, grado moderado', 'Vigente, grado severo', 'Vigente, grado leve', null])
        : estado === 'en_tramite' ? faker.helpers.arrayElement(['Inicia trámite en COMPIN', 'En proceso de evaluación', null])
        : null;
    return { estado, detalle };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function limpiar() {
    console.log('--reset: limpiando datos (la tabla Usuario NO se toca)...');
    await prisma.inscripcionTaller.deleteMany();
    await prisma.sesionTaller.deleteMany();
    await prisma.taller.deleteMany();
    await prisma.controlClinico.deleteMany();
    await prisma.paciente.deleteMany();
    await prisma.tutor.deleteMany();
    await prisma.profesional.deleteMany();
}

interface PacienteSeed { rut: string; edadAnios: number; naneas: boolean; tea: boolean; telefono: string; activo: boolean }

async function main() {
    const existentes = await prisma.paciente.count();
    if (existentes > 0 && !RESET) {
        console.error(`\nLa base ya tiene ${existentes} pacientes. No se hizo nada.`);
        console.error('Si de verdad quieres BORRARLOS y regenerar datos de prueba, corre:');
        console.error('  npx prisma db seed -- --reset\n');
        process.exit(1);
    }
    if (RESET) await limpiar();

    // --- Profesionales -----------------------------------------------------
    await prisma.profesional.upsert({
        where: { rut: PROFESIONAL_PRINCIPAL.rut },
        update: {},
        create: { ...PROFESIONAL_PRINCIPAL, activo: true },
    });
    const profesionales = [PROFESIONAL_PRINCIPAL];
    for (const estamento of ESTAMENTOS_EXTRA) {
        const p = { rut: generarRUT(anioNacimientoAdulto()), nombre: faker.person.firstName(), apellido: faker.person.lastName(), estamento };
        await prisma.profesional.create({ data: { ...p, activo: true } });
        profesionales.push(p);
    }
    await prisma.profesional.create({ // uno inactivo, para probar filtros
        data: { rut: generarRUT(anioNacimientoAdulto()), nombre: faker.person.firstName(), apellido: faker.person.lastName(), estamento: 'Enfermera/o', activo: false },
    });
    const profesionalesControl = profesionales.filter((p) => ESTAMENTOS_CONTROL.has(p.estamento));
    console.log(`${profesionales.length + 1} profesionales creados.`);

    // --- Usuario de login (opcional) ---------------------------------------
    const SEED_PASSWORD = process.env.SEED_PASSWORD;
    if (SEED_PASSWORD) {
        const hash = await bcrypt.hash(SEED_PASSWORD, 10);
        await prisma.usuario.upsert({
            where: { rut: PROFESIONAL_PRINCIPAL.rut },
            update: { password: hash },
            create: {
                rut: PROFESIONAL_PRINCIPAL.rut,
                password: hash,
                nombre: `${PROFESIONAL_PRINCIPAL.nombre} ${PROFESIONAL_PRINCIPAL.apellido}`,
                rol: PROFESIONAL_PRINCIPAL.estamento,
            },
        });
        console.log(`Usuario de login listo -> RUT ${PROFESIONAL_PRINCIPAL.rut} (clave: la de SEED_PASSWORD)`);
    } else {
        console.log('SEED_PASSWORD no definido: no se creó ni modificó ningún usuario de login.');
    }

    // --- Tutores verificados (algunos con varios hijos) ----------------------
    const tutores = [];
    for (let i = 0; i < TOTAL_TUTORES; i++) {
        tutores.push(await prisma.tutor.create({
            data: {
                rut: generarRUT(anioNacimientoAdulto()),
                nombre: faker.person.firstName(),
                apellido: faker.person.lastName(),
                telefono: telefonoMovil(),
                telefono_secundario: faker.datatype.boolean({ probability: 0.3 }) ? telefonoMovil() : null,
                parentesco: faker.helpers.weightedArrayElement([
                    { weight: 60, value: 'Madre' }, { weight: 20, value: 'Padre' }, { weight: 12, value: 'Abuela' }, { weight: 8, value: 'Tío/a' },
                ]),
                correo: faker.datatype.boolean({ probability: 0.65 }) ? faker.internet.email().toLowerCase() : null,
                direccion: faker.location.streetAddress(),
                sector: faker.helpers.weightedArrayElement(SECTORES),
                comuna: COMUNA_UNICA,
                verificado: true,
            },
        }));
    }
    console.log(`${tutores.length} tutores verificados creados.`);

    // --- Edades y grupos -----------------------------------------------------
    // Programa Infantil: 0-9 años. NANEAS: desde 1.5 hasta 17 años.
    const edadesInfantil = Array.from({ length: TOTAL_PACIENTES_INFANTIL }, () =>
        faker.helpers.weightedArrayElement([
            { weight: 30, value: () => faker.number.int({ min: 0, max: 23 }) },
            { weight: 70, value: () => faker.number.int({ min: 24, max: 119 }) },
        ])());
    const edadesNaneas = Array.from({ length: TOTAL_PACIENTES_NANEAS }, () =>
        faker.helpers.weightedArrayElement([
            { weight: 50, value: () => faker.number.int({ min: 18, max: 119 }) },
            { weight: 50, value: () => faker.number.int({ min: 120, max: 215 }) },
        ])());
    const edades = [...edadesInfantil, ...edadesNaneas];
    const total = edades.length;
    const indices = edades.map((_, i) => i);
    const esIndiceNaneas = (i: number) => i >= TOTAL_PACIENTES_INFANTIL;

    // Recién inscritos sin controles (no participan de alertas)
    const idxSinControl = new Set(faker.helpers.arrayElements(indices, PACIENTES_SIN_CONTROL));
    // Alertas: niños de 2 a 8 años, activos y con controles
    const candidatosAlerta = indices.filter((i) => edades[i] >= 24 && edades[i] <= 96 && !idxSinControl.has(i));
    const idxGanancia = new Set(faker.helpers.arrayElements(candidatosAlerta, CANTIDAD_ALERTA_GANANCIA));
    const idxPerdida = new Set(faker.helpers.arrayElements(candidatosAlerta.filter((i) => !idxGanancia.has(i)), CANTIDAD_ALERTA_PERDIDA));
    const idxSename = new Set(faker.helpers.arrayElements(indices, CANTIDAD_SENAME));
    const idxTrans = new Set(faker.helpers.arrayElements(indices.filter((i) => edades[i] >= EDAD_MINIMA_MESES_TRANS), CANTIDAD_TRANS));
    // 5 NANEAS "importados" con tutor por confirmar
    const idxTutorPorConfirmar = new Set(faker.helpers.arrayElements(indices.filter(esIndiceNaneas), 5));

    const pacientesCreados: PacienteSeed[] = [];
    let totalControles = 0;
    let tutoresPorConfirmar = 0;

    for (const i of faker.helpers.shuffle(indices)) {
        const edadMeses = edades[i];
        const esNaneas = esIndiceNaneas(i);
        const fechaNacimiento = fechaSoloDia(HOY_ANIO, HOY_MES - edadMeses, faker.number.int({ min: 1, max: 28 }));
        const sexo = faker.helpers.arrayElement(['Masculino', 'Femenino']);
        const generoLegal: 'male' | 'female' = sexo === 'Masculino' ? 'male' : 'female';

        let tutor = faker.helpers.arrayElement(tutores);
        if (idxTutorPorConfirmar.has(i)) {
            // Igual que importacion.service.ts cuando el Excel no trae apoderado
            tutor = await prisma.tutor.create({
                data: {
                    nombre: 'Apoderado',
                    apellido: 'Por confirmar',
                    parentesco: 'Por confirmar',
                    telefono: telefonoMovil(),
                    direccion: faker.helpers.arrayElement([faker.location.streetAddress(), 'Sin dato']),
                    sector: faker.helpers.weightedArrayElement(SECTORES),
                    comuna: COMUNA_UNICA,
                    verificado: false,
                },
            });
            tutoresPorConfirmar++;
        }

        const diagnosticos = esNaneas ? generarDiagnosticos(edadMeses) : [];
        const esSaludMental = diagnosticos.some((d) => DIAGNOSTICOS_SALUD_MENTAL.has(d))
            ? faker.datatype.boolean({ probability: 0.7 })
            : faker.datatype.boolean({ probability: edadMeses >= 72 ? 0.08 : 0.02 });
        // Como en la importación: todo NANEAS queda con el flag, más algunos prematuros pequeños
        const esNaneasPrematuro = esNaneas || (edadMeses <= EDAD_MAXIMA_MESES_PREMATURO && faker.datatype.boolean({ probability: 0.08 }));
        const credencial = generarCredencial(esNaneas);
        const tieneCuidador = esNaneas ? faker.datatype.boolean({ probability: 0.45 }) : faker.datatype.boolean({ probability: 0.05 });
        const esTrans = idxTrans.has(i);
        const esMigrante = faker.datatype.boolean({ probability: 0.12 });
        const sinControl = idxSinControl.has(i);
        const conAlerta = idxGanancia.has(i) || idxPerdida.has(i);
        const activo = conAlerta || sinControl ? true : faker.datatype.boolean({ probability: 0.93 });
        const fechaInscripcion = sinControl
            ? hoyMasDias(-faker.number.int({ min: 0, max: 20 }))
            : sumarDias(fechaNacimiento, faker.number.int({ min: 3, max: Math.min(60, Math.max(4, edadMeses * 30 - 70)) }));

        const paciente = await prisma.paciente.create({
            data: {
                rut: generarRUT(fechaNacimiento.getUTCFullYear()),
                nombre: faker.person.firstName(generoLegal),
                apellido: `${faker.person.lastName()} ${faker.person.lastName()}`,
                nombre_social: esTrans ? faker.person.firstName(generoLegal === 'male' ? 'female' : 'male') : null,
                identidad_genero: esTrans ? (sexo === 'Masculino' ? 'Femenino' : 'Masculino') : null,
                fecha_nacimiento: fechaNacimiento,
                sexo_biologico: sexo,
                nacionalidad: esMigrante ? faker.helpers.arrayElement(['Venezolana', 'Haitiana', 'Colombiana', 'Peruana']) : 'Chilena',
                direccion: tutor.direccion === 'Sin dato' ? faker.location.streetAddress() : tutor.direccion,
                sector: tutor.sector,
                comuna: COMUNA_UNICA,
                nhc: `${faker.number.int({ min: 10000, max: 99999 })}`,
                prevision: faker.helpers.weightedArrayElement([
                    { weight: 25, value: 'FONASA A' }, { weight: 30, value: 'FONASA B' }, { weight: 20, value: 'FONASA C' },
                    { weight: 15, value: 'FONASA D' }, { weight: 10, value: 'ISAPRE' },
                ]),
                fecha_inscripcion: fechaInscripcion,
                creado_en: fechaInscripcion,
                activo,
                es_sename: idxSename.has(i),
                es_naneas_prematuro: esNaneasPrematuro,
                es_poblacion_trans: esTrans,
                es_migrante: esMigrante,
                es_salud_mental: esSaludMental,
                diagnosticos,
                credencial_discapacidad: credencial.estado,
                credencial_discapacidad_detalle: credencial.detalle,
                cuidador_nombre: tieneCuidador ? `${faker.person.firstName()} ${faker.person.lastName()}` : null,
                cuidador_telefono: tieneCuidador ? telefonoMovil() : null,
                cuidador_parentesco: tieneCuidador ? faker.helpers.arrayElement(['Abuela', 'Abuelo', 'Tía', 'Hermana mayor', 'Vecina']) : null,
                id_tutor_principal: tutor.id_tutor,
            },
        });
        pacientesCreados.push({
            rut: paciente.rut,
            edadAnios: Math.floor(mesesCumplidos(fechaNacimiento, HOY) / 12),
            naneas: esNaneas,
            tea: diagnosticos.some(esTEA),
            telefono: tutor.telefono,
            activo,
        });
        if (pacientesCreados.length % 25 === 0) console.log(`${pacientesCreados.length}/${total} pacientes creados...`);

        if (sinControl) continue;

        // Controles (creado_en = fecha del control, para que la agenda tome
        // como "vigente" el último control real de cada paciente)
        const numControles = conAlerta
            ? faker.number.int({ min: 3, max: 5 })
            : faker.helpers.weightedArrayElement([
                { weight: 15, value: 1 }, { weight: 30, value: 2 }, { weight: 30, value: 3 }, { weight: 15, value: 4 }, { weight: 10, value: 5 },
            ]);
        const tipoForzado: TipoForzado = idxGanancia.has(i) ? 'ganancia' : idxPerdida.has(i) ? 'perdida' : 'ninguno';
        const serie = generarSerieControles(fechaNacimiento, numControles, tipoForzado);

        for (const c of serie) {
            const esc = c.edadMeses >= 120 && faker.datatype.boolean({ probability: 0.4 }) ? ESCENARIO_ADOLESCENTE
                : esNaneas && faker.datatype.boolean({ probability: 0.4 }) ? ESCENARIO_NANEAS
                : faker.helpers.arrayElement(ESCENARIOS);
            await prisma.controlClinico.create({
                data: {
                    fecha_control: c.fecha,
                    creado_en: c.fecha,
                    motivo_consulta: esc.motivo,
                    anamnesis: esc.anamnesis,
                    exploracion_fisica: esc.exploracion,
                    edad_meses: c.edadMeses,
                    peso_kg: c.peso,
                    talla_cm: c.talla,
                    perimetro_cefalico: c.edadMeses <= 36 ? +perimetroEsperado(c.edadMeses).toFixed(1) : null,
                    imc: c.edadMeses >= EDAD_MESES_IMC ? +(c.peso / Math.pow(c.talla / 100, 2)).toFixed(2) : null,
                    problemas_diagnosticados: esc.diagnostico,
                    indicaciones_acuerdos: esc.indicaciones,
                    fecha_proximoControl: c.esUltimo ? proximoControlDistribuido() : sumarDias(c.fecha, faker.number.int({ min: 45, max: 150 })),
                    rut_paciente: paciente.rut,
                    rut_profesional: faker.helpers.arrayElement(profesionalesControl).rut,
                },
            });
            totalControles++;
        }
    }
    console.log(`${tutoresPorConfirmar} tutores "Por confirmar" creados (como en la importación Excel).`);

    // --- Talleres, sesiones e inscripciones ---------------------------------
    let totalSesiones = 0;
    let totalInscripciones = 0;
    for (const t of TALLERES) {
        const taller = await prisma.taller.create({
            data: { nombre: t.nombre, descripcion: t.descripcion, edad_min: t.edad_min, edad_max: t.edad_max, activo: t.activo },
        });
        const elegibles = pacientesCreados.filter((p) =>
            p.activo && p.edadAnios >= t.edad_min && p.edadAnios <= t.edad_max &&
            (t.filtro === 'todos' || (t.filtro === 'naneas' && p.naneas) || (t.filtro === 'tea' && p.tea)));
        const responsables = profesionales.filter((p) => p.estamento === t.estamento);
        // Grupo base: los mismos niños suelen repetir sesión
        const grupo = faker.helpers.arrayElements(elegibles, Math.min(elegibles.length, faker.number.int({ min: 6, max: 12 })));

        // Taller inactivo: solo sesiones antiguas. Activos: 4 pasadas (cada 2
        // semanas), opcionalmente una HOY, y 2 futuras.
        const offsets = !t.activo
            ? [-120, -106, -92]
            : [-56, -42, -28, -14, ...(t.sesionHoy ? [0] : []), 7, 21].map((d) => (d === 0 ? 0 : d + faker.number.int({ min: -2, max: 2 })));

        for (const off of offsets) {
            const esPasada = off < 0;
            const esHoy = off === 0;
            const externo = responsables.length === 0 || faker.datatype.boolean({ probability: 0.15 });
            const sesion = await prisma.sesionTaller.create({
                data: {
                    id_taller: taller.id_taller,
                    fecha: hoyMasDias(off),
                    rut_profesional: externo ? null : faker.helpers.arrayElement(responsables).rut,
                    profesional_externo: externo ? faker.helpers.arrayElement(PROFESIONALES_EXTERNOS) : null,
                    observaciones: esPasada && faker.datatype.boolean({ probability: 0.4 })
                        ? faker.helpers.arrayElement(['Buena participación del grupo.', 'Se trabajó con apoyo de cuidadores.', 'Sesión acortada por actividad del CESFAM.'])
                        : null,
                },
            });
            totalSesiones++;

            const inscritos = grupo.filter(() => faker.datatype.boolean({ probability: 0.85 }));
            for (const p of inscritos) {
                const convocatoria: EstadoConvocatoria = esPasada || esHoy
                    ? faker.helpers.weightedArrayElement<EstadoConvocatoria>([
                        { weight: 70, value: 'confirma' }, { weight: 10, value: 'no_confirma' }, { weight: 10, value: 'no_contesta' }, { weight: 10, value: 'no_puede' },
                    ])
                    : faker.helpers.weightedArrayElement<EstadoConvocatoria>([
                        { weight: 30, value: 'no_contactado' }, { weight: 15, value: 'contactado' }, { weight: 30, value: 'confirma' },
                        { weight: 10, value: 'no_contesta' }, { weight: 10, value: 'reconfirmar' }, { weight: 5, value: 'no_puede' },
                    ]);
                // Asistencia solo en sesiones pasadas (regla de inscripcionTaller.controller.ts).
                // La sesión de HOY queda pendiente para probar marcarla en vivo.
                const asistencia: EstadoAsistencia = !esPasada ? 'pendiente'
                    : convocatoria === 'confirma' ? (faker.datatype.boolean({ probability: 0.85 }) ? 'asiste' : 'no_asiste')
                    : faker.datatype.boolean({ probability: 0.15 }) ? 'asiste' : 'no_asiste';
                const diasAntesContacto = faker.number.int({ min: 1, max: 5 });
                await prisma.inscripcionTaller.create({
                    data: {
                        rut_paciente: p.rut,
                        id_sesion: sesion.id_sesion,
                        estado_convocatoria: convocatoria,
                        estado_asistencia: asistencia,
                        telefono_contacto: p.telefono,
                        // El contacto nunca queda en el futuro
                        fecha_contacto: convocatoria === 'no_contactado' ? null : hoyMasDias(Math.min(off, 0) - diasAntesContacto),
                        observaciones: convocatoria === 'no_puede' ? 'Tutor informa que no puede asistir por horario laboral.' : null,
                    },
                });
                totalInscripciones++;
            }
        }
    }

    // --- Resumen -------------------------------------------------------------
    console.log('\n=== Seed completado ===');
    console.log(`  Pacientes: ${total} (${TOTAL_PACIENTES_INFANTIL} Programa Infantil 0-9 años, ${TOTAL_PACIENTES_NANEAS} NANEAS hasta 17 años)`);
    console.log(`  Recién inscritos sin control: ${PACIENTES_SIN_CONTROL}`);
    console.log(`  Controles clínicos: ${totalControles}`);
    console.log(`  Alertas de peso: ${CANTIDAD_ALERTA_GANANCIA} ganancia / ${CANTIDAD_ALERTA_PERDIDA} pérdida`);
    console.log(`  Talleres: ${TALLERES.length} (1 inactivo) | Sesiones: ${totalSesiones} | Inscripciones: ${totalInscripciones}`);
}

main()
    .catch((e) => {
        console.error('Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
