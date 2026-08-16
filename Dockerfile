FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install --production --legacy-peer-deps

COPY server/ ./
RUN mkdir -p /data

EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "index.js"]

