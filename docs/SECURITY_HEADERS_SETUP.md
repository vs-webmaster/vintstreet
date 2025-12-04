# Security Headers Setup Guide

## Overview

This document explains how to configure security headers for the VintStreet application in Google Cloud Run.

## Security Headers Configuration

The application uses comprehensive security headers defined in `security-headers.json`.

### Headers Explained

1. **X-Frame-Options: DENY**
   - Prevents clickjacking attacks
   - Blocks the site from being embedded in iframes

2. **X-Content-Type-Options: nosniff**
   - Prevents MIME-sniffing attacks
   - Forces browser to respect declared content types

3. **Strict-Transport-Security (HSTS)**
   - Forces HTTPS connections
   - `max-age=31536000` = 1 year
   - `includeSubDomains` = applies to all subdomains
   - `preload` = eligible for browser preload lists

4. **X-XSS-Protection**
   - Legacy XSS protection (modern browsers use CSP)
   - Enables browser's built-in XSS filter

5. **Referrer-Policy**
   - Controls referrer information sent with requests
   - `strict-origin-when-cross-origin` = sends origin for same-origin, nothing for cross-origin downgrades

6. **Permissions-Policy**
   - Controls browser features/APIs
   - Disables geolocation, microphone, camera

7. **Content-Security-Policy (CSP)**
   - Most important security header
   - Prevents XSS, injection attacks
   - Whitelist approach for loading resources

## Implementation for Cloud Run

### Option 1: Using Cloud Run Service YAML

Create `cloud-run-service.yaml`:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: vintstreet
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/ingress: all
    spec:
      containers:
      - image: gcr.io/PROJECT_ID/vintstreet:latest
        env:
        - name: RESPONSE_HEADERS
          value: |
            X-Frame-Options: DENY
            X-Content-Type-Options: nosniff
            Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
            X-XSS-Protection: 1; mode=block
            Referrer-Policy: strict-origin-when-cross-origin
```

Deploy:
```bash
gcloud run services replace cloud-run-service.yaml
```

### Option 2: Using Express Middleware (Recommended)

If you add Express.js for serving:

```bash
npm install express helmet
```

Update `server.js`:

```javascript
import express from 'express';
import helmet from 'helmet';
import { readFileSync } from 'fs';

const app = express();

// Apply security headers using helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.supabase.co", "https://*.algolia.net", "https://*.agora.io", "wss://*.agora.io", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
  })
);

// Serve static files
app.use(express.static('dist'));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile('dist/index.html', { root: '.' });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

Update `Dockerfile`:

```dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built app and server
COPY dist ./dist
COPY server.js ./

# Switch to non-root user
USER nodejs

EXPOSE 8080

CMD ["node", "server.js"]
```

### Option 3: Using serve with custom headers

Update `serve.json`:

```json
{
  "headers": [
    {
      "source": "**/*",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## Testing Security Headers

### Local Testing

```bash
# Start local server
npm run dev

# Test headers (in another terminal)
curl -I http://localhost:8080
```

### Production Testing

```bash
# Test deployed app
curl -I https://your-app.run.app

# Or use online tools
# https://securityheaders.com/
# https://observatory.mozilla.org/
```

### Expected Response Headers

```
HTTP/2 200 
x-frame-options: DENY
x-content-type-options: nosniff
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'self'; ...
```

## Troubleshooting

### CSP Blocking Resources

If Content-Security-Policy blocks legitimate resources:

1. Check browser console for CSP violations
2. Update CSP directives in `security-headers.json`
3. Test thoroughly after changes

### HSTS Issues

If you need to disable HSTS temporarily:

1. Clear browser HSTS cache
   - Chrome: `chrome://net-internals/#hsts`
   - Firefox: Clear site data in developer tools
2. Remove HSTS header
3. Wait for max-age to expire

## Security Checklist

- [ ] All security headers configured
- [ ] Headers tested locally
- [ ] Headers tested in production
- [ ] CSP allows all necessary resources
- [ ] CSP blocks unwanted resources
- [ ] HSTS configured correctly
- [ ] Headers score 90+ on securityheaders.com
- [ ] No console warnings about blocked resources

## Monitoring

Monitor for CSP violations:

```javascript
// Add to main.tsx
window.addEventListener('securitypolicyviolation', (e) => {
  // Log to error tracking service
  console.error('CSP Violation:', {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy,
  });
  
  // Send to monitoring service
  // Sentry.captureException(e);
});
```

## Resources

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [Security Headers Scanner](https://securityheaders.com/)

