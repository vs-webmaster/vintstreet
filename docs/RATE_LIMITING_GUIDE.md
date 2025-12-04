# Rate Limiting Implementation Guide

## Overview

Rate limiting is implemented to protect Edge Functions from abuse, DDoS attacks, and ensure fair usage.

## Implementation

Rate limiting is available via the shared utility: `supabase/functions/_shared/rate-limit.ts`

### Quick Start

```typescript
import { withRateLimit, RateLimits } from '../_shared/rate-limit.ts';

Deno.serve(async (req) => {
  return withRateLimit(req, RateLimits.PAYMENT, async () => {
    // Your endpoint logic
    return new Response(JSON.stringify({ success: true }));
  });
});
```

## Rate Limit Configurations

### Authentication Endpoints
- **Limit:** 5 requests per 15 minutes per IP
- **Use for:** Login, signup, password reset
- **Config:** `RateLimits.AUTH`

### Payment Endpoints
- **Limit:** 10 requests per minute per IP
- **Use for:** Checkout, payment processing, refunds
- **Config:** `RateLimits.PAYMENT`

### API Endpoints
- **Limit:** 100 requests per minute per IP
- **Use for:** Standard API calls
- **Config:** `RateLimits.API`

### Public Endpoints
- **Limit:** 300 requests per minute per IP
- **Use for:** Product listings, search, public data
- **Config:** `RateLimits.PUBLIC`

## Custom Rate Limits

```typescript
import { withRateLimit } from '../_shared/rate-limit.ts';

const customLimit = {
  maxRequests: 50,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: 'custom',
};

Deno.serve(async (req) => {
  return withRateLimit(req, customLimit, async () => {
    // Your logic
  });
});
```

## Response Headers

Rate-limited responses include these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000000
```

When limit is exceeded (429 status):

```
Retry-After: 45
```

## Production Setup with Redis/Upstash

For production, replace the in-memory store with Redis:

### 1. Sign up for Upstash

https://upstash.com/

### 2. Create Redis database

### 3. Add credentials to Supabase secrets

```bash
supabase secrets set UPSTASH_REDIS_URL="redis://..."
supabase secrets set UPSTASH_REDIS_TOKEN="..."
```

### 4. Update rate-limit.ts

```typescript
import { Redis } from 'https://deno.land/x/upstash_redis@v1.22.0/mod.ts';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!,
});

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  
  // Use Redis for distributed rate limiting
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
  }
  
  if (count > config.maxRequests) {
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + ttl * 1000),
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - count,
    resetAt: new Date(now + config.windowMs),
  };
}
```

## Monitoring

Track rate limiting metrics:

1. Number of 429 responses
2. Most rate-limited IPs
3. Most rate-limited endpoints

Query in Supabase logs:

```sql
SELECT 
  status_code,
  COUNT(*) as count,
  client_ip
FROM edge_logs
WHERE status_code = 429
  AND timestamp > now() - interval '1 hour'
GROUP BY status_code, client_ip
ORDER BY count DESC
LIMIT 10;
```

## Bypass Rate Limiting (for authenticated users)

```typescript
import { withRateLimit, getClientIP } from '../_shared/rate-limit.ts';
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // Check if user is authenticated
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const authHeader = req.headers.get('Authorization');
  let identifier = getClientIP(req);
  
  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (user) {
      // Use user ID instead of IP for authenticated users
      identifier = `user:${user.id}`;
      
      // Optionally: Higher limits for authenticated users
      const config = {
        maxRequests: 1000,
        windowMs: 60 * 1000,
        keyPrefix: 'api-auth',
      };
      
      return withRateLimit(req, config, async () => {
        // Your logic
      });
    }
  }
  
  // Use standard rate limit for unauthenticated
  return withRateLimit(req, RateLimits.API, async () => {
    // Your logic
  });
});
```

## Testing

### Test rate limiting locally

```bash
# Send multiple requests
for i in {1..15}; do
  curl http://localhost:54321/functions/v1/your-function \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -v
done

# Should see 429 after limit is reached
```

### Test in CI/CD

Add rate limit tests:

```typescript
// tests/edge-functions/rate-limit.test.ts
import { assertEquals } from 'https://deno.land/std@0.208.0/testing/asserts.ts';

Deno.test('Rate limit should block after max requests', async () => {
  const url = 'http://localhost:54321/functions/v1/test';
  
  // Make requests up to limit
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url);
    assertEquals(res.status, 200);
  }
  
  // Next request should be rate limited
  const blockedRes = await fetch(url);
  assertEquals(blockedRes.status, 429);
});
```

## Security Best Practices

1. **Use IP + User ID**: Combine IP and user ID for better tracking
2. **Vary limits by endpoint**: Critical endpoints get stricter limits
3. **Monitor for attacks**: Alert on sudden spikes in 429 responses
4. **Implement exponential backoff**: On client side for retries
5. **Whitelist trusted IPs**: For internal services, monitoring tools

## Troubleshooting

### Issue: Legitimate users getting rate limited

**Solution:** 
- Increase limits for authenticated users
- Use user ID instead of IP for rate limiting
- Implement request queuing on client

### Issue: Rate limiting not working

**Check:**
- IP detection working correctly (check X-Forwarded-For header)
- Rate limit store is persisting (use Redis in production)
- Multiple instances sharing state (Redis required)

### Issue: Memory usage growing

**Solution:**
- Implement cleanup of expired entries
- Use Redis instead of in-memory store
- Set TTL on all Redis keys

## Resources

- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Upstash Redis](https://upstash.com/)
- [HTTP 429 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

