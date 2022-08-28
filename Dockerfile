FROM node
COPY . ./app
WORKDIR ./app
RUN npm install --save-dev
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
