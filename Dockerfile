FROM arm32v7/node:current-alpine
WORKDIR /app
COPY package*.json ./
COPY *.js .
RUN npm install --production
EXPOSE 5000
CMD ["node", "temp-agent.js"]
