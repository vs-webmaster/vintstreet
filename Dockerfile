# Use Node.js LTS
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm ci for deterministic builds
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

<<<<<<< HEAD
<<<<<<< Updated upstream
# Serve the app with a lightweight web server
FROM node:20-alpine
=======
# Production stage
FROM node:18-alpine
=======
# Production stage
FROM node:20-alpine
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
WORKDIR /app

# Install serve as non-root user
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Cloud Run listens on port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["serve", "-s", "dist", "-l", "8080"]
