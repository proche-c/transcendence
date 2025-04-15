FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

RUN npm install -g typescript

COPY tailwind.config.js ./

COPY . .

CMD ["npm", "run", "dev"]