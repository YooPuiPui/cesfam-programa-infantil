import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el volcado masivo de datos (Seeding)... 🌱');

  // 1. Limpiar la base de datos (Orden inverso)
  await prisma.controlClinico.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.tutor.deleteMany();
  await prisma.profesional.deleteMany();

  // ==========================================
  // DATOS MAESTROS (ARREGLOS)
  // ==========================================

  const profesionalesData = [
    { rut: '18.123.456-7', nombre: 'Matías', apellido: 'González', estamento: 'Enfermero' },
    { rut: '15.987.654-3', nombre: 'Ana', apellido: 'Silva', estamento: 'Pediatra' },
    { rut: '17.444.555-1', nombre: 'Kairi', apellido: 'Vargas', estamento: 'Nutricionista' },
    { rut: '12.333.222-K', nombre: 'Zacarías', apellido: 'Pinto', estamento: 'Médico General' },
    { rut: '16.777.888-9', nombre: 'Claudia', apellido: 'Morales', estamento: 'Enfermera' }
  ];

  const tutoresData = [
    { rut: '16.555.444-2', nombre: 'Camila', apellido: 'Robles', telefono: '+56912345678', parentesco: 'Madre', correo: 'camila@mail.com', direccion: 'Los Carrera 123', sector: 'Centro', comuna: 'Concepción' },
    { rut: '14.222.333-1', nombre: 'Pedro', apellido: 'Martínez', telefono: '+56987654321', parentesco: 'Padre', correo: 'pedro@mail.com', direccion: 'Collao 987', sector: 'Collao', comuna: 'Concepción' },
    { rut: '15.111.222-3', nombre: 'Lorena', apellido: 'Soto', telefono: '+56911122233', parentesco: 'Abuela', correo: 'lorena@mail.com', direccion: 'Barrio Norte 456', sector: 'Barrio Norte', comuna: 'Concepción' },
    { rut: '18.999.888-7', nombre: 'Andrés', apellido: 'Cabrera', telefono: '+56999988877', parentesco: 'Padre', correo: 'andres@mail.com', direccion: 'Pedro de Valdivia 100', sector: 'Pedro de Valdivia', comuna: 'Concepción' },
    { rut: '17.666.555-4', nombre: 'Tifa', apellido: 'Lockhart', telefono: '+56977766655', parentesco: 'Madre', correo: 'tifa@mail.com', direccion: 'San Pedro 200', sector: 'San Pedro de la Paz', comuna: 'San Pedro' },
    { rut: '13.444.333-2', nombre: 'Manuel', apellido: 'Gutiérrez', telefono: '+56944433322', parentesco: 'Padre', correo: 'manuel@mail.com', direccion: 'Lomas de San Andrés 50', sector: 'Lomas', comuna: 'Concepción' },
    { rut: '19.222.111-0', nombre: 'Sofía', apellido: 'Reyes', telefono: '+56922211100', parentesco: 'Madre', correo: 'sofia@mail.com', direccion: 'Tucapel 900', sector: 'Centro', comuna: 'Concepción' },
    { rut: '16.888.777-6', nombre: 'Jorge', apellido: 'Tapia', telefono: '+56988877766', parentesco: 'Tío', correo: 'jorge@mail.com', direccion: 'O\'Higgins 400', sector: 'Centro', comuna: 'Concepción' },
    { rut: '15.333.444-5', nombre: 'María', apellido: 'Pérez', telefono: '+56933344455', parentesco: 'Madre', correo: 'maria@mail.com', direccion: 'Lorenzo Arenas 30', sector: 'Lorenzo Arenas', comuna: 'Concepción' },
    { rut: '14.555.666-8', nombre: 'Carlos', apellido: 'Méndez', telefono: '+56955566688', parentesco: 'Padre', correo: 'carlos@mail.com', direccion: 'Palomares 12', sector: 'Palomares', comuna: 'Concepción' }
  ];

  // ==========================================
  // INSERCIÓN DE DATOS
  // ==========================================

  console.log('🧑‍⚕️ Insertando 5 Profesionales...');
  for (const prof of profesionalesData) {
    await prisma.profesional.create({ data: prof });
  }

  console.log('👨‍👩‍👧‍👦 Insertando 10 Tutores...');
  const tutoresCreados = [];
  for (const tut of tutoresData) {
    const nuevoTutor = await prisma.tutor.create({ data: tut });
    tutoresCreados.push(nuevoTutor);
  }

  // Generador de 20 Pacientes distribuidos entre los 10 tutores
  console.log('👶 Insertando 20 Pacientes...');
  const pacientesCreados = [];
  const nombresPacientes = ['Agustín', 'Isabella', 'Sora', 'Riku', 'Mateo', 'Lucas', 'Mia', 'Emilia', 'Tomás', 'Martina', 'Vicente', 'Julieta', 'Maximiliano', 'Renata', 'Gaspar', 'Florencia', 'Joaquín', 'Amanda', 'Diego', 'Antonella'];
  const apellidosPacientes = ['Robles', 'Martínez', 'Soto', 'Cabrera', 'Lockhart', 'Gutiérrez', 'Reyes', 'Tapia', 'Pérez', 'Méndez'];

  for (let i = 0; i < 20; i++) {
    // Asignar 2 niños por cada tutor para probar la relación 1:N
    const tutorAsignado = tutoresCreados[Math.floor(i / 2)]; 
    
    const nuevoPaciente = await prisma.paciente.create({
      data: {
        rut: `2${5 + i}.111.222-${i % 9}`,
        nombre: nombresPacientes[i],
        apellido: apellidosPacientes[Math.floor(i / 2)], // Comparten apellido con su tutor/hermano
        fecha_nacimiento: new Date(`202${Math.floor(Math.random() * 4)}-0${(i % 9) + 1}-15T00:00:00.000Z`),
        sexo_biologico: i % 2 === 0 ? 'Masculino' : 'Femenino',
        direccion: tutorAsignado.direccion,
        sector: tutorAsignado.sector,
        comuna: tutorAsignado.comuna,
        nhc: `HC-2024-${100 + i}`,
        prevision: i % 3 === 0 ? 'FONASA A' : 'FONASA B',
        es_sename: i === 5, // Un paciente con flag de SENAME
        es_naneas_prematuro: i === 8 || i === 12, // Dos prematuros
        id_tutor_principal: tutorAsignado.id_tutor,
      }
    });
    pacientesCreados.push(nuevoPaciente);
  }

  // Generar 2 a 3 controles por cada uno de los primeros 10 pacientes
  console.log('🩺 Insertando Controles Clínicos...');
  for (let i = 0; i < 10; i++) {
    const paciente = pacientesCreados[i];
    
    // Control 1 (Enfermería)
    await prisma.controlClinico.create({
      data: {
        fecha_control: new Date('2025-01-15T10:00:00.000Z'),
        edad_meses: 6,
        peso_kg: 7.5 + (i * 0.2),
        talla_cm: 65.0 + i,
        perimetro_cefalico: 43.0,
        imc: 17.5,
        diagnostico_nutricional: 'Eutrófico',
        tipo_lactancia: 'LME (Lactancia Materna Exclusiva)',
        resultado_dpm: 'Normal',
        meses_dpm_aplicado: 6,
        indicaciones_acuerdos: 'Felicitar a la madre. Iniciar alimentación complementaria.',
        fecha_proximoControl: new Date('2025-02-15T00:00:00.000Z'),
        paciente: { connect: { rut: paciente.rut } },
        Profesional: { connect: { rut: profesionalesData[0].rut } }
      }
    });

    // Control 2 (Médico)
    await prisma.controlClinico.create({
      data: {
        fecha_control: new Date('2025-04-20T11:30:00.000Z'),
        edad_meses: 9,
        peso_kg: 8.8 + (i * 0.2),
        talla_cm: 70.0 + i,
        perimetro_cefalico: 45.0,
        imc: 17.8,
        diagnostico_nutricional: 'Eutrófico',
        problemas_diagnosticados: i % 4 === 0 ? 'Cuadro respiratorio leve (Resfrío)' : 'Ninguno. Niño sano.',
        indicaciones_acuerdos: i % 4 === 0 ? 'Paracetamol en caso de fiebre.' : 'Mantener controles al día.',
        fecha_proximoControl: new Date('2025-07-20T00:00:00.000Z'),
        paciente: { connect: { rut: paciente.rut } },
        Profesional: { connect: { rut: profesionalesData[3].rut } }
      }
    });
  }

  console.log('✅ ¡Volcado de datos masivo finalizado con éxito! El CESFAM está lleno de pacientes.');
}

main()
  .catch((e) => {
    console.error(e);
    throw e; // Lanzamos el error nativamente sin depender de "process"
  })
  .finally(async () => {
    await prisma.$disconnect();
  });