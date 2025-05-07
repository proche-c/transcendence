FROM node:18-slim

# Install build tools and Python for node-gyp + sqlite3
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Set up app directory
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app

# Copy package files and install dependencies
COPY --chown=node:node package*.json ./
USER node
RUN npm install

# Install specific packages required
RUN npm list @fastify/jwt || npm install @fastify/jwt
RUN npm list bcrypt || npm install bcrypt
RUN npm install \
    fastify-passport \
    @fastify/oauth2 \
    fastify-secure-session \
    dotenv \
    @fastify/static \
    speakeasy \
    qrcode \
    zod

# Copy remaining source code
COPY --chown=node:node . .

# Setup entrypoint
USER root
COPY --chown=node:node entrypoint.sh /home/node/app/entrypoint.sh
RUN chmod +x /home/node/app/entrypoint.sh

# Ensure SQLite dir permissions
RUN mkdir -p /home/node/app/sqlite_data && chown -R node:node /home/node/app/sqlite_data

USER node
EXPOSE 8000
ENTRYPOINT ["/home/node/app/entrypoint.sh"]
CMD ["node", "server.js"]
