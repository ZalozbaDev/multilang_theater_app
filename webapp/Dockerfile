FROM node:20-bookworm-slim

# docker build -t theater_frontend_staging .

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
#RUN touch a
#RUN ls -lR /app/src/
RUN npm run build
RUN npm install -g serve
RUN chmod 755 ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
CMD ["serve", "-s", "build", "-l", "3000"]
