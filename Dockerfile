# Use Node.js LTS
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve the app with a lightweight web server
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist

# Cloud Run listens on port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
