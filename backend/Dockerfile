FROM node:20-slim

# Install system dependencies for native builds and SQLite
RUN apt-get update && \
    apt-get install -y sqlite3 build-essential python3 python3-distutils

# Create app directory
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app

# Copy package files
COPY --chown=node:node package*.json ./

# Use node user
USER node

# Install dependencies
RUN npm install

# Copy rest of the code
COPY --chown=node:node . .

# Switch to root to copy entrypoint
USER root
COPY --chown=node:node entrypoint.sh /home/node/app/entrypoint.sh
RUN chmod +x /home/node/app/entrypoint.sh

# SQLite data dir
RUN mkdir -p /home/node/app/sqlite_data && \
    chown -R node:node /home/node/app/sqlite_data

# Back to node user
USER node

EXPOSE 8000
ENTRYPOINT ["/home/node/app/entrypoint.sh"]
CMD ["node", "server.js"]
