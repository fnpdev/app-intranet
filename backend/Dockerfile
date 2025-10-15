FROM node:20-alpine
WORKDIR /app
COPY .env package.json package-lock.json* yarn.lock* ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
