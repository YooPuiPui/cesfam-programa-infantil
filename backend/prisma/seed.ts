// =============================================================================
// SEED DE DATOS DE PRUEBA — SGPI (CESFAM Programa Infantil)
// =============================================================================
// Genera una población FICTICIA de 320 niños, niñas y adolescentes para probar
// todos los módulos del sistema. Ningún nombre, RUT, dirección ni teléfono es
// real: se generan con faker.
//
// Lo único tomado del CATASTRO NANEAS (hojas NANEAS y TEA) son los VALORES de
// diagnóstico y su frecuencia relativa, ya normalizados igual que lo hace la
// importación Excel (importacion.service.ts), además de la distribución por
// edad y sexo de esa población. Los controles clínicos son inventados.
//
// Población:
//   - 200 Programa Infantil, 0 a 9 años, sin diagnóstico NANEAS
//   - 120 NANEAS (TEA y otros diagnósticos), 6 meses a 17 años
//   Todos los pacientes tienen al menos un control clínico.
//
// Qué muestra cada módulo:
//   Dashboard ....... flags de riesgo y caracterización (edad, activos,
//                     diagnósticos, credencial de discapacidad, cuidador)
//   Pacientes ....... activos/inactivos, hermanos con el mismo tutor, tutores
//                     "Por confirmar" (como los que deja la importación Excel)
//   Agenda .......... próximos controles atrasados / hoy / esta semana / mes
//   Controles ....... historial por paciente; IMC solo desde los 2 años y
//                     perímetro cefálico hasta los 3
//   Reportes ........ 6 alertas de aumento y 6 de pérdida de peso
//   Talleres ........ los 4 talleres del CESFAM con sesiones pasadas
//                     (asistencia marcada), una sesión HOY y sesiones futuras
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

import { PrismaClient, EstadoAsistencia, EstadoConvocatoria, EstadoCredencialDiscapacidad, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';
import bcrypt from 'bcrypt';
import { obtenerHoyChile } from '../src/utils/fechaChile';

const prisma = new PrismaClient();
const RESET = process.argv.includes('--reset');

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
const TOTAL_PACIENTES_INFANTIL = 200; // 0-9 años sin diagnóstico NANEAS
const TOTAL_PACIENTES_NANEAS = 120; // con diagnóstico, hasta 17 años
const TOTAL_TUTORES = 210; // menos tutores que pacientes -> hermanos
const TUTORES_POR_CONFIRMAR = 8; // pacientes NANEAS "importados" sin apoderado
const CANTIDAD_ALERTA_GANANCIA = 6;
const CANTIDAD_ALERTA_PERDIDA = 6;
const CANTIDAD_SENAME = 15;
const CANTIDAD_TRANS = 10;
const EDAD_MINIMA_MESES_TRANS = 48;
const EDAD_MESES_IMC = 24; // IMC solo desde los 2 años (validación clínica)

// Profesional principal (login). Mismo RUT que los seeds anteriores.
const PROFESIONAL_PRINCIPAL = { rut: '21118397-7', nombre: 'Francisca', apellido: 'Huaique', estamento: 'Médico' };

// Distribución de sectores del catastro (normalizados como en la importación)
const SECTORES = [
    { value: 'Sector 2 - Rojo', weight: 55 },
    { value: 'Sector 1 - Azul', weight: 37 },
    { value: 'Fuera de Sector', weight: 3 },
    { value: null, weight: 5 },
];
const COMUNA_UNICA = 'Concepción';

// ---------------------------------------------------------------------------
// Diagnósticos del CATASTRO NANEAS (hojas NANEAS + TEA)
// ---------------------------------------------------------------------------
// value  = texto tal como queda después de la normalización de la importación
// weight = cantidad de pacientes con ese diagnóstico en el catastro
// min/max = rango de edad en meses en que tiene sentido asignarlo
// sexo   = solo para los registros de prematurez, que vienen con género
// tea    = cuenta como diagnóstico del espectro autista (uno por paciente)
// Se omitieron solo las variantes con errores de tipeo del Excel (ej. "TDHA",
// "g2", "Deaprendizaje") para que los datos de prueba se vean limpios.
interface Diagnostico { value: string; weight: number; min?: number; max?: number; sexo?: 'Masculino' | 'Femenino'; tea?: boolean }
const DIAGNOSTICOS: Diagnostico[] = [
    { value: 'TEA', weight: 116, min: 18, tea: true },
    { value: 'TDAH', weight: 27, min: 48 },
    { value: 'TEA Grado 1', weight: 19, min: 18, tea: true },
    { value: 'Epilepsia', weight: 16 },
    { value: 'ASMA', weight: 9, min: 12 },
    { value: 'Obs TEA', weight: 7, min: 18, max: 84, tea: true },
    { value: 'Síndrome de Down', weight: 6 },
    { value: 'En Estudio de Genética', weight: 5 },
    { value: 'TIS', weight: 5, min: 24 },
    { value: 'Trastorno Ansioso', weight: 5, min: 60 },
    { value: 'TEA Grado 2', weight: 4, min: 18, tea: true },
    { value: 'TRASTORNOS GENERALIZADOS DEL DESARROLLO', weight: 4, min: 18, tea: true },
    { value: 'TEA (SD DE ASPERGER)', weight: 4, min: 48, tea: true },
    { value: 'TEL Expresivo', weight: 4, min: 36, max: 144 },
    { value: 'Hipotiroidismo', weight: 3 },
    { value: 'TOD', weight: 3, min: 48 },
    { value: 'PARALISIS CEREBRAL', weight: 3 },
    { value: 'Trastorno Conductual', weight: 2, min: 48 },
    { value: 'TEL', weight: 2, min: 36, max: 144 },
    { value: 'TEA GRADO 3', weight: 2, min: 18, tea: true },
    { value: 'DEPENDIENTE SEVERO', weight: 2 },
    { value: 'FIL', weight: 2, min: 60 },
    { value: 'PREMATURO 30 SEMANAS', weight: 2, max: 60, sexo: 'Masculino' },
    { value: 'PREMATURA', weight: 2, max: 60, sexo: 'Femenino' },
    { value: 'PREMATURO 31 SEMANAS', weight: 1, max: 60, sexo: 'Masculino' },
    { value: 'PREMATURA 34 SEMANAS', weight: 1, max: 60, sexo: 'Femenino' },
    { value: 'DIABETES MELLITUS', weight: 1, min: 24 },
    { value: 'SIFILIS CONGENITA', weight: 1 },
    { value: 'MALFORMACIÓN ANORRECTAL', weight: 1 },
    { value: 'HIDROCEFALIA', weight: 1 },
    { value: 'RINITIS', weight: 1, min: 24 },
    { value: 'HIPOTONIA CONGENITA', weight: 1 },
    { value: 'RETRASO DSM', weight: 1, max: 72 },
    { value: 'HIPERTENSION ARTERIAL', weight: 1, min: 72 },
    { value: 'TEA NO VERBAL', weight: 1, min: 24, tea: true },
    { value: 'SINDROME DE ASPERGER', weight: 1, min: 48, tea: true },
    { value: 'Apraxia del Habla', weight: 1, min: 36 },
    { value: 'MICROCEFALIA', weight: 1 },
    { value: 'Dispraxia', weight: 1, min: 48 },
    { value: 'DI leve', weight: 1, min: 60 },
    { value: 'DI', weight: 1, min: 60 },
    { value: 'CHIARI G1', weight: 1 },
    { value: 'OBS NEUROFIBROMATOSIS', weight: 1 },
    { value: 'MUTISMO', weight: 1, min: 48 },
];
const VALORES_TEA = new Set(DIAGNOSTICOS.filter((d) => d.tea).map((d) => d.value));
const DIAGNOSTICOS_SALUD_MENTAL = new Set(['TDAH', 'Trastorno Ansioso', 'Trastorno Conductual', 'TOD', 'MUTISMO']);
const DIAGNOSTICOS_DEPENDENCIA = new Set(['Síndrome de Down', 'PARALISIS CEREBRAL', 'DEPENDIENTE SEVERO', 'TEA GRADO 3', 'TEA Grado 2', 'HIDROCEFALIA']);

// Edad de la población NANEAS según el catastro (meses)
const RANGOS_EDAD_NANEAS = [
    { weight: 2, value: [6, 23] },
    { weight: 24, value: [24, 59] },
    { weight: 66, value: [60, 119] },
    { weight: 49, value: [120, 167] },
    { weight: 39, value: [168, 215] },
];
const RANGOS_EDAD_INFANTIL = [
    { weight: 30, value: [0, 23] },
    { weight: 30, value: [24, 59] },
    { weight: 40, value: [60, 119] },
];

// ---------------------------------------------------------------------------
// Profesionales y talleres
// ---------------------------------------------------------------------------
const ESTAMENTOS_EXTRA = [
    'Enfermera/o', 'Enfermera/o', 'Nutricionista', 'Psicóloga/o', 'Psicóloga/o', 'Fonoaudióloga/o',
    'Terapeuta Ocupacional', 'Kinesióloga/o', 'Matrona', 'Trabajador/a Social', 'Educadora de Párvulos', 'Médico',
];
const ESTAMENTOS_CONTROL = new Set(['Médico', 'Enfermera/o', 'Nutricionista']);

// Los 4 talleres que se trabajan en el CESFAM. Cualquier paciente puede
// asistir, pero el rango de edad y la afinidad se ajustan a cada uno:
//   - Manejo de Desregulaciones: apunta a la familia; desde los 2 años, edad
//     en que aparecen las crisis de desregulación.
//   - Trabajando Mis Habilidades Sociales: requiere algo de lenguaje e
//     interacción con pares; de preescolar (4) a adolescencia temprana (14).
//   - Sexualidad en TEA: desde la prepubertad (9) hasta los 18; nunca un
//     lactante o preescolar.
//   - Diagnóstico Participativo TEA: instancia donde las familias levantan
//     necesidades del programa; participa la familia, por eso no hay edad
//     mínima del niño. Es esporádico: solo 2 sesiones.
// "afinidad" es el peso relativo para ser inscrito: TEA > otro NANEAS > resto.
interface TallerSeed {
    nombre: string; descripcion: string; edad_min: number; edad_max: number; estamento: string;
    afinidad: { tea: number; naneas: number; otro: number };
    grupo: [number, number]; sesiones: number[];
}
const quincenal = (conHoy: boolean) => [-56, -42, -28, -14, ...(conHoy ? [0] : []), 14, 28];
const TALLERES: TallerSeed[] = [
    {
        nombre: 'Manejo de Desregulaciones',
        descripcion: 'Estrategias para prevenir y acompañar episodios de desregulación emocional y conductual, con participación de madres, padres y cuidadores.',
        edad_min: 2, edad_max: 18, estamento: 'Terapeuta Ocupacional',
        afinidad: { tea: 6, naneas: 3, otro: 1 }, grupo: [12, 16], sesiones: quincenal(true),
    },
    {
        nombre: 'Trabajando Mis Habilidades Sociales',
        descripcion: 'Espacio grupal para trabajar interacción con pares, turnos, juego compartido y resolución de conflictos.',
        edad_min: 4, edad_max: 14, estamento: 'Psicóloga/o',
        afinidad: { tea: 6, naneas: 3, otro: 1 }, grupo: [10, 14], sesiones: quincenal(false),
    },
    {
        nombre: 'Sexualidad en TEA',
        descripcion: 'Educación en sexualidad, cambios corporales, autocuidado y límites, adaptada a niños, niñas y adolescentes con TEA.',
        edad_min: 9, edad_max: 18, estamento: 'Matrona',
        afinidad: { tea: 10, naneas: 2, otro: 0.3 }, grupo: [8, 12], sesiones: quincenal(false),
    },
    {
        nombre: 'Diagnóstico Participativo TEA',
        descripcion: 'Encuentro con familias para identificar necesidades, barreras y propuestas para el programa de atención de niños, niñas y adolescentes con TEA.',
        edad_min: 0, edad_max: 18, estamento: 'Trabajador/a Social',
        afinidad: { tea: 10, naneas: 3, otro: 0.3 }, grupo: [14, 20], sesiones: [-35, 21],
    },
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
// Escenarios clínicos (texto de controles, inventados)
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
    { motivo: 'Sobrepeso en seguimiento', anamnesis: 'Control por sobrepeso detectado previamente. Cambios parciales en hábitos.', exploracion: 'Evolución antropométrica en contexto de seguimiento.', diagnostico: 'Sobrepeso leve', indicaciones: 'Alimentación saludable y actividad física diaria. Control de seguimiento.' },
];
const ESCENARIOS_NANEAS: Escenario[] = [
    { motivo: 'Control NANEAS', anamnesis: 'Control de seguimiento en programa NANEAS. Cuidador refiere asistencia a terapias y adherencia a indicaciones.', exploracion: 'Buen estado general. Se revisa evolución según diagnóstico de base.', diagnostico: 'Seguimiento NANEAS sin descompensación', indicaciones: 'Mantener terapias en curso. Coordinar con equipo de talleres NANEAS.' },
    { motivo: 'Seguimiento TEA', anamnesis: 'Familia refiere episodios de desregulación en contexto escolar y dificultades con cambios de rutina.', exploracion: 'Paciente tranquilo durante la atención con apoyo de cuidador. Sin hallazgos agudos.', diagnostico: 'TEA en seguimiento, episodios de desregulación', indicaciones: 'Se sugiere taller Manejo de Desregulaciones. Mantener anticipación de rutinas.' },
    { motivo: 'Consulta salud mental', anamnesis: 'Tutor consulta por cambios conductuales en el último mes, en contexto escolar.', exploracion: 'Colaborador, sin signos de alarma en examen mental breve.', diagnostico: 'En observación, sin diagnóstico definido', indicaciones: 'Reforzar rutinas y contención familiar. Control para reevaluar.' },
    { motivo: 'Revisión de terapias', anamnesis: 'Se revisa continuidad de fonoaudiología y terapia ocupacional. Cuidador refiere avances en comunicación.', exploracion: 'Buen estado general. Interacción acorde a su condición de base.', diagnostico: 'Evolución favorable en terapias', indicaciones: 'Mantener plan terapéutico. Actualizar credencial de discapacidad si corresponde.' },
];
const ESCENARIO_ADOLESCENTE: Escenario = { motivo: 'Control adolescente', anamnesis: 'Control de salud adolescente. Refiere asistencia escolar regular y actividad física 2 veces por semana.', exploracion: 'Buen estado general. Desarrollo puberal acorde a la edad.', diagnostico: 'Adolescente sano', indicaciones: 'Reforzar hábitos saludables, uso de pantallas y horas de sueño.' };

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

    // Último control real: entre hoy y 60 días atrás (nunca antes de los 7 días de vida)
    let ultimaFecha = hoyMasDias(-faker.number.int({ min: 0, max: 60 }));
    if (ultimaFecha.getTime() < sumarDias(nacimiento, 7).getTime()) ultimaFecha = HOY;
    const controles: ControlGenerado[] = [];

    for (let k = numControles - 1; k >= 0; k--) {
        const fecha = restarMeses(ultimaFecha, k * intervaloMeses);
        if (k > 0 && fecha.getTime() < sumarDias(nacimiento, 7).getTime()) continue; // nada antes de nacer
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
    controles[controles.length - 1].esUltimo = true;

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
        { weight: 15, value: 'atrasado' }, { weight: 8, value: 'hoy' }, { weight: 20, value: 'semana' },
        { weight: 30, value: 'mes' }, { weight: 27, value: 'lejano' },
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
function edadDesdeRangos(rangos: { weight: number; value: number[] }[]): number {
    const [min, max] = faker.helpers.weightedArrayElement(rangos);
    return faker.number.int({ min, max });
}

function generarDiagnosticos(edadMeses: number, sexo: string): string[] {
    // Igual que en el catastro: ~8% de NANEAS sin diagnóstico registrado
    if (faker.datatype.boolean({ probability: 0.08 })) return [];
    const cantidad = faker.helpers.weightedArrayElement([
        { weight: 65, value: 1 }, { weight: 23, value: 2 }, { weight: 8, value: 3 }, { weight: 4, value: 4 },
    ]);
    const posibles = DIAGNOSTICOS.filter((d) =>
        edadMeses >= (d.min ?? 0) && edadMeses <= (d.max ?? 999) && (!d.sexo || d.sexo === sexo));
    const elegidos: Diagnostico[] = [];
    let intentos = 0;
    while (elegidos.length < cantidad && intentos++ < 50) {
        const d = faker.helpers.weightedArrayElement(posibles.map((p) => ({ weight: p.weight, value: p })));
        if (elegidos.includes(d)) continue;
        if (d.tea && elegidos.some((e) => e.tea)) continue; // un solo diagnóstico del espectro
        elegidos.push(d);
    }
    return elegidos.map((d) => d.value);
}

function generarCredencial(esNaneas: boolean, diagnosticos: string[]): { estado: EstadoCredencialDiscapacidad; detalle: string | null } {
    if (!esNaneas) return { estado: 'sin_dato', detalle: null };
    const dependiente = diagnosticos.some((d) => DIAGNOSTICOS_DEPENDENCIA.has(d));
    const estado = faker.helpers.weightedArrayElement<EstadoCredencialDiscapacidad>(dependiente
        ? [{ weight: 70, value: 'si' }, { weight: 15, value: 'en_tramite' }, { weight: 15, value: 'sin_dato' }]
        : [{ weight: 22, value: 'si' }, { weight: 15, value: 'no' }, { weight: 10, value: 'en_tramite' }, { weight: 53, value: 'sin_dato' }]);
    const detalle = estado === 'si' ? faker.helpers.arrayElement(['Vigente, grado moderado', 'Vigente, grado severo', 'Vigente, grado leve', 'Vigente, 35%', null])
        : estado === 'en_tramite' ? faker.helpers.arrayElement(['Inicia trámite en COMPIN', 'En proceso de evaluación', 'Espera nueva credencial', null])
        : null;
    return { estado, detalle };
}

// Elige `cantidad` elementos sin repetir, con probabilidad proporcional al peso
function elegirPonderado<T>(items: { item: T; peso: number }[], cantidad: number): T[] {
    const restantes = items.filter((x) => x.peso > 0);
    const elegidos: T[] = [];
    while (elegidos.length < cantidad && restantes.length > 0) {
        const total = restantes.reduce((s, x) => s + x.peso, 0);
        let r = Math.random() * total;
        const idx = restantes.findIndex((x) => (r -= x.peso) <= 0);
        elegidos.push(restantes.splice(idx === -1 ? restantes.length - 1 : idx, 1)[0].item);
    }
    return elegidos;
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

    // --- Tutores verificados (varios tienen más de un hijo) ------------------
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

    // --- Población -----------------------------------------------------------
    const grupos = [
        ...Array.from({ length: TOTAL_PACIENTES_INFANTIL }, () => ({ naneas: false, edad: edadDesdeRangos(RANGOS_EDAD_INFANTIL) })),
        ...Array.from({ length: TOTAL_PACIENTES_NANEAS }, () => ({ naneas: true, edad: edadDesdeRangos(RANGOS_EDAD_NANEAS) })),
    ];
    const total = grupos.length;
    const indices = grupos.map((_, i) => i);

    // Alertas de peso: niños de 2 a 8 años (activos y con varios controles)
    const candidatosAlerta = indices.filter((i) => grupos[i].edad >= 24 && grupos[i].edad <= 96);
    const idxGanancia = new Set(faker.helpers.arrayElements(candidatosAlerta, CANTIDAD_ALERTA_GANANCIA));
    const idxPerdida = new Set(faker.helpers.arrayElements(candidatosAlerta.filter((i) => !idxGanancia.has(i)), CANTIDAD_ALERTA_PERDIDA));
    const idxSename = new Set(faker.helpers.arrayElements(indices, CANTIDAD_SENAME));
    const idxTrans = new Set(faker.helpers.arrayElements(indices.filter((i) => grupos[i].edad >= EDAD_MINIMA_MESES_TRANS), CANTIDAD_TRANS));
    const idxTutorPorConfirmar = new Set(faker.helpers.arrayElements(indices.filter((i) => grupos[i].naneas), TUTORES_POR_CONFIRMAR));

    const pacientesCreados: PacienteSeed[] = [];
    let totalControles = 0;

    for (const i of faker.helpers.shuffle(indices)) {
        const { naneas: esNaneas, edad: edadMeses } = grupos[i];
        // Se retrocede desde hoy para que nadie nazca en el futuro; los recién
        // nacidos (0 meses) tienen al menos 7 días de vida para su primer control
        const fechaNacimiento = sumarDias(restarMeses(HOY, edadMeses), -faker.number.int({ min: edadMeses === 0 ? 7 : 0, max: 27 }));
        // En el catastro NANEAS ~63% son hombres; Programa Infantil 50/50
        const sexo = faker.datatype.boolean({ probability: esNaneas ? 0.63 : 0.5 }) ? 'Masculino' : 'Femenino';
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
        }

        const diagnosticos = esNaneas ? generarDiagnosticos(edadMeses, sexo) : [];
        const tieneTEA = diagnosticos.some((d) => VALORES_TEA.has(d));
        const esSaludMental = diagnosticos.some((d) => DIAGNOSTICOS_SALUD_MENTAL.has(d))
            ? faker.datatype.boolean({ probability: 0.7 })
            : faker.datatype.boolean({ probability: esNaneas ? 0.15 : edadMeses >= 72 ? 0.06 : 0.02 });
        const credencial = generarCredencial(esNaneas, diagnosticos);
        const tieneCuidador = faker.datatype.boolean({ probability: esNaneas ? 0.3 : 0.04 });
        const esTrans = idxTrans.has(i);
        const esMigrante = faker.datatype.boolean({ probability: 0.12 });
        const conAlerta = idxGanancia.has(i) || idxPerdida.has(i);
        const activo = conAlerta ? true : faker.datatype.boolean({ probability: 0.95 });

        // Controles primero, para que la fecha de inscripción quede antes del primero
        const numControles = conAlerta
            ? faker.number.int({ min: 3, max: 5 })
            : faker.helpers.weightedArrayElement([
                { weight: 10, value: 1 }, { weight: 22, value: 2 }, { weight: 30, value: 3 }, { weight: 22, value: 4 }, { weight: 16, value: 5 },
            ]);
        const tipoForzado: TipoForzado = idxGanancia.has(i) ? 'ganancia' : idxPerdida.has(i) ? 'perdida' : 'ninguno';
        const serie = generarSerieControles(fechaNacimiento, numControles, tipoForzado);
        let fechaInscripcion = sumarDias(serie[0].fecha, -faker.number.int({ min: 0, max: 20 }));
        if (fechaInscripcion.getTime() < fechaNacimiento.getTime()) fechaInscripcion = fechaNacimiento;

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
                es_naneas_prematuro: esNaneas,
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
            tea: tieneTEA,
            telefono: tutor.telefono,
            activo,
        });

        // creado_en = fecha del control, para que la agenda tome como "vigente"
        // el último control real de cada paciente
        const controles: Prisma.ControlClinicoCreateManyInput[] = serie.map((c) => {
            const esc = c.edadMeses >= 120 && faker.datatype.boolean({ probability: 0.35 }) ? ESCENARIO_ADOLESCENTE
                : esNaneas && faker.datatype.boolean({ probability: 0.5 }) ? faker.helpers.arrayElement(ESCENARIOS_NANEAS)
                : faker.helpers.arrayElement(ESCENARIOS);
            return {
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
            };
        });
        await prisma.controlClinico.createMany({ data: controles });
        totalControles += controles.length;

        if (pacientesCreados.length % 50 === 0) console.log(`${pacientesCreados.length}/${total} pacientes creados...`);
    }

    // --- Talleres, sesiones e inscripciones ---------------------------------
    let totalSesiones = 0;
    let totalInscripciones = 0;
    const resumenTalleres: string[] = [];
    for (const t of TALLERES) {
        const taller = await prisma.taller.create({
            data: { nombre: t.nombre, descripcion: t.descripcion, edad_min: t.edad_min, edad_max: t.edad_max, activo: true },
        });
        // Grupo base del taller: pacientes activos dentro del rango de edad,
        // con más probabilidad para TEA y NANEAS (cualquiera puede asistir)
        const candidatos = pacientesCreados
            .filter((p) => p.activo && p.edadAnios >= t.edad_min && p.edadAnios <= t.edad_max)
            .map((p) => ({ item: p, peso: p.tea ? t.afinidad.tea : p.naneas ? t.afinidad.naneas : t.afinidad.otro }));
        const grupo = elegirPonderado(candidatos, faker.number.int({ min: t.grupo[0], max: t.grupo[1] }));
        const responsables = profesionales.filter((p) => p.estamento === t.estamento);

        for (const base of t.sesiones) {
            // Pequeña variación de fecha, salvo la sesión de HOY
            const off = base === 0 ? 0 : base + faker.number.int({ min: -2, max: 2 });
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
                        ? faker.helpers.arrayElement(['Buena participación del grupo.', 'Se trabajó con apoyo de cuidadores.', 'Sesión acortada por actividad del CESFAM.', 'Asistieron cuidadores sin el niño o niña.'])
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
                await prisma.inscripcionTaller.create({
                    data: {
                        rut_paciente: p.rut,
                        id_sesion: sesion.id_sesion,
                        estado_convocatoria: convocatoria,
                        estado_asistencia: asistencia,
                        telefono_contacto: p.telefono,
                        // El contacto nunca queda en el futuro
                        fecha_contacto: convocatoria === 'no_contactado' ? null : hoyMasDias(Math.min(off, 0) - faker.number.int({ min: 1, max: 5 })),
                        observaciones: convocatoria === 'no_puede' ? 'Tutor informa que no puede asistir por horario laboral.' : null,
                    },
                });
                totalInscripciones++;
            }
        }
        const edades = grupo.map((p) => p.edadAnios);
        resumenTalleres.push(`    ${t.nombre} (${t.edad_min}-${t.edad_max} años): grupo de ${grupo.length}, ` +
            `${grupo.filter((p) => p.tea).length} con TEA, edades ${Math.min(...edades)}-${Math.max(...edades)} años, ${t.sesiones.length} sesiones`);
    }

    // --- Resumen -------------------------------------------------------------
    const sinControles = await prisma.paciente.count({ where: { controlClinico: { none: {} } } });
    console.log('\n=== Seed completado ===');
    console.log(`  Pacientes: ${total} (${TOTAL_PACIENTES_INFANTIL} Programa Infantil 0-9 años, ${TOTAL_PACIENTES_NANEAS} NANEAS)`);
    console.log(`  Controles clínicos: ${totalControles} | pacientes sin controles: ${sinControles}`);
    console.log(`  Alertas de peso: ${CANTIDAD_ALERTA_GANANCIA} ganancia / ${CANTIDAD_ALERTA_PERDIDA} pérdida`);
    console.log(`  Talleres: ${TALLERES.length} | Sesiones: ${totalSesiones} | Inscripciones: ${totalInscripciones}`);
    console.log(resumenTalleres.join('\n'));
}

main()
    .catch((e) => {
        console.error('Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
