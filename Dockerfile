FROM node:12

ENV NODE_ENV=production
RUN apt install pandoc
RUN npm install
CMD "npm run start"
