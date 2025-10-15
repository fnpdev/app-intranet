FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# NÃO COPIE OS CERTIFICADOS!!!
# NÃO EXPONHA 443!!

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
