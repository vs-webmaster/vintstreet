# Production stage - uses pre-built dist folder from CI/CD
# No build step, no secrets passed as build args
FROM node:20-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install curl for health checks and serve as non-root user
RUN apk add --no-cache curl && \
    npm install -g serve

# Copy pre-built dist folder (built in CI/CD with environment variables)
# The dist folder is downloaded from build artifacts in the workflow
COPY --chown=nodejs:nodejs dist ./dist

# Switch to non-root user
USER nodejs

# Cloud Run listens on port 8080
EXPOSE 8080

# Health check using standard HTTP client
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080 || exit 1

CMD ["serve", "-s", "dist", "-l", "8080"]
