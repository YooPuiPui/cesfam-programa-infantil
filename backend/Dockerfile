# 1. Usar la instancia de Ubuntu solicitada
FROM ubuntu:22.04

# 2. Actualizar el sistema e instalar Node.js
RUN apt-get update
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# 3. Carpeta de trabajo
WORKDIR /app

# 4. Copiar los archivos de dependencias
COPY package*.json ./

# 5. Instalar las dependencias del BACKEND (Express, Prisma, TypeScript, etc.)
RUN npm install

# 6. Copiar el resto del código del backend
COPY . .

# 7. Regenerar el Prisma Client para este contenedor (Linux),
#    por si el paso anterior copió un node_modules de otro sistema operativo
RUN npx prisma generate

# 8. Preparar el script de arranque (normaliza saltos de línea por si se editó en Windows)
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# 9. Exponer el puerto del Backend
EXPOSE 3000

# 10. Comando para iniciar: aplica migraciones, siembra datos si está vacío, y arranca el server
CMD ["/app/docker-entrypoint.sh"]