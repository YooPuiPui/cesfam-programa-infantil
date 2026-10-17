// Script de administración para crear un usuario del sistema (o cambiarle la
// contraseña a uno que ya existe). Reemplaza al antiguo registro público
// (POST /auth/registro), que fue eliminado de la API.
//
// Uso (desde /backend):
//   npx ts-node scripts/crear-usuario.ts
//
// Pregunta de forma interactiva, paso a paso: RUT, nombre completo, cargo/rol
// y contraseña. La contraseña se escribe sin eco en pantalla y se pide dos
// veces. Por seguridad NO se acepta por argumentos de línea de comandos ni por
// variables de entorno. Si el RUT ya existe, ofrece cambiar solo su contraseña.
//
// No es una ruta de la API ni se conecta a ningún botón de la interfaz.
// Se ejecuta a mano, desde la terminal del servidor.

import 'dotenv/config';
import * as readline from 'readline';
import { Writable } from 'stream';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROL_POR_DEFECTO = 'Profesional';
const LARGO_MINIMO_CLAVE = 8;
const LINEA = '==========================================';

// Todo lo que readline escribe pasa por esta salida; mientras `silenciado`
// sea true no se muestra nada, así la contraseña no queda en pantalla.
let silenciado = false;
const salida = new Writable({
    write(chunk, encoding, callback) {
        if (!silenciado) process.stdout.write(chunk, encoding as BufferEncoding);
        callback();
    },
});

const rl = readline.createInterface({ input: process.stdin, output: salida, terminal: true });
rl.on('SIGINT', () => rl.close());

class OperacionCancelada extends Error {}

function preguntar(texto: string, oculto = false): Promise<string> {
    return new Promise((resolve, reject) => {
        const alCerrar = () => reject(new OperacionCancelada());
        rl.once('close', alCerrar);

        // El texto de la pregunta se escribe directo a la consola (no por `salida`)
        // para que siempre se vea, incluso al pedir la contraseña.
        process.stdout.write(texto);
        silenciado = oculto;
        rl.question('', (respuesta) => {
            silenciado = false;
            rl.off('close', alCerrar);
            if (oculto) process.stdout.write('\n'); // el Enter no se mostró
            resolve(respuesta);
        });
    });
}

// Encabezado de cada paso, para que se entienda qué se está pidiendo.
function paso(numero: number, titulo: string, ayuda: string[] = []) {
    console.log(`\n------------------------------------------`);
    console.log(` PASO ${numero}: ${titulo}`);
    console.log(`------------------------------------------`);
    for (const linea of ayuda) console.log(`  ${linea}`);
}

// Deja el RUT como lo guarda el sistema: sin puntos, con guion y K mayúscula.
// Devuelve null si el formato es inválido o el dígito verificador no calza.
function normalizarRut(valor: string): string | null {
    const limpio = valor.toUpperCase().replace(/[.\s-]/g, '');
    if (!/^\d{6,8}[0-9K]$/.test(limpio)) return null;

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);

    // Módulo 11: se multiplica cada dígito (de derecha a izquierda) por 2,3,4,5,6,7,2,3...
    let suma = 0;
    let factor = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * factor;
        factor = factor === 7 ? 2 : factor + 1;
    }
    const resto = 11 - (suma % 11);
    const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);

    return dv === dvEsperado ? `${cuerpo}-${dv}` : null;
}

async function pedirRut(): Promise<string> {
    paso(1, 'RUT del usuario', [
        'Escríbelo con o sin puntos y guion; el sistema lo ordena solo.',
        'Ejemplos: 12345678-5  /  12.345.678-5  /  123456785',
    ]);
    while (true) {
        const rut = normalizarRut(await preguntar('\n> RUT: '));
        if (rut) return rut;
        console.log('  x RUT inválido: revisa el formato y el dígito verificador.');
    }
}

async function pedirTextoObligatorio(texto: string): Promise<string> {
    while (true) {
        const valor = (await preguntar(texto)).trim();
        if (valor) return valor;
        console.log('  x Este dato es obligatorio.');
    }
}

async function pedirClave(numeroPaso: number): Promise<string> {
    paso(numeroPaso, 'Contraseña', [
        `Mínimo ${LARGO_MINIMO_CLAVE} caracteres. Se pide dos veces para evitar errores.`,
        'IMPORTANTE: al escribirla NO verás nada en pantalla (ni asteriscos).',
        'Es normal: escribe igual y presiona Enter.',
    ]);
    while (true) {
        const clave = await preguntar('\n> Contraseña: ', true);
        if (clave.length < LARGO_MINIMO_CLAVE) {
            console.log(`  x La contraseña debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`);
            continue;
        }
        const repetida = await preguntar('> Repite la contraseña: ', true);
        if (clave !== repetida) {
            console.log('  x Las contraseñas no coinciden. Inténtalo de nuevo.');
            continue;
        }
        return clave;
    }
}

async function main() {
    if (!process.stdin.isTTY) {
        console.error('Este script necesita una terminal interactiva para pedir la contraseña de forma oculta.');
        process.exitCode = 1;
        return;
    }

    console.log(LINEA);
    console.log('   CREAR USUARIO / CAMBIAR CONTRASEÑA');
    console.log(LINEA);
    console.log('Te iré pidiendo los datos paso a paso.');
    console.log('Para cancelar en cualquier momento presiona Ctrl+C (no se guarda nada).');

    const rut = await pedirRut();
    const existente = await prisma.usuario.findUnique({ where: { rut } });

    if (existente) {
        paso(2, 'Este usuario ya existe', [
            `RUT:    ${rut}`,
            `Nombre: ${existente.nombre}`,
            `Rol:    ${existente.rol}`,
            'Solo se puede cambiar su contraseña (el nombre y el rol no se tocan).',
        ]);
        const respuesta = (await preguntar('\n> ¿Cambiar su contraseña? Escribe s (sí) o n (no): ')).trim().toLowerCase();
        if (respuesta !== 's' && respuesta !== 'si' && respuesta !== 'sí') {
            console.log('\nNo se hizo ningún cambio.');
            return;
        }

        const clave = await pedirClave(3);
        await prisma.usuario.update({
            where: { rut },
            data: { password: await bcrypt.hash(clave, 10) },
        });
        console.log(`\n${LINEA}`);
        console.log(` LISTO. Se cambió la contraseña de ${existente.nombre} (${rut}).`);
        console.log(LINEA);
        return;
    }

    console.log(`\n  OK. El RUT ${rut} no existe todavía: se creará un usuario nuevo.`);

    paso(2, 'Nombre completo', ['Ejemplo: María González Pérez']);
    const nombre = await pedirTextoObligatorio('\n> Nombre completo: ');

    paso(3, 'Cargo / rol', [
        'Ejemplos: Médico, Enfermera, Nutricionista, Matrona.',
        `Si no escribes nada y presionas Enter, se usa "${ROL_POR_DEFECTO}".`,
    ]);
    const rol = (await preguntar('\n> Cargo/rol: ')).trim() || ROL_POR_DEFECTO;

    const clave = await pedirClave(4);

    await prisma.usuario.create({
        data: { rut, nombre, rol, password: await bcrypt.hash(clave, 10) },
    });
    console.log(`\n${LINEA}`);
    console.log(' LISTO. Usuario creado:');
    console.log(`     RUT:    ${rut}`);
    console.log(`     Nombre: ${nombre}`);
    console.log(`     Rol:    ${rol}`);
    console.log(' Ya puede iniciar sesión con su RUT y la contraseña ingresada.');
    console.log(LINEA);
}

main()
    .catch((error) => {
        if (error instanceof OperacionCancelada) {
            console.log('\n\nOperación cancelada. No se guardó nada.');
        } else {
            console.error('Error al crear el usuario:', error);
        }
        process.exitCode = 1;
    })
    .finally(async () => {
        rl.close();
        await prisma.$disconnect();
    });
