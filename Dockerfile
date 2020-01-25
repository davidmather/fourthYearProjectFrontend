FROM node:10
LABEL maintainer = "david.mather@mycit.ie"

RUN apt-get -qq update && apt-get -qq install apt-utils wget

RUN apt-get -qq install apertium
RUN apt-get -qq install apertium-en-es


# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

