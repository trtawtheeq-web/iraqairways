FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p /data

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "index.js"]
