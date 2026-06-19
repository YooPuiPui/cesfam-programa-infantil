import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// 🧠 ALGORITMO MATEMÁTICO RUT CHILENO
// ==========================================
const generarRutReal = (minMillones: number, maxMillones: number) => {
    const numero = Math.floor(Math.random() * (maxMillones - minMillones + 1)) + minMillones;
    
    let suma = 0;
    let multiplicador = 2;
    let temp = numero;

    while (temp > 0) {
        suma += (temp % 10) * multiplicador;
        temp = Math.floor(temp / 10);
        multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
    }

    const dvEsperado = 11 - (suma % 11);
    let dv = dvEsperado.toString();
    if (dvEsperado === 10) dv = "K";
    if (dvEsperado === 11) dv = "0";

    return `${numero}-${dv}`;
};

// ==========================================
// DICCIONARIOS DE DATOS CLÍNICOS
// ==========================================
const nombresNinas = ["Sofía", "Emilia", "Isidora", "Florencia", "Maite", "Josefa", "Agustina", "Martina", "Antonella", "Catalina", "Julieta", "Amanda", "Mia", "Paz"];
const nombresNinos = ["Mateo", "Lucas", "Tomás", "Benjamín", "Vicente", "Maximiliano", "Joaquín", "Martín", "Agustín", "Alonso", "Gaspar", "Facundo", "Diego", "Hugo"];
const apellidosList = ["González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva", "Martínez", "Sepúlveda", "Morales", "López", "Tapia", "Fuentes", "Castro", "Ortiz"];
const comunas = ["Concepción", "Chiguayante", "San Pedro de la Paz", "Talcahuano", "Hualpén", "Penco"];
const previsiones = ["Fonasa A", "Fonasa B", "Fonasa C", "Fonasa D", "Isapre", "Particular"];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

// Generar edad entre 0 y 10 años
const getRandomBirthDate = () => {
    const end = new Date();
    const start = new Date(end.getFullYear() - 10, end.getMonth(), end.getDate());
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function main() {
    console.log("🧹 Limpiando la base de datos (excepto Usuarios)...");
    await prisma.controlClinico.deleteMany();
    await prisma.paciente.deleteMany();
    await prisma.tutor.deleteMany();
    await prisma.profesional.deleteMany();

    console.log("👩‍⚕️ Sembrando 6 Profesionales...");
    await prisma.profesional.createMany({
        data: [
            { rut: generarRutReal(10000000, 16000000), nombre: "María", apellido: "González", estamento: "Pediatra" },
            { rut: generarRutReal(10000000, 16000000), nombre: "Camila", apellido: "Rojas", estamento: "Enfermera" },
            { rut: generarRutReal(10000000, 16000000), nombre: "Andrés", apellido: "Soto", estamento: "Nutricionista" },
            { rut: generarRutReal(10000000, 16000000), nombre: "Juan", apellido: "Pérez", estamento: "Médico General" },
            { rut: generarRutReal(10000000, 16000000), nombre: "Valentina", apellido: "Vega", estamento: "Enfermera" },
            { rut: generarRutReal(10000000, 16000000), nombre: "Daniela", apellido: "Torres", estamento: "Fonoaudióloga" },
        ]
    });

    console.log("👨‍👩‍👧 Sembrando 60 Tutores...");
    const tutorIds: number[] = [];
    for (let i = 1; i <= 60; i++) {
        const tutor = await prisma.tutor.create({
            data: {
                rut: generarRutReal(12000000, 22000000),
                nombre: Math.random() > 0.2 ? getRandom(nombresNinas) : getRandom(nombresNinos), // 80% mamás
                apellido: getRandom(apellidosList),
                telefono: `+569${Math.floor(10000000 + Math.random() * 90000000)}`,
                parentesco: Math.random() > 0.2 ? "Madre" : "Padre",
                direccion: `Calle Ficticia ${100 + i}`,
                sector: "Sector Central",
                comuna: getRandom(comunas),
            }
        });
        tutorIds.push(tutor.id_tutor); 
    }

    console.log("👶 Sembrando 110 Pacientes con casuísticas clínicas...");
    let pacientesCreados = 0;
    
    for (let i = 1; i <= 110; i++) {
        const esNiño = Math.random() > 0.5;
        const nombreBase = esNiño ? getRandom(nombresNinos) : getRandom(nombresNinas);
        const apellidoBase = getRandom(apellidosList);
        
        // --- CASUÍSTICAS CLÍNICAS ---
        const esTrans = Math.random() < 0.05;       // 5% de la población (aprox 5-6 niños)
        const esSename = Math.random() < 0.05;      // 5% de la población (aprox 5-6 niños)
        const esPrematuro = Math.random() < 0.12;   // 12% prematuros (aprox 13 niños)
        const esMigrante = Math.random() < 0.10;    // 10% migrantes (aprox 11 niños)

        // Al elegir un tutor al azar de una lista de 60 para 110 niños, forzamos hermanos
        const randomTutorId = getRandom(tutorIds);

        // Lógica para niñeces Trans
        let nombreSocial = null;
        let identidadGenero = null;
        if (esTrans) {
            nombreSocial = esNiño ? getRandom(nombresNinas) : getRandom(nombresNinos);
            identidadGenero = esNiño ? "Femenino (Trans)" : "Masculino (Trans)";
        }

        // RUTs modernos para niños, o 100 millones para migrantes
        const rutNiño = esMigrante && Math.random() > 0.5 
            ? generarRutReal(100000000, 100999999) 
            : generarRutReal(24000000, 27500000);

        await prisma.paciente.create({
            data: {
                rut: rutNiño,
                nombre: nombreBase,
                apellido: apellidoBase,
                nombre_social: nombreSocial,
                fecha_nacimiento: getRandomBirthDate(),
                sexo_biologico: esNiño ? "Masculino" : "Femenino",
                identidad_genero: identidadGenero,
                nacionalidad: esMigrante ? getRandom(["Venezolana", "Haitiana", "Colombiana", "Peruana"]) : "Chilena",
                direccion: `Calle Ficticia ${100 + randomTutorId}`, // Hereda la dirección del tutor
                sector: "Sector Central",
                comuna: getRandom(comunas),
                nhc: `NHC-${i * 10}`,
                prevision: getRandom(previsiones),
                id_tutor_principal: randomTutorId,
                
                // Aplicamos las alertas sociales
                es_sename: esSename,
                es_naneas_prematuro: esPrematuro,
                es_poblacion_trans: esTrans,
                es_migrante: esMigrante
            }
        });
        pacientesCreados++;
    }

    console.log(`✅ ¡Completado! Base de datos poblada con ${pacientesCreados} pacientes.`);
}

// Ejecutamos la función principal
main()
    .catch((e) => {
        console.error("Ocurrió un error al insertar los datos:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });