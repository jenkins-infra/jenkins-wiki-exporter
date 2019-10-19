FROM node:12

ENV NODE_ENV=production
RUN apt-get update && apt-get install -y pandoc && apt-get clean
WORKDIR /usr/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
CMD ["npm","run","start"]
