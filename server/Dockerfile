FROM node:20-bookworm-slim

# docker build -t theater_backend_staging .

WORKDIR /app
COPY package.json ./
RUN npm install
COPY server.js ./

EXPOSE 3001
CMD ["npm", "start"]
