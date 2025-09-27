FROM node:20-slim

ENV NODE_ENV=production

ARG STAGE

RUN npm install pm2 -g

WORKDIR /app

ENV REACT_APP_API_PORT=8080

COPY package.json package-lock.json ./
RUN npm install --production

COPY ./server ./.env /app/
COPY ./deploy/builds/${STAGE} /app/build

ENTRYPOINT [ "npm", "run" , "server" ]