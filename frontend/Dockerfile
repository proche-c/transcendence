# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copia los archivos de configuración y dependencias primero
COPY package*.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Instala dependencias
RUN npm install

# Instala Tailwind CSS CLI globalmente
RUN npm install -g tailwindcss

# Copia el resto de los archivos
COPY . .

# Puerto para desarrollo
EXPOSE 3000

# Comando por defecto (se sobrescribe en docker-compose)
CMD ["npm", "run", "dev"]