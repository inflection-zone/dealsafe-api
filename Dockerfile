FROM node:12.20.0
RUN apt-get clean
RUN apt-get update --fix-missing
RUN apt-get install -y build-essential checkinstall curl awscli
RUN apt-get install bash

RUN node -v
RUN npm -v

ADD . /app

COPY ./entrypoint.sh /app/entrypoint.sh
 
ADD . /app/tmp/
ADD . /app/tmp/resources
ADD . /app/tmp/resources/uploads
ADD . /app/tmp/resources/downloads

ADD . /app/firebase
# ENV GOOGLE_APPLICATION_CREDENTIALS /app/firebase/fcm_adminsdk_credentials.json

WORKDIR /app

RUN npm install
RUN npm install pm2 -g
RUN npm install sequelize-cli -g
# RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["node", "index.js"]
