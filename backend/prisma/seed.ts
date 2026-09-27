
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
const TOTAL_PACIENTES = 150;
const PROPORCION_NANEAS = 0.35; // pacientes con diagnóstico (programa NANEAS)
const CANTIDAD_ALERTA_GANANCIA = 6;
const CANTIDAD_ALERTA_PERDIDA = 6;
const CANTIDAD_SENAME = 10;
const CANTIDAD_TRANS = 8;
const EDAD_MINIMA_MESES_TRANS = 48;
const EDAD_MAXIMA_MESES_PREMATURO = 60;
const EDAD_MESES_IMC = 24; // IMC solo desde los 2 años (validación clínica)
 
// Profesional principal (login). Mismo RUT que el seed anterior.
const PROFESIONAL_PRINCIPAL = { rut: '21118397-7', nombre: 'Francisca', apellido: 'Huaique', estamento: 'Médico' };
 
const SECTORES = ['Sector 1 - Azul', 'Sector 2 - Rojo', 'Fuera de Sector'];
const PESOS_SECTORES = [45, 45, 10];
const COMUNA_UNICA = 'Concepción';
 
// Diagnósticos canónicos (mismos valores que produce la importación del Excel,
// ver MAPA_DIAGNOSTICOS_CANONICOS en importacion.service.ts) + algunos
// frecuentes que se guardan tal cual.
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
    { value: 'ASMA', weight: 5 },
    { value: 'Parálisis Cerebral', weight: 2 },
];
const DIAGNOSTICOS_SALUD_MENTAL = new Set(['TDAH', 'Trastorno Ansioso', 'Trastorno Conductual', 'TOD']);
 
const ESTAMENTOS_EXTRA = [
    'Enfermera/o', 'Enfermera/o', 'Nutricionista', 'Psicóloga/o', 'Fonoaudióloga/o',
    'Terapeuta Ocupacional', 'Kinesióloga/o', 'Educadora de Párvulos', 'Médico',
];
const ESTAMENTOS_CONTROL = new Set(['Médico', 'Enfermera/o', 'Nutricionista']);
 
const TALLERES = [
    { nombre: 'Habilidades Sociales TEA', descripcion: 'Espacio grupal para trabajar interacción, turnos y juego compartido en niños y niñas con TEA.', edad_min: 4, edad_max: 10, estamento: 'Terapeuta Ocupacional', soloNaneas: true },
    { nombre: 'Estimulación del Lenguaje', descripcion: 'Actividades lúdicas de estimulación del lenguaje expresivo y comprensivo.', edad_min: 2, edad_max: 6, estamento: 'Fonoaudióloga/o', soloNaneas: false },
    { nombre: 'Regulación Emocional', descripcion: 'Herramientas de reconocimiento y manejo de emociones para escolares y adolescentes.', edad_min: 8, edad_max: 15, estamento: 'Psicóloga/o', soloNaneas: false },
    { nombre: 'Alimentación Saludable en Familia', descripcion: 'Taller educativo para niños, niñas y sus familias sobre hábitos alimentarios.', edad_min: 3, edad_max: 12, estamento: 'Nutricionista', soloNaneas: false },
    { nombre: 'Integración Sensorial', descripcion: 'Circuitos y actividades sensoriales adaptadas.', edad_min: 2, edad_max: 8, estamento: 'Terapeuta Ocupacional', soloNaneas: true },
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
function edadEnAnios(fechaNacimiento: Date, referencia: Date = hoyMasDias(0)): number {
    let edad = referencia.getUTCFullYear() - fechaNacimiento.getUTCFullYear();
    const m = referencia.getUTCMonth() - fechaNacimiento.getUTCMonth();
    if (m < 0 || (m === 0 && referencia.getUTCDate() < fechaNacimiento.getUTCDate())) edad--;
    return edad;
}
 
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
// Curvas de crecimiento aproximadas 0–18 años (promedio ambos sexos)
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
 
function diagnosticoNutricional(edadMeses: number, peso: number, talla: number): string {
    const ref = edadMeses < EDAD_MESES_IMC
        ? peso / pesoEsperado(edadMeses) // peso/edad en menores de 2
        : (peso / Math.pow(talla / 100, 2)) / (pesoEsperado(edadMeses) / Math.pow(tallaEsperada(edadMeses) / 100, 2)); // IMC relativo
    if (ref < 0.85) return 'Desnutrición';
    if (ref < 0.92) return 'Riesgo de desnutrir';
    if (ref <= 1.1) return 'Eutrófico';
    if (ref <= 1.2) return 'Sobrepeso';
    return 'Obesidad';
}
 
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
    { motivo: 'Control adolescente', anamnesis: 'Control de salud integral adolescente. Refiere buen rendimiento escolar, actividad física 2 veces por semana.', exploracion: 'Buen estado general. Desarrollo puberal acorde a la edad.', diagnostico: 'Adolescente sano', indicaciones: 'Reforzar hábitos saludables, uso de pantallas y horas de sueño.' },
    { motivo: 'Sobrepeso en seguimiento', anamnesis: 'Control por sobrepeso detectado previamente. Cambios parciales en hábitos.', exploracion: 'Evolución antropométrica en contexto de seguimiento.', diagnostico: 'Sobrepeso leve', indicaciones: 'Alimentación saludable y actividad física diaria. Control de seguimiento.' },
];
 
const TIPOS_LACTANCIA = [
    { value: 'Lactancia materna exclusiva', weight: 45 },
    { value: 'Lactancia materna predominante', weight: 15 },
    { value: 'Lactancia mixta', weight: 25 },
    { value: 'Fórmula láctea', weight: 15 },
];
const EDADES_DPM = [4, 8, 12, 18, 24, 36, 48, 60]; // meses en que se aplica EEDP/TEPSI
const RESULTADOS_DPM = [
    { value: 'Normal', weight: 75 },
    { value: 'Normal con rezago', weight: 12 },
    { value: 'Riesgo', weight: 9 },
    { value: 'Retraso', weight: 4 },
];
 
// ---------------------------------------------------------------------------
// Series de controles
// ---------------------------------------------------------------------------
type TipoForzado = 'ninguno' | 'ganancia' | 'perdida';
interface ControlGenerado { fecha: Date; edadMeses: number; peso: number; talla: number; esUltimo: boolean }
 
function generarSerieControles(edadMesesActual: number, numControles: number, tipoForzado: TipoForzado, diasDesdeUltimo: number): ControlGenerado[] {
    const factor = faker.number.float({ min: 0.88, max: 1.12, fractionDigits: 2 });
    // Los lactantes se controlan más seguido que los escolares/adolescentes
    const intervaloMeses = edadMesesActual < 24 ? faker.number.int({ min: 1, max: 3 })
        : edadMesesActual < 120 ? faker.number.int({ min: 3, max: 6 })
        : faker.number.int({ min: 6, max: 12 });
 
    const ancla = hoyMasDias(-diasDesdeUltimo);
    const edadAncla = Math.max(edadMesesActual - Math.round(diasDesdeUltimo / 30), 0);
    const controles: ControlGenerado[] = [];
 
    for (let k = 0; k < numControles; k++) {
        const atras = numControles - 1 - k;
        const edad = edadAncla - atras * intervaloMeses;
        if (edad < 0) continue; // no hay controles antes de nacer
        const fecha = fechaSoloDia(ancla.getUTCFullYear(), ancla.getUTCMonth() - atras * intervaloMeses, ancla.getUTCDate());
 
        let peso = pesoEsperado(edad) * factor + faker.number.float({ min: -0.2, max: 0.2, fractionDigits: 2 });
        let talla = tallaEsperada(edad) * Math.sqrt(factor) + faker.number.float({ min: -0.3, max: 0.3, fractionDigits: 2 });
        const previo = controles[controles.length - 1];
        if (previo) {
            talla = Math.max(talla, previo.talla);
            peso = Math.max(peso, previo.peso - 0.2);
        }
        controles.push({ fecha, edadMeses: edad, peso: +peso.toFixed(1), talla: +talla.toFixed(1), esUltimo: false });
    }
    if (controles.length) controles[controles.length - 1].esUltimo = true;
 
    if (tipoForzado !== 'ninguno' && controles.length >= 2) {
        const pen = controles[controles.length - 2];
        const ult = controles[controles.length - 1];
        ult.peso = tipoForzado === 'ganancia'
            ? +(pen.peso + faker.number.float({ min: 3.5, max: 6, fractionDigits: 1 })).toFixed(1)
            : +Math.max(pen.peso - faker.number.float({ min: 2.5, max: 4.5, fractionDigits: 1 }), 2).toFixed(1);
    }
    return controles;
}
 
function proximoControlDistribuido(): Date {
    const cat = faker.helpers.weightedArrayElement([
        { weight: 15, value: 'atrasado' }, { weight: 10, value: 'hoy' }, { weight: 20, value: 'semana' },
        { weight: 30, value: 'mes' }, { weight: 25, value: 'lejano' },
    ]);
    const off = cat === 'atrasado' ? -faker.number.int({ min: 1, max: 45 })
        : cat === 'hoy' ? 0
        : cat === 'semana' ? faker.number.int({ min: 1, max: 7 })
        : cat === 'mes' ? faker.number.int({ min: 8, max: 30 })
        : faker.number.int({ min: 31, max: 180 });
    return hoyMasDias(off);
}
 
// ---------------------------------------------------------------------------
// Datos del paciente
// ---------------------------------------------------------------------------
function edadAleatoriaMeses(): number {
    // ~65% 0-9 años, ~35% 10-18 años (el programa se concentra en primera infancia)
    return faker.helpers.weightedArrayElement([
        { weight: 20, value: () => faker.number.int({ min: 0, max: 23 }) },
        { weight: 45, value: () => faker.number.int({ min: 24, max: 119 }) },
        { weight: 35, value: () => faker.number.int({ min: 120, max: 215 }) },
    ])();
}
 
function generarDiagnosticos(): string[] {
    const cantidad = faker.helpers.weightedArrayElement([{ weight: 60, value: 1 }, { weight: 30, value: 2 }, { weight: 10, value: 3 }]);
    const set = new Set<string>();
    while (set.size < cantidad) set.add(faker.helpers.weightedArrayElement(DIAGNOSTICOS));
    // TEA y sus variantes no conviven en el mismo paciente
    const teas = [...set].filter((d) => d.includes('TEA'));
    if (teas.length > 1) teas.slice(1).forEach((d) => set.delete(d));
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
        const p = {
            rut: generarRUT(anioNacimientoAdulto()),
            nombre: faker.person.firstName(),
            apellido: faker.person.lastName(),
            estamento,
        };
        await prisma.profesional.create({ data: { ...p, activo: true } });
        profesionales.push(p);
    }
    // uno inactivo, para probar filtros
    await prisma.profesional.create({
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
 
    // --- Tutores -------------------------------------------------------------
    const tutores = [];
    for (let i = 0; i < TOTAL_TUTORES; i++) {
        const noVerificado = i < 5; // simula tutores placeholder de la importación Excel
        tutores.push(await prisma.tutor.create({
            data: {
                rut: noVerificado ? null : generarRUT(anioNacimientoAdulto()),
                nombre: faker.person.firstName(),
                apellido: faker.person.lastName(),
                telefono: telefonoMovil(),
                telefono_secundario: faker.datatype.boolean({ probability: 0.3 }) ? telefonoMovil() : null,
                parentesco: faker.helpers.weightedArrayElement([
                    { weight: 60, value: 'Madre' }, { weight: 20, value: 'Padre' }, { weight: 12, value: 'Abuela' }, { weight: 8, value: 'Tío/a' },
                ]),
                correo: faker.datatype.boolean({ probability: 0.65 }) ? faker.internet.email().toLowerCase() : null,
                direccion: noVerificado ? 'Sin información' : faker.location.streetAddress(),
                sector: faker.helpers.weightedArrayElement(SECTORES.map((value, j) => ({ value, weight: PESOS_SECTORES[j] }))),
                comuna: COMUNA_UNICA,
                verificado: !noVerificado,
            },
        }));
    }
    console.log(`${tutores.length} tutores creados (5 sin verificar).`);
 
    // --- Pacientes + controles ----------------------------------------------
    const edades = Array.from({ length: TOTAL_PACIENTES }, edadAleatoriaMeses);
    const indices = edades.map((_, i) => i);
    const idxNaneas = new Set(faker.helpers.arrayElements(indices.filter((i) => edades[i] >= 18), Math.round(TOTAL_PACIENTES * PROPORCION_NANEAS)));
    const idxSename = new Set(faker.helpers.arrayElements(indices, CANTIDAD_SENAME));
    const idxTrans = new Set(faker.helpers.arrayElements(indices.filter((i) => edades[i] >= EDAD_MINIMA_MESES_TRANS), CANTIDAD_TRANS));
    const idxGanancia = new Set(faker.helpers.arrayElements(indices, CANTIDAD_ALERTA_GANANCIA));
    const idxPerdida = new Set(faker.helpers.arrayElements(indices.filter((i) => !idxGanancia.has(i)), CANTIDAD_ALERTA_PERDIDA));
 
    const pacientesCreados: { rut: string; edadAnios: number; naneas: boolean }[] = [];
    let totalControles = 0;
 
    for (let i = 0; i < TOTAL_PACIENTES; i++) {
        const tutor = faker.helpers.arrayElement(tutores);
        const edadMeses = edades[i];
        const fechaNacimiento = fechaSoloDia(HOY_ANIO, HOY_MES - edadMeses, faker.number.int({ min: 1, max: 28 }));
        const sexo = faker.helpers.arrayElement(['Masculino', 'Femenino']);
        const generoLegal: 'male' | 'female' = sexo === 'Masculino' ? 'male' : 'female';
 
        const esNaneas = idxNaneas.has(i);
        const diagnosticos = esNaneas ? generarDiagnosticos() : [];
        const esSaludMental = diagnosticos.some((d) => DIAGNOSTICOS_SALUD_MENTAL.has(d))
            ? faker.datatype.boolean({ probability: 0.7 })
            : faker.datatype.boolean({ probability: edadMeses >= 72 ? 0.08 : 0.02 });
        // Igual que la importación: todo paciente NANEAS queda con el flag, más algunos prematuros pequeños
        const esNaneasPrematuro = esNaneas || (edadMeses <= EDAD_MAXIMA_MESES_PREMATURO && faker.datatype.boolean({ probability: 0.08 }));
        const credencial = generarCredencial(esNaneas);
        const tieneCuidador = esNaneas ? faker.datatype.boolean({ probability: 0.45 }) : faker.datatype.boolean({ probability: 0.05 });
        const esTrans = idxTrans.has(i);
        const esMigrante = faker.datatype.boolean({ probability: 0.12 });
 
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
                direccion: tutor.direccion === 'Sin información' ? faker.location.streetAddress() : tutor.direccion,
                sector: tutor.sector,
                comuna: COMUNA_UNICA,
                nhc: `${faker.number.int({ min: 10000, max: 99999 })}`,
                prevision: faker.helpers.weightedArrayElement([
                    { weight: 25, value: 'FONASA A' }, { weight: 30, value: 'FONASA B' }, { weight: 20, value: 'FONASA C' },
                    { weight: 15, value: 'FONASA D' }, { weight: 10, value: 'ISAPRE' },
                ]),
                fecha_inscripcion: sumarDias(fechaNacimiento, faker.number.int({ min: 5, max: Math.max(6, edadMeses * 15) })),
                activo: faker.datatype.boolean({ probability: 0.93 }),
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
        pacientesCreados.push({ rut: paciente.rut, edadAnios: edadEnAnios(fechaNacimiento), naneas: esNaneas });
 
        // Controles
        const numControles = faker.helpers.weightedArrayElement([
            { weight: 15, value: 1 }, { weight: 30, value: 2 }, { weight: 30, value: 3 }, { weight: 15, value: 4 }, { weight: 10, value: 5 },
        ]);
        const tipoForzado: TipoForzado = idxGanancia.has(i) ? 'ganancia' : idxPerdida.has(i) ? 'perdida' : 'ninguno';
        const serie = generarSerieControles(edadMeses, numControles, tipoForzado, faker.number.int({ min: 0, max: 60 }));
 
        for (const c of serie) {
            const esc = edadMeses >= 120 && faker.datatype.boolean({ probability: 0.4 })
                ? ESCENARIOS[8]
                : faker.helpers.arrayElement(ESCENARIOS.filter((_, j) => j !== 8));
            const aplicaDpm = EDADES_DPM.includes(c.edadMeses) || (esc.motivo.includes('psicomotor') && c.edadMeses <= 60);
            await prisma.controlClinico.create({
                data: {
                    fecha_control: c.fecha,
                    motivo_consulta: esc.motivo,
                    anamnesis: esc.anamnesis,
                    exploracion_fisica: esc.exploracion,
                    edad_meses: c.edadMeses,
                    peso_kg: c.peso,
                    talla_cm: c.talla,
                    perimetro_cefalico: c.edadMeses <= 36 ? +perimetroEsperado(c.edadMeses).toFixed(1) : null,
                    imc: c.edadMeses >= EDAD_MESES_IMC ? +(c.peso / Math.pow(c.talla / 100, 2)).toFixed(2) : null,
                    presion_arterial: c.edadMeses >= 36 && faker.datatype.boolean({ probability: 0.6 })
                        ? `${faker.number.int({ min: 90, max: 118 })}/${faker.number.int({ min: 55, max: 76 })}`
                        : null,
                    diagnostico_nutricional: diagnosticoNutricional(c.edadMeses, c.peso, c.talla),
                    tipo_lactancia: c.edadMeses < 24 ? faker.helpers.weightedArrayElement(TIPOS_LACTANCIA) : null,
                    resultado_dpm: aplicaDpm ? faker.helpers.weightedArrayElement(RESULTADOS_DPM) : null,
                    meses_dpm_aplicado: aplicaDpm ? c.edadMeses : null,
                    score_ira: c.edadMeses < 7 ? faker.helpers.weightedArrayElement([
                        { weight: 80, value: 'Leve' }, { weight: 15, value: 'Moderado' }, { weight: 5, value: 'Grave' },
                    ]) : null,
                    problemas_diagnosticados: esc.diagnostico,
                    indicaciones_acuerdos: esc.indicaciones,
                    fecha_proximoControl: c.esUltimo ? proximoControlDistribuido() : sumarDias(c.fecha, faker.number.int({ min: 45, max: 150 })),
                    rut_paciente: paciente.rut,
                    rut_profesional: faker.helpers.arrayElement(profesionalesControl).rut,
                },
            });
            totalControles++;
        }
        if ((i + 1) % 25 === 0) console.log(`${i + 1}/${TOTAL_PACIENTES} pacientes creados...`);
    }
 
    // --- Talleres, sesiones e inscripciones ---------------------------------
    let totalSesiones = 0;
    let totalInscripciones = 0;
    for (const t of TALLERES) {
        const taller = await prisma.taller.create({
            data: { nombre: t.nombre, descripcion: t.descripcion, edad_min: t.edad_min, edad_max: t.edad_max, activo: true },
        });
        const elegibles = pacientesCreados.filter((p) => p.edadAnios >= t.edad_min && p.edadAnios <= t.edad_max && (!t.soloNaneas || p.naneas));
        const responsables = profesionales.filter((p) => p.estamento === t.estamento);
        // Grupo base del taller: mismos niños suelen repetir sesión
        const grupo = faker.helpers.arrayElements(elegibles, Math.min(elegibles.length, faker.number.int({ min: 6, max: 12 })));
 
        // 4 sesiones pasadas (cada 2 semanas) + 2 futuras
        const offsets = [-56, -42, -28, -14, 7, 21].map((d) => d + faker.number.int({ min: -2, max: 2 }));
        for (const off of offsets) {
            const esPasada = off < 0;
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
                const convocatoria: EstadoConvocatoria = esPasada
                    ? faker.helpers.weightedArrayElement<EstadoConvocatoria>([
                        { weight: 70, value: 'confirma' }, { weight: 10, value: 'no_confirma' }, { weight: 10, value: 'no_contesta' }, { weight: 10, value: 'no_puede' },
                    ])
                    : faker.helpers.weightedArrayElement<EstadoConvocatoria>([
                        { weight: 30, value: 'no_contactado' }, { weight: 15, value: 'contactado' }, { weight: 30, value: 'confirma' },
                        { weight: 10, value: 'no_contesta' }, { weight: 10, value: 'reconfirmar' }, { weight: 5, value: 'no_puede' },
                    ]);
                const asistencia: EstadoAsistencia = !esPasada ? 'pendiente'
                    : convocatoria === 'confirma' ? (faker.datatype.boolean({ probability: 0.85 }) ? 'asiste' : 'no_asiste')
                    : faker.datatype.boolean({ probability: 0.15 }) ? 'asiste' : 'no_asiste';
                await prisma.inscripcionTaller.create({
                    data: {
                        rut_paciente: p.rut,
                        id_sesion: sesion.id_sesion,
                        estado_convocatoria: convocatoria,
                        estado_asistencia: asistencia,
                        fecha_contacto: convocatoria === 'no_contactado' ? null : hoyMasDias(off - faker.number.int({ min: 1, max: 5 })),
                        observaciones: convocatoria === 'no_puede' ? 'Tutor informa que no puede asistir por horario laboral.' : null,
                    },
                });
                totalInscripciones++;
            }
        }
    }
 
    // --- Resumen -------------------------------------------------------------
    console.log('\n=== Seed completado ===');
    console.log(`  Pacientes: ${TOTAL_PACIENTES} (${idxNaneas.size} NANEAS con diagnóstico)`);
    console.log(`  Controles clínicos: ${totalControles}`);
    console.log(`  Alertas de peso: ${CANTIDAD_ALERTA_GANANCIA} ganancia / ${CANTIDAD_ALERTA_PERDIDA} pérdida`);
    console.log(`  Talleres: ${TALLERES.length} | Sesiones: ${totalSesiones} | Inscripciones: ${totalInscripciones}`);
}
 
main()
    .catch((e) => {
        console.error('Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
 