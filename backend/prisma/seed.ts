const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker/locale/es');

const prisma = new PrismaClient();

// Genera un RUT chileno válido con dígito verificador correcto
function generarRUT() {
    const numero = faker.number.int({ min: 5000000, max: 26000000 });
    let suma = 0;
    let multiplicador = 2;
    const digitos = numero.toString().split('').reverse();

    for (const d of digitos) {
        suma += parseInt(d) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);
    let dv = resto === 11 ? '0' : resto === 10 ? 'K' : resto.toString();

    return `${numero}-${dv}`;
}

// Fecha de nacimiento aleatoria entre 0 y 10 años (rango del programa infantil)
function fechaNacimientoAleatoria() {
    const hoy = new Date();
    const edadMeses = faker.number.int({ min: 1, max: 130 }); // hasta ~10 años 10 meses
    const fecha = new Date(hoy);
    fecha.setMonth(fecha.getMonth() - edadMeses);
    fecha.setDate(faker.number.int({ min: 1, max: 28 }));
    return fecha;
}

// Fecha de próximo control: repartida entre pasado (atrasados) y futuro (hoy/semana/mes/lejano)
function fechaProximoControlAleatoria() {
    const hoy = new Date();
    const dias = faker.number.int({ min: -60, max: 90 }); // -60 = atrasado, 0 = hoy, +90 = lejano
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
}

const MOTIVOS_CONSULTA = [
    'Control sano', 'Consulta por resfrío', 'Control de peso y talla',
    'Seguimiento nutricional', 'Consulta por fiebre', 'Control de vacunas',
    'Evaluación de desarrollo psicomotor', 'Consulta salud mental', 'Dolor abdominal',
];

const DIAGNOSTICOS = [
    'Sin hallazgos patológicos', 'Desarrollo acorde a la edad', 'Rinofaringitis aguda',
    'Estado nutricional normal', 'Sobrepeso leve', 'Requiere seguimiento nutricional',
];

const INDICACIONES = [
    'Control en 6 meses', 'Mantener lactancia materna', 'Derivar a nutricionista',
    'Reforzar alimentación saludable', 'Continuar esquema de vacunación', 'Sin indicaciones adicionales',
];

async function main() {
    console.log('Iniciando seed...');

    // 1. Tutor genérico (para no crear 300 tutores distintos, reutilizamos algunos)
    const tutores = [];
    for (let i = 0; i < 50; i++) {
        const tutor = await prisma.tutor.create({
            data: {
                rut: generarRUT(),
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

    // 2. Profesional genérico para asignar a los controles
    let profesional = await prisma.profesional.findFirst();
    if (!profesional) {
        profesional = await prisma.profesional.create({
            data: {
                rut: generarRUT(),
                nombre: 'Valeska',
                apellido: 'Osorio Acuña',
                estamento: 'Médico',
                activo: true,
            },
        });
    }
    console.log(`Usando profesional: ${profesional.nombre} ${profesional.apellido}`);

    // 3. 300 pacientes + 1 control cada uno
    for (let i = 0; i < 300; i++) {
        const tutorAsignado = faker.helpers.arrayElement(tutores);
        const fechaNac = fechaNacimientoAleatoria();

        const paciente = await prisma.paciente.create({
            data: {
                rut: generarRUT(),
                nombre: faker.person.firstName(),
                apellido: faker.person.lastName(),
                fecha_nacimiento: fechaNac,
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

        const edadMeses = Math.floor((Date.now() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        const peso = faker.number.float({ min: 3, max: 45, fractionDigits: 1 });
        const talla = faker.number.float({ min: 45, max: 140, fractionDigits: 1 });
        const imc = parseFloat((peso / Math.pow(talla / 100, 2)).toFixed(2));

        await prisma.controlClinico.create({
            data: {
                motivo_consulta: faker.helpers.arrayElement(MOTIVOS_CONSULTA),
                anamnesis: faker.lorem.sentence(10),
                exploracion_fisica: faker.lorem.sentence(8),
                edad_meses: edadMeses,
                peso_kg: peso,
                talla_cm: talla,
                perimetro_cefalico: edadMeses <= 36 ? faker.number.float({ min: 33, max: 50, fractionDigits: 1 }) : null,
                imc: imc,
                problemas_diagnosticados: faker.helpers.arrayElement(DIAGNOSTICOS),
                indicaciones_acuerdos: faker.helpers.arrayElement(INDICACIONES),
                fecha_proximoControl: fechaProximoControlAleatoria(),
                rut_paciente: paciente.rut,
                rut_profesional: profesional.rut,
            },
        });

        if ((i + 1) % 50 === 0) console.log(`${i + 1}/300 pacientes creados...`);
    }

    console.log('✅ Seed completado: 300 pacientes + controles creados.');
}

main()
    .catch((e) => {
        console.error('Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });