#Using an official Node.js image
FROM node:18

# Create app directory
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Definition of the working directory
WORKDIR /home/node/app

# Copy the files package.json
COPY --chown=node:node package*.json ./

# Change the user to node
USER node

# Install all dependencies
RUN npm install

# Copy the source code
COPY --chown=node:node . .

# Ensure @fastify/jwt google auth and bcrypt are installed 
RUN npm list @fastify/jwt || npm install @fastify/jwt
RUN npm list bcrypt || npm install bcrypt
RUN npm install fastify-passport @fastify/oauth2 fastify-secure-session 



# Exposing the port used by Fastify
EXPOSE 8000

# Start the app
CMD ["node", "server.js"]
