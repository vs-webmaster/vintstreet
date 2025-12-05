# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **BREAKING**: Upgraded from Vite 5.4.21 to Vite 7.2.6
  - Requires Node.js 20.19+ or 22.12+ (Node.js 18 no longer supported)
  - Browser target changed to `baseline-widely-available` (browsers released before 2022-11-01)
  - See [Vite 7 Migration Guide](./docs/VITE7_MIGRATION.md) for details
- Updated CI/CD workflow to use Node.js 20.19
- Changed Docker build architecture: dist folder is now built in CI/CD and passed as artifact
  - Secrets are no longer passed as Docker build args (security improvement)
  - For local Docker builds, run `npm run build` before `docker build`
  - See [Local Docker Build Guide](./docs/LOCAL_DOCKER_BUILD.md) for details

### Fixed
- Fixed favicon path: moved from `src/assets/favicon.ico` to `public/favicon.ico` for proper production builds
- Improved Dockerfile health check: replaced `node -e` with `curl` for better security scanning compatibility
- Fixed TypeScript type safety in BlogPage: replaced `unknown` types with proper `BlogCategory` and `BlogPostWithCategory` types

### Added
- Added Vite 7 migration documentation in `docs/VITE7_MIGRATION.md`
- Added local Docker build documentation in `docs/LOCAL_DOCKER_BUILD.md`
- Added documentation comments to `.dockerignore` explaining build process

### Security
- Removed secrets from Docker build args (now only used in CI/CD build step)
- Improved Dockerfile health check security pattern

## [Previous Versions]

Previous changelog entries were not maintained. This changelog starts from the Vite 7 upgrade.
