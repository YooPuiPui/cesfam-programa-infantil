import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Debug: verifica que DATABASE_URL está cargada
if (!process.env.DATABASE_URL) {
  console.error('[PRISMA] ❌ DATABASE_URL no está definida en el .env');
  console.error('[PRISMA] Variables de entorno cargadas:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  throw new Error('DATABASE_URL no está configurada en .env');
}


//* Instanciamos prisma client 
const prisma = new PrismaClient();

// Graceful shutdown - desconectar cuando la app termina
process.on('SIGINT', async () => {
    console.log('\n[PRISMA] Cerrando conexión de Prisma...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n[PRISMA] Cerrando conexión de Prisma (SIGTERM)...');
    await prisma.$disconnect();
    process.exit(0);
});

export default prisma;
