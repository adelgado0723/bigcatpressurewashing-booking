import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

declare global {
  interface DenoEnv {
    get(key: string): string | undefined;
  }

  const env: DenoEnv;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private requests: Map<string, number[]>;
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.requests = new Map();
    this.config = config;
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    let requestTimestamps = this.requests.get(key) || [];

    // Filter out old requests
    requestTimestamps = requestTimestamps.filter(timestamp => timestamp > windowStart);

    // Check if rate limit is exceeded
    if (requestTimestamps.length >= this.config.maxRequests) {
      return true;
    }

    // Add current request
    requestTimestamps.push(now);
    this.requests.set(key, requestTimestamps);

    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const rateLimiter = new RateLimiter({
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  });

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

  if (rateLimiter.isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}); 