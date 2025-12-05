# Local Docker Build Guide

This guide explains how to build and run the VintStreet application using Docker locally.

## Overview

The Docker build process has been optimized for security and CI/CD integration:

- **Build Stage**: The application is built in CI/CD with all environment variables
- **Docker Stage**: Only the pre-built `dist` folder is copied into the Docker image
- **Security**: No secrets are passed as Docker build arguments

## Prerequisites

- Docker installed and running
- Node.js 20.19+ (for building the application)
- All environment variables configured in `.env` file

## Local Docker Build Process

### Step 1: Build the Application

First, build the application locally to generate the `dist` folder:

```bash
# Install dependencies (if not already done)
npm install

# Build the application with your environment variables
npm run build
```

**Important**: The build process requires all environment variables to be set. Make sure your `.env` file contains:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_AGORA_APP_ID`
- `VITE_ALGOLIA_APP_ID`
- `VITE_ALGOLIA_SEARCH_API_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
- (And other optional variables as needed)

### Step 2: Verify dist Folder

Ensure the `dist` folder exists and contains the built files:

```bash
# Check if dist folder exists
ls -la dist/

# On Windows PowerShell
Test-Path dist
```

### Step 3: Build Docker Image

Build the Docker image:

```bash
docker build -t vintstreet:local .
```

The Dockerfile will:
1. Use Node.js 20 Alpine as base image
2. Install `curl` for health checks and `serve` for static file serving
3. Copy the pre-built `dist` folder
4. Run as non-root user for security
5. Expose port 8080

### Step 4: Run the Container

Run the Docker container:

```bash
docker run -p 8080:8080 vintstreet:local
```

The application will be available at `http://localhost:8080`

## Troubleshooting

### Error: "dist folder is missing or empty"

**Solution**: Run `npm run build` before building the Docker image.

```bash
npm run build
docker build -t vintstreet:local .
```

### Error: "Environment variables not found"

**Solution**: Ensure your `.env` file exists in the project root with all required variables. The build process needs these variables at build time (not runtime) because Vite embeds them in the bundle.

### Error: "Port 8080 already in use"

**Solution**: Use a different port:

```bash
docker run -p 3000:8080 vintstreet:local
```

Then access the application at `http://localhost:3000`

### Health Check Failing

The Docker health check uses `curl` to verify the application is running. If it fails:

1. Check container logs: `docker logs <container-id>`
2. Verify the application is responding: `curl http://localhost:8080`
3. Check if port 8080 is correctly exposed

## CI/CD vs Local Builds

### CI/CD Process (GitHub Actions)

1. **Build Job**: Runs `npm run build` with secrets from GitHub Secrets
2. **Artifact Upload**: Uploads `dist` folder as artifact
3. **Docker Build Job**: Downloads artifact and builds Docker image
4. **Deploy**: Pushes to container registry and deploys to Cloud Run

### Local Build Process

1. **Manual Build**: You run `npm run build` with your local `.env` file
2. **Docker Build**: Dockerfile copies the local `dist` folder
3. **Run**: You run the container locally

## Why This Architecture?

### Security Benefits

- **No Secrets in Docker**: Secrets are only used during the build step, never in Docker build args
- **Smaller Attack Surface**: Docker image doesn't contain build tools or source code
- **Non-Root User**: Container runs as non-root user for better security

### Build Benefits

- **Faster Docker Builds**: No need to install dependencies or build in Docker
- **Consistent Builds**: Same build process in CI/CD and locally
- **Better Caching**: Docker layer caching works better with pre-built artifacts

## Advanced Usage

### Build with Custom Tag

```bash
docker build -t vintstreet:v1.0.0 .
```

### Run with Environment Variables (if needed for runtime)

```bash
docker run -p 8080:8080 \
  -e PORT=8080 \
  vintstreet:local
```

### View Container Logs

```bash
docker logs <container-id>
# Or if running in foreground, logs appear in terminal
```

### Stop Container

```bash
# Find container ID
docker ps

# Stop container
docker stop <container-id>
```

## Related Documentation

- [Vite 7 Migration Guide](./VITE7_MIGRATION.md) - Information about the Vite upgrade
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md) - Production deployment guide
- [README.md](../README.md) - General project documentation
