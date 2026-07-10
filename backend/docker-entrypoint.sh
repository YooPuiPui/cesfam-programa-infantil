#!/bin/sh
set -e

echo "🔧 Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "🔍 Verificando si la base de datos ya tiene datos..."

TIENE_DATOS=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.paciente.count()
  .then((cantidad) => {
    console.log(cantidad > 0 ? 'si' : 'no');
    process.exit(0);
  })
  .catch(() => {
    console.log('no');
    process.exit(0);
  })
  .finally(() => prisma.\$disconnect());
")

if [ "$TIENE_DATOS" = "no" ]; then
    echo "🌱 Base de datos vacía, ejecutando seed inicial..."
    npx ts-node prisma/seed.ts || echo "⚠️  El seed falló, continuando de todas formas."
else
    echo "✅ La base ya tiene datos, se omite el seed (para no sobreescribir datos existentes)."
fi

echo "🚀 Iniciando servidor..."
exec npm run dev