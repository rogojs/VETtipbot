FROM node:8
# create app directory on image
WORKDIR /usr/src/app
# install the dependencies
COPY package*.json ./
# re-install node_modules
RUN npm install
# copy my application's source code into the working directory
COPY . .
# run the application
CMD ["npm", "start"]