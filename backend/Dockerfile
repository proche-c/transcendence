# THIS IS THE DOCKERFILE THAT WORKS FOR ME(ANNA) ON MY MAC, BUT ITS ONLY FOR TESTING
FROM node:20-alpine

# Install build tools for native modules
RUN apk add --no-cache python3 make g++ sqlite

# Create app directory with correct permissions
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app

# Switch to node user early
USER node

# Copy package files first
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application
COPY --chown=node:node . .

# Set up entrypoint
USER root
COPY --chown=node:node entrypoint.sh /home/node/app/entrypoint.sh
RUN chmod +x /home/node/app/entrypoint.sh

# SQLite data folder permissions
RUN mkdir -p /home/node/app/sqlite_data \
  && chown -R node:node /home/node/app/sqlite_data \
  && touch /home/node/app/sqlite_data/database.sqlite \
  && chown node:node /home/node/app/sqlite_data/database.sqlite \
  && chmod 664 /home/node/app/sqlite_data/database.sqlite

USER node

EXPOSE 8000
ENTRYPOINT ["/home/node/app/entrypoint.sh"]
CMD ["node", "server.js"]
