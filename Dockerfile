# Production stage - uses pre-built dist folder from CI/CD
# No build step, no secrets passed as build args
FROM node:20-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install serve as non-root user
RUN npm install -g serve

# Copy pre-built dist folder (built in CI/CD with environment variables)
# The dist folder is downloaded from build artifacts in the workflow
COPY --chown=nodejs:nodejs dist ./dist

# Switch to non-root user
USER nodejs

# Cloud Run listens on port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["serve", "-s", "dist", "-l", "8080"]
