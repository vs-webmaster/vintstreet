# Security Fix: Removed Secrets from Docker Build Args

## Critical Issue Identified

Previously, API keys and secrets were being passed as Docker build arguments (`--build-arg`), which permanently embedded them in Docker image layers. Anyone with access to the Docker image could extract these secrets using `docker history <image>` or by inspecting the image layers.

**Vulnerability:** Secrets exposed in Docker image layers

## Solution Implemented

Changed the build process to use the pre-built `dist` folder from CI/CD instead of rebuilding inside Docker.

### Changes Made

1. **Dockerfile** - Removed build stage entirely
   - No longer accepts build arguments
   - Simply copies the pre-built `dist` folder
   - No secrets are ever passed to Docker

2. **GitHub Actions Workflow** - Removed build args from docker build
   - Secrets are only used in the `build-and-test` job where they're secure
   - No secrets passed to Docker build command

### Security Benefits

✅ **No secrets in Docker layers** - Secrets are never passed as build arguments  
✅ **Faster builds** - No need to rebuild in Docker (already built in CI/CD)  
✅ **Simpler architecture** - Uses existing build artifact workflow  
✅ **Same functionality** - Environment variables are still embedded in the JS bundle (as required by Vite)  

### How It Works

1. **build-and-test job** builds the app with environment variables (secrets used securely in CI/CD)
2. **Build artifact** (dist folder) is uploaded with embedded environment variables
3. **build-and-push job** downloads the pre-built dist folder
4. **Docker build** simply copies the dist folder - no rebuild, no secrets needed

### Verification

To verify secrets are not in the Docker image:

```bash
# This should NOT show any secrets
docker history <image-name>

# Inspect image layers
docker inspect <image-name>
```

## References

- [Docker Security Best Practices](https://docs.docker.com/build/best-practices/)
- [OWASP Docker Security](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

