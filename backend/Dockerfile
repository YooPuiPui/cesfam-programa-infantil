# 1. Usar la instancia de Ubuntu solicitada
FROM ubuntu:22.04

# 2. Actualizar el sistema e instalar Node.js (Tu código corregido)
RUN apt-get update
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# 3. Definir la carpeta de trabajo dentro del contenedor
WORKDIR /app

# 4. Copiar los archivos de dependencias
COPY package*.json ./

# 5. Instalar las dependencias de React/Vite
RUN npm install

# 6. Copiar el resto del código del frontend
COPY . .

# 7. Exponer el puerto de Vite
EXPOSE 5173

# 8. Comando clave para iniciar Vite y permitir que se vea desde fuera del contenedor
CMD ["npm", "run", "dev", "--", "--host"]