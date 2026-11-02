# ========================================================
# Wi-Fi Captive Portal Frontend - Production Dockerfile
# Multi-stage build: Node.js 20 build -> Nginx Alpine serve
# ========================================================

# Stage 1: Build React static assets
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Stage 2: Minimal Production Web Server
FROM nginx:1.27-alpine

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts and custom nginx configuration
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
