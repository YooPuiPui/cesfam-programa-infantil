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

# 7. Exponer el puerto del Backend
EXPOSE 3000

# 8. Comando para iniciar tu servidor backend
CMD ["npm", "run", "dev"]