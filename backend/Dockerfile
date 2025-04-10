# Usamos versión específica de Node.js
FROM node:18-alpine

# Instalamos sqlite3 (en Alpine se usa apk)
RUN apk add --no-cache sqlite

# Crear directorio con permisos adecuados
RUN mkdir -p /home/node/app && \
    chown -R node:node /home/node/app

WORKDIR /home/node/app

# Copiar archivos de paquete
COPY --chown=node:node package*.json ./

# Instalar dependencias como usuario node
USER node
RUN npm install

# Copiar el resto de archivos
COPY --chown=node:node . .

# Configurar entrypoint
USER root
COPY --chown=node:node entrypoint.sh /home/node/app/entrypoint.sh
RUN chmod +x /home/node/app/entrypoint.sh

# Permisos para SQLite
RUN mkdir -p /home/node/app/sqlite_data && \
    chown -R node:node /home/node/app/sqlite_data

USER node

EXPOSE 8000
ENTRYPOINT ["/home/node/app/entrypoint.sh"]
CMD ["node", "server.js"]
