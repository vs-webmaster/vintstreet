/**
 * Rate Limiting Utility for Supabase Edge Functions
 * 
 * Uses Supabase built-in rate limiting and provides additional
 * per-IP and per-user rate limiting logic.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Simple in-memory rate limiter (for development)
 * In production, use Redis/Upstash for distributed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if request should be rate limited
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  
  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt),
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  // Cleanup old entries (basic memory management)
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  // Check various headers that might contain the real IP
  const headers = req.headers;
  
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('fastly-client-ip') || // Fastly
    headers.get('x-client-ip') ||
    headers.get('x-cluster-client-ip') ||
    'unknown'
  );
}

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimits = {
  // Authentication endpoints - stricter limits
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'auth',
  } as RateLimitConfig,
  
  // Payment endpoints - very strict
  PAYMENT: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'payment',
  } as RateLimitConfig,
  
  // API endpoints - moderate
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'api',
  } as RateLimitConfig,
  
  // Public endpoints - lenient
  PUBLIC: {
    maxRequests: 300,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'public',
  } as RateLimitConfig,
};

/**
 * Middleware to apply rate limiting to Edge Function
 */
export async function withRateLimit(
  req: Request,
  config: RateLimitConfig,
  handler: () => Promise<Response>
): Promise<Response> {
  const clientIP = getClientIP(req);
  const result = await checkRateLimit(clientIP, config);
  
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.resetAt.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.getTime().toString(),
        },
      }
    );
  }
  
  // Add rate limit headers to response
  const response = await handler();
  
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetAt.getTime().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Example usage in Edge Function:
 * 
 * import { withRateLimit, RateLimits } from '../_shared/rate-limit.ts';
 * 
 * Deno.serve(async (req) => {
 *   return withRateLimit(req, RateLimits.PAYMENT, async () => {
 *     // Your endpoint logic here
 *     return new Response(JSON.stringify({ success: true }));
 *   });
 * });
 */

