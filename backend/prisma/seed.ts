import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ==================== Anclaje de fechas a día calendario (evita bug de zona horaria) ====================
function fechaSoloDia(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

const HOY_LOCAL = new Date();
const HOY_ANIO = HOY_LOCAL.getFullYear();
const HOY_MES = HOY_LOCAL.getMonth();
const HOY_DIA = HOY_LOCAL.getDate();

// ==================== RUT chileno correlacionado con año de nacimiento ====================
const ANCLAS_ANIO = [1960, 1970, 1980, 1990, 2000, 2010, 2015, 2018, 2020, 2022, 2024, 2026];
const ANCLAS_RUT = [4000000, 6500000, 9000000, 11800000, 14000000, 18500000, 21000000, 23000000, 24500000, 26000000, 27300000, 28300000];

function interpolarRutBase(anioNacimiento: number): number {
    if (anioNacimiento <= ANCLAS_ANIO[0]) return ANCLAS_RUT[0];
    if (anioNacimiento >= ANCLAS_ANIO[ANCLAS_ANIO.length - 1]) return ANCLAS_RUT[ANCLAS_RUT.length - 1];

    for (let i = 0; i < ANCLAS_ANIO.length - 1; i++) {
        if (anioNacimiento >= ANCLAS_ANIO[i] && anioNacimiento <= ANCLAS_ANIO[i + 1]) {
            const proporcion = (anioNacimiento - ANCLAS_ANIO[i]) / (ANCLAS_ANIO[i + 1] - ANCLAS_ANIO[i]);
            return ANCLAS_RUT[i] + proporcion * (ANCLAS_RUT[i + 1] - ANCLAS_RUT[i]);
        }
    }
    return ANCLAS_RUT[ANCLAS_RUT.length - 1];
}

function generarRUT(anioNacimiento: number): string {
    const base = interpolarRutBase(anioNacimiento);
    const jitter = faker.number.int({ min: -300000, max: 300000 });
    const numero = Math.max(Math.round(base + jitter), 1000000);

    let suma = 0;
    let multiplicador = 2;
    const digitos = numero.toString().split('').reverse();

    for (const d of digitos) {
        suma += parseInt(d) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);
    const dv = resto === 11 ? '0' : resto === 10 ? 'K' : resto.toString();
    return `${numero}-${dv}`;
}

function anioNacimientoAdulto(): number {
    const edadAdulto = faker.number.int({ min: 25, max: 60 });
    return HOY_ANIO - edadAdulto;
}

// ==================== Curvas de crecimiento aproximadas ====================
const PUNTOS_EDAD = [0, 3, 6, 12, 24, 36, 48, 60, 72, 84, 96, 108];
const PUNTOS_PESO = [3.3, 6.0, 7.8, 9.6, 12.2, 14.3, 16.3, 18.0, 20.5, 22.9, 25.6, 28.6];
const PUNTOS_TALLA = [50, 61, 67, 75, 87, 96, 103, 110, 116, 122, 128, 133];
const PUNTOS_PERIMETRO = [34, 40, 43, 46, 48, 49, 50, 50, 50, 50, 50, 50];

function interpolar(edadMeses: number, puntosX: number[], puntosY: number[]): number {
    if (edadMeses <= puntosX[0]) return puntosY[0];
    if (edadMeses >= puntosX[puntosX.length - 1]) return puntosY[puntosY.length - 1];

    for (let i = 0; i < puntosX.length - 1; i++) {
        if (edadMeses >= puntosX[i] && edadMeses <= puntosX[i + 1]) {
            const proporcion = (edadMeses - puntosX[i]) / (puntosX[i + 1] - puntosX[i]);
            return puntosY[i] + proporcion * (puntosY[i + 1] - puntosY[i]);
        }
    }
    return puntosY[puntosY.length - 1];
}

const pesoEsperado = (edadMeses: number) => interpolar(edadMeses, PUNTOS_EDAD, PUNTOS_PESO);
const tallaEsperada = (edadMeses: number) => interpolar(edadMeses, PUNTOS_EDAD, PUNTOS_TALLA);
const perimetroEsperado = (edadMeses: number) => interpolar(edadMeses, PUNTOS_EDAD, PUNTOS_PERIMETRO);

// ==================== Escenarios clínicos coherentes ====================
interface EscenarioClinico {
    motivo: string;
    anamnesis: string;
    exploracion: string;
    diagnostico: string;
    indicaciones: string;
}

const ESCENARIOS_CLINICOS: EscenarioClinico[] = [
    {
        motivo: 'Control sano',
        anamnesis: 'Paciente asiste a control de niño sano según calendario. Madre refiere buen apetito, sueño adecuado y sin síntomas asociados desde el último control.',
        exploracion: 'Paciente activo, reactivo, en buen estado general. Sin signos de alarma al examen físico. Piel y mucosas normocoloreadas.',
        diagnostico: 'Desarrollo acorde a la edad',
        indicaciones: 'Mantener alimentación acorde a la edad. Continuar esquema de vacunación. Próximo control según calendario.',
    },
    {
        motivo: 'Consulta por resfrío',
        anamnesis: 'Madre refiere cuadro de 3 días de evolución con congestión nasal, tos leve y febrícula ocasional. Sin dificultad respiratoria ni rechazo alimentario.',
        exploracion: 'Rinorrea serosa presente. Auscultación pulmonar sin ruidos agregados. Sin signos de dificultad respiratoria.',
        diagnostico: 'Rinofaringitis aguda',
        indicaciones: 'Manejo sintomático con lavado nasal frecuente. Control si aparece fiebre alta persistente o dificultad para respirar.',
    },
    {
        motivo: 'Control de peso y talla',
        anamnesis: 'Se realiza control antropométrico de rutina. Tutor no refiere síntomas ni preocupaciones adicionales desde la última evaluación.',
        exploracion: 'Paciente en buenas condiciones generales. Se registran medidas antropométricas dentro de rango esperado para la edad.',
        diagnostico: 'Estado nutricional normal',
        indicaciones: 'Mantener hábitos alimenticios actuales. Reforzar actividad física acorde a la edad.',
    },
    {
        motivo: 'Seguimiento nutricional',
        anamnesis: 'Paciente en seguimiento por evaluación nutricional previa. Tutor refiere adherencia parcial a las indicaciones dietéticas entregadas en el control anterior.',
        exploracion: 'Se observa evolución antropométrica en seguimiento. Sin signos clínicos de compromiso nutricional agudo.',
        diagnostico: 'Requiere seguimiento nutricional',
        indicaciones: 'Derivar a nutricionista para reforzar plan alimentario. Control de seguimiento en el plazo indicado.',
    },
    {
        motivo: 'Consulta por fiebre',
        anamnesis: 'Madre consulta por alza térmica de 24 horas de evolución, cuantificada en domicilio. Refiere irritabilidad leve, sin otros síntomas asociados.',
        exploracion: 'Paciente febril al ingreso, reactivo. Orofaringe levemente eritematosa. Sin foco infeccioso evidente al examen físico.',
        diagnostico: 'Síndrome febril sin foco aparente',
        indicaciones: 'Manejo con antipiréticos según indicación médica. Reconsultar si persiste la fiebre por más de 48 horas o aparecen nuevos síntomas.',
    },
    {
        motivo: 'Control de vacunas',
        anamnesis: 'Paciente asiste según calendario de inmunizaciones vigente. Tutor refiere que no hubo reacciones adversas a dosis previas.',
        exploracion: 'Paciente en buen estado general, afebril, sin contraindicaciones aparentes para la vacunación programada.',
        diagnostico: 'Apto para inmunización según esquema PNI',
        indicaciones: 'Se administra dosis correspondiente según calendario. Observar sitio de punción por reacciones locales las próximas 48 horas.',
    },
    {
        motivo: 'Evaluación de desarrollo psicomotor',
        anamnesis: 'Se realiza evaluación de hitos de desarrollo psicomotor correspondientes a la edad. Tutor no refiere preocupaciones respecto al desarrollo del menor.',
        exploracion: 'Paciente cumple con los hitos esperados para su edad en las áreas evaluadas.',
        diagnostico: 'Desarrollo psicomotor acorde a la edad',
        indicaciones: 'Continuar estimulación acorde a la edad en el hogar. Próxima evaluación según calendario DPM.',
    },
    {
        motivo: 'Consulta salud mental',
        anamnesis: 'Tutor consulta por cambios conductuales leves observados en el último mes, en contexto de adaptación escolar reciente.',
        exploracion: 'Paciente colaborador durante la entrevista, sin signos de alarma en el examen mental breve realizado.',
        diagnostico: 'En observación, sin diagnóstico definido',
        indicaciones: 'Reforzar rutinas y contención familiar. Control de seguimiento para reevaluar evolución conductual.',
    },
    {
        motivo: 'Dolor abdominal',
        anamnesis: 'Madre refiere episodios de dolor abdominal intermitente durante la última semana, sin relación clara con las comidas. Deposiciones normales.',
        exploracion: 'Abdomen blando, depresible, sin signos de irritación peritoneal. Sin masas ni visceromegalias palpables.',
        diagnostico: 'Dolor abdominal inespecífico',
        indicaciones: 'Observación domiciliaria. Reconsultar si el dolor se intensifica, se localiza o aparece fiebre asociada.',
    },
    {
        motivo: 'Sobrepeso en seguimiento',
        anamnesis: 'Paciente en control por sobrepeso detectado en evaluación previa. Tutor refiere cambios parciales en hábitos alimenticios desde entonces.',
        exploracion: 'Se registra evolución antropométrica en el contexto de seguimiento por sobrepeso.',
        diagnostico: 'Sobrepeso leve',
        indicaciones: 'Reforzar alimentación saludable y actividad física diaria. Control de seguimiento en el plazo indicado.',
    },
];

// ==================== Distribución de "próximo control" ====================
function generarProximoControlDistribuido(): Date {
    const categoria = faker.helpers.weightedArrayElement([
        { weight: 15, value: 'atrasado' },
        { weight: 10, value: 'hoy' },
        { weight: 20, value: 'esta_semana' },
        { weight: 30, value: 'este_mes' },
        { weight: 25, value: 'lejano' },
    ]);

    let offsetDias = 0;
    switch (categoria) {
        case 'atrasado': offsetDias = -faker.number.int({ min: 1, max: 45 }); break;
        case 'hoy': offsetDias = 0; break;
        case 'esta_semana': offsetDias = faker.number.int({ min: 1, max: 7 }); break;
        case 'este_mes': offsetDias = faker.number.int({ min: 8, max: 30 }); break;
        case 'lejano': offsetDias = faker.number.int({ min: 31, max: 180 }); break;
    }

    return fechaSoloDia(HOY_ANIO, HOY_MES, HOY_DIA + offsetDias);
}

function fechaProximoControlHistorico(fechaControl: Date): Date {
    const offsetDias = faker.number.int({ min: 45, max: 150 });
    return fechaSoloDia(
        fechaControl.getUTCFullYear(),
        fechaControl.getUTCMonth(),
        fechaControl.getUTCDate() + offsetDias
    );
}

// ==================== Generación de la serie de controles (con crecimiento monótono real) ====================
type TipoForzado = 'ninguno' | 'ganancia' | 'perdida';

interface ControlGenerado {
    fecha: Date;
    edadMeses: number;
    peso: number;
    talla: number;
    esUltimo: boolean;
}

function generarSerieControles(
    edadMesesActual: number,
    numControles: number,
    tipoForzado: TipoForzado
): ControlGenerado[] {
    const factorPersonal = faker.number.float({ min: 0.88, max: 1.12, fractionDigits: 2 });
    const intervaloMeses = faker.number.int({ min: 1, max: 4 });

    const controles: ControlGenerado[] = [];

    // Se genera en orden cronológico ascendente (más antiguo primero)
    for (let k = 0; k < numControles; k++) {
        const iDesdeElFinal = numControles - 1 - k;
        const edad = Math.max(edadMesesActual - iDesdeElFinal * intervaloMeses, 0);
        const fecha = fechaSoloDia(HOY_ANIO, HOY_MES - iDesdeElFinal * intervaloMeses, HOY_DIA);

        // Ruido pequeño y FIJO (no proporcional a la edad/tamaño), evita saltos falsos
        const ruidoPeso = faker.number.float({ min: -0.2, max: 0.2, fractionDigits: 2 });
        const ruidoTalla = faker.number.float({ min: -0.3, max: 0.3, fractionDigits: 2 });

        let peso = pesoEsperado(edad) * factorPersonal + ruidoPeso;
        let talla = tallaEsperada(edad) * factorPersonal + ruidoTalla;

        if (k > 0) {
            // La talla NUNCA puede bajar respecto al control anterior (un niño no encoge)
            talla = Math.max(talla, controles[k - 1].talla);
            // El peso puede fluctuar levemente, pero se limita una baja excesiva por ruido
            // (el umbral de alerta de pérdida es -0.5 kg/mes; con este piso, el ruido normal nunca lo alcanza)
            peso = Math.max(peso, controles[k - 1].peso - 0.2);
        }

        controles.push({
            fecha,
            edadMeses: edad,
            peso: parseFloat(peso.toFixed(1)),
            talla: parseFloat(talla.toFixed(1)),
            esUltimo: k === numControles - 1,
        });
    }

    // Caso intencional: se sobreescribe el ÚLTIMO control respecto al PENÚLTIMO,
    // generando un salto real y grande, por encima de cualquier umbral.
    if (tipoForzado !== 'ninguno' && controles.length >= 2) {
        const penultimo = controles[controles.length - 2];
        const ultimo = controles[controles.length - 1];

        if (tipoForzado === 'ganancia') {
            ultimo.peso = parseFloat((penultimo.peso + faker.number.float({ min: 2.5, max: 4.5, fractionDigits: 1 })).toFixed(1));
        } else if (tipoForzado === 'perdida') {
            const pesoForzado = penultimo.peso - faker.number.float({ min: 1.5, max: 3, fractionDigits: 1 });
            ultimo.peso = parseFloat(Math.max(pesoForzado, 2).toFixed(1)); // nunca bajar de 2 kg, por realismo
        }
    }

    return controles;
}

// ==================== MAIN ====================
async function main() {
    console.log('🧹 Limpiando base de datos local...');

    await prisma.controlClinico.deleteMany();
    await prisma.paciente.deleteMany();
    await prisma.tutor.deleteMany();
    await prisma.profesional.deleteMany();
    await prisma.usuario.deleteMany();

    console.log('✅ Base limpia. Iniciando seed...');

    // 1. Usuario de login
    const passwordPlano = 'cesfam2026';
    const passwordHash = await bcrypt.hash(passwordPlano, 10);
    const rutMaria = generarRUT(anioNacimientoAdulto());

    await prisma.usuario.create({
        data: {
            rut: rutMaria,
            password: passwordHash,
            nombre: 'María González',
            rol: 'Profesional',
        },
    });
    console.log(`👤 Usuario de login creado -> RUT: ${rutMaria} | Password: ${passwordPlano}`);

    // 2. Profesionales
    const profesionales = [];
    for (let i = 0; i < 4; i++) {
        const profesional = await prisma.profesional.create({
            data: {
                rut: generarRUT(anioNacimientoAdulto()),
                nombre: faker.person.firstName(),
                apellido: faker.person.lastName(),
                estamento: faker.helpers.arrayElement(['Médico', 'Enfermera', 'Matrona', 'Nutricionista']),
                activo: true,
            },
        });
        profesionales.push(profesional);
    }
    console.log(`${profesionales.length} profesionales creados.`);

    // 3. Tutores
    const tutores = [];
    for (let i = 0; i < 40; i++) {
        const tutor = await prisma.tutor.create({
            data: {
                rut: generarRUT(anioNacimientoAdulto()),
                nombre: faker.person.firstName(),
                apellido: faker.person.lastName(),
                telefono: `+569${faker.number.int({ min: 10000000, max: 99999999 })}`,
                parentesco: faker.helpers.arrayElement(['Madre', 'Padre', 'Abuela', 'Tío/a']),
                correo: faker.internet.email(),
                direccion: faker.location.streetAddress(),
                sector: faker.helpers.arrayElement(['Sector 1', 'Sector 2', 'Sector 3']),
                comuna: 'Concepción',
            },
        });
        tutores.push(tutor);
    }
    console.log(`${tutores.length} tutores creados.`);

    // 4. Pacientes + su serie de controles
    const TOTAL_PACIENTES = 120;
    const CANTIDAD_ALERTA_GANANCIA = 6;
    const CANTIDAD_ALERTA_PERDIDA = 6;

    const indices = Array.from({ length: TOTAL_PACIENTES }, (_, i) => i);
    const indicesGanancia = new Set(faker.helpers.arrayElements(indices, CANTIDAD_ALERTA_GANANCIA));
    const indicesRestantes = indices.filter((i) => !indicesGanancia.has(i));
    const indicesPerdida = new Set(faker.helpers.arrayElements(indicesRestantes, CANTIDAD_ALERTA_PERDIDA));

    for (let i = 0; i < TOTAL_PACIENTES; i++) {
        const tutorAsignado = faker.helpers.arrayElement(tutores);
        const profesionalAsignado = faker.helpers.arrayElement(profesionales);

        const edadMesesActual = faker.number.int({ min: 1, max: 108 });
        const diaNacimiento = faker.number.int({ min: 1, max: 28 });
        const fechaNacimiento = fechaSoloDia(HOY_ANIO, HOY_MES - edadMesesActual, diaNacimiento);

        const paciente = await prisma.paciente.create({
            data: {
                rut: generarRUT(fechaNacimiento.getUTCFullYear()),
                nombre: faker.person.firstName(),
                apellido: faker.person.lastName(),
                fecha_nacimiento: fechaNacimiento,
                sexo_biologico: faker.helpers.arrayElement(['Masculino', 'Femenino']),
                direccion: faker.location.streetAddress(),
                sector: faker.helpers.arrayElement(['Sector 1', 'Sector 2', 'Sector 3']),
                comuna: 'Concepción',
                nacionalidad: faker.helpers.arrayElement(['Chilena', 'Chilena', 'Chilena', 'Venezolana', 'Haitiana']),
                es_sename: faker.datatype.boolean({ probability: 0.05 }),
                es_naneas_prematuro: faker.datatype.boolean({ probability: 0.08 }),
                es_poblacion_trans: faker.datatype.boolean({ probability: 0.02 }),
                es_migrante: faker.datatype.boolean({ probability: 0.1 }),
                id_tutor_principal: tutorAsignado.id_tutor,
            },
        });

        const numControles = faker.helpers.weightedArrayElement([
            { weight: 15, value: 1 },
            { weight: 30, value: 2 },
            { weight: 30, value: 3 },
            { weight: 15, value: 4 },
            { weight: 10, value: 5 },
        ]);

        let tipoForzado: TipoForzado = 'ninguno';
        if (indicesGanancia.has(i) && numControles >= 2) tipoForzado = 'ganancia';
        else if (indicesPerdida.has(i) && numControles >= 2) tipoForzado = 'perdida';

        const serie = generarSerieControles(edadMesesActual, numControles, tipoForzado);

        for (const c of serie) {
            const imc = parseFloat((c.peso / Math.pow(c.talla / 100, 2)).toFixed(2));
            const escenario = faker.helpers.arrayElement(ESCENARIOS_CLINICOS);

            const fechaProximoControl = c.esUltimo
                ? generarProximoControlDistribuido()
                : fechaProximoControlHistorico(c.fecha);

            await prisma.controlClinico.create({
                data: {
                    fecha_control: c.fecha,
                    motivo_consulta: escenario.motivo,
                    anamnesis: escenario.anamnesis,
                    exploracion_fisica: escenario.exploracion,
                    edad_meses: c.edadMeses,
                    peso_kg: c.peso,
                    talla_cm: c.talla,
                    perimetro_cefalico: c.edadMeses <= 36 ? parseFloat(perimetroEsperado(c.edadMeses).toFixed(1)) : null,
                    imc,
                    problemas_diagnosticados: escenario.diagnostico,
                    indicaciones_acuerdos: escenario.indicaciones,
                    fecha_proximoControl: fechaProximoControl,
                    rut_paciente: paciente.rut,
                    rut_profesional: profesionalAsignado.rut,
                },
            });
        }

        if ((i + 1) % 20 === 0) console.log(`${i + 1}/${TOTAL_PACIENTES} pacientes creados...`);
    }

    console.log(`✅ Seed completado: ${TOTAL_PACIENTES} pacientes.`);
    console.log(`   -> ${CANTIDAD_ALERTA_GANANCIA} con aumento de peso forzado`);
    console.log(`   -> ${CANTIDAD_ALERTA_PERDIDA} con pérdida de peso forzada`);
}

main()
    .catch((e) => {
        console.error('Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });