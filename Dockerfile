FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV DATA_PATH=/data/cholobet-kv.json

COPY package.json ./
COPY index.html worker.js server.js ./

EXPOSE 3000
CMD ["npm", "start"]
