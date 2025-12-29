# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend/ ./
RUN npm run build

# Stage 2: Backend
FROM node:20-alpine as build
WORKDIR /app

# ติดตั้ง backend dependencies
COPY ./backend/package*.json ./
RUN npm install

# Copy backend source code
COPY ./backend/ ./

# Copy frontend build (Vite outputs to `dist` by default)
COPY --from=frontend-build /frontend/dist ./public

EXPOSE 5000
CMD ["node", "server.js"]