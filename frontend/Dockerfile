# Stage 1: Build Angular Application
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve Angular SPA on internal Docker network port 4200
FROM nginx:1.27-alpine

COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/gestionale-ente-frontend/browser /usr/share/nginx/html

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
