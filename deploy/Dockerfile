FROM node:20-slim

ENV NODE_ENV=production

RUN npm install pm2 -g

WORKDIR /app

ENV REACT_APP_API_PORT=8080

COPY package.json package-lock.json ./
RUN npm install --production

COPY ./build ./server ./env /app/

ENTRYPOINT [ "npm", "run" , "server" ]