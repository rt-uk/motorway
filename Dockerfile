FROM node:14.17.0

COPY . /app

WORKDIR /app

RUN npm install --production

CMD npm start