# Use an official Node.js image
FROM node:latest

# Install sqlite3 (required for initializing the database)
USER root
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# Create the app directory and set ownership for the node user
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

# Set the working directory
WORKDIR /home/node/app

# Copy package files
COPY --chown=node:node package*.json ./

COPY init.sql /home/node/app/init.sql
COPY seeds.sql /home/node/app/seeds.sql


# Switch to node user for installing dependencies
USER node

# Install dependencies
RUN npm install

# Copy the application source code
COPY --chown=node:node . .

# Switch back to root to copy the entrypoint and adjust its permissions
USER root
COPY --chown=node:node entrypoint.sh /home/node/app/entrypoint.sh
RUN chmod +x /home/node/app/entrypoint.sh

# Ensure required packages are installed (as node)
USER node
RUN npm list @fastify/jwt || npm install @fastify/jwt
RUN npm list bcrypt || npm install bcrypt
RUN npm install fastify-passport @fastify/oauth2 fastify-secure-session 

# Expose the port used by Fastify
EXPOSE 8000

# Use the entrypoint to prepare the database before starting the app
ENTRYPOINT ["/home/node/app/entrypoint.sh"]

# Start the app
CMD ["node", "server.js"]
