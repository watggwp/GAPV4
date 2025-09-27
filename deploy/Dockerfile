FROM node:20-slim

ENV NODE_ENV=production

ARG STAGE

RUN npm install pm2 -g

WORKDIR /app

ENV REACT_APP_API_PORT=8080

COPY package.json package-lock.json ./
RUN npm install --production

COPY ./server /app/server
COPY ./.env /app/.env
COPY ./deploy/builds/${STAGE} /app/build
COPY ./app/src/assets /app/app/src/assets

ENTRYPOINT [ "npm", "run" , "server-docker" ]