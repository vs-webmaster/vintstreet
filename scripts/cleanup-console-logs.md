# Console.log Cleanup Guide

## Current State
- **351 console statements** across 136 files
- Mix of `console.log`, `console.error`, `console.warn`

## Strategy

### DO NOT Remove:
- `console.error()` in error handlers (Edge Functions)
- `console.warn()` for legitimate warnings
- Development-only debug logs (if properly gated)

### DO Remove/Replace:
- Debug `console.log()` statements
- Temporary logging for development
- Sensitive data logs

## Automated Cleanup

### Find All Console Logs:
```bash
# Count by type
grep -r "console\.log" src/ | wc -l
grep -r "console\.error" src/ | wc -l  
grep -r "console\.warn" src/ | wc -l

# Find files with the most logs
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

### Recommended Approach:

1. **Replace with proper logging library** (e.g., `pino`, `winston`)
2. **Use environment-gated logging:**

```typescript
// utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: any[]) => {
    console.error(...args); // Always log errors
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
};

// Replace:
// console.log('foo') -> logger.log('foo')
```

## Quick Wins

### Remove logs from these high-impact files:
```bash
# Files with most console statements (priority order):
src/components/dashboard/ProductEditModal.tsx (11)
src/components/dashboard/MegaMenuTab.tsx (11)
src/hooks/useAgora.tsx (12)
src/hooks/useProductSubmission.tsx (8)
src/services/shipping/shipping-utils.ts (4)
```

### ESLint Rule (Add to eslint.config.js):
```javascript
rules: {
  'no-console': ['warn', { allow: ['error', 'warn'] }],
}
```

This will:
- ✅ Allow `console.error()` and `console.warn()`
- ⚠️  Warn on `console.log()`
- Help catch new console.logs in PRs

