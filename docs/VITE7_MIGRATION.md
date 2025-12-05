# Vite 7 Migration Notes

## Overview

This project was upgraded from Vite 5.4.21 to Vite 7.2.6. This document outlines the breaking changes, requirements, and what was verified during the migration.

## Breaking Changes

### Node.js Requirements

**Critical:** Vite 7 requires Node.js 20.19+ or 22.12+. Node.js 18 is no longer supported (EOL reached).

- **Action Taken:** Updated `.github/workflows/deploy.yml` to use `node-version: '20.19'`
- **Verification:** CI/CD pipeline uses Node.js 20.19
- **Reference:** [Vite 7.0 Release Notes](https://vite.dev/guide/migration)

### Browser Targets

The default browser target changed from `'modules'` to `'baseline-widely-available'` (browsers released before 2022-11-01).

- **Impact:** May result in larger bundle sizes for older browser support
- **Action Taken:** Using default browser target (no explicit configuration)
- **Testing:** Verify build output size and test on target browsers

### Sass API

The legacy Sass API has been removed. Only the modern API is supported.

- **Status:** No Sass usage detected in this project
- **Action Required:** None

### Deprecated Features

- `splitVendorChunkPlugin` has been removed entirely
- **Status:** Not used in this project
- **Action Required:** None

## Migration Checklist

- [x] Updated Node.js version in CI/CD to 20.19
- [x] Verified build process works with Vite 7
- [ ] Tested on all target browsers
- [ ] Verified bundle size hasn't significantly increased
- [ ] Confirmed no Sass preprocessor issues

## Testing Recommendations

1. **Browser Compatibility:** Run full regression tests on all supported browsers
2. **Build Size:** Compare build output size before/after migration
3. **Performance:** Verify no performance regressions in development or production builds
4. **Dependencies:** Ensure all Vite plugins are compatible with Vite 7

## Resources

- [Vite 7 Migration Guide](https://vite.dev/guide/migration)
- [Vite 7.0 Release Notes](https://github.com/vitejs/vite/releases/tag/v7.0.0)
- [Node.js Version Support](https://nodejs.org/en/about/releases/)

## Date

Migration completed: January 2025

## Related Documentation

- [CHANGELOG.md](../CHANGELOG.md) - Full changelog of all changes
- [Local Docker Build Guide](./LOCAL_DOCKER_BUILD.md) - Docker build instructions
