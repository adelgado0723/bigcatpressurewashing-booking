// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  get(key: string): string | undefined;
}

export const env: Env = {
  get: (key: string): string | undefined => {
    return Deno.env.get(key);
  }
};

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

/**
 * Normalizes an IP address for consistent rate limiting
 * Handles IPv4, IPv6, and X-Forwarded-For headers
 */
function normalizeIp(ip: string): string {
  // If it's an X-Forwarded-For header, take the first IP
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Remove any port numbers
  ip = ip.split(':')[0];

  return ip;
}

/**
 * Creates a rate limit key combining domain and IP
 */
function createRateLimitKey(domain: string, ip: string): string {
  return `${domain}:${normalizeIp(ip)}`;
}

export async function checkRateLimit(
  key: string,
  limit: number = 60,  // Default: 60 requests
  window: number = 60000,  // Default: per minute
  supabaseClient: SupabaseClient
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - window;

  const { data, error } = await supabaseClient
    .from('rate_limits')
    .select('count')
    .eq('key', key)
    .gte('timestamp', new Date(windowStart).toISOString())
    .single();

  if (error) {
    // In case of database error, allow the request but with full limit
    // This prevents blocking legitimate users due to database issues
    return { allowed: true, remaining: limit, reset: now + window };
  }

  const count = data?.count ?? 0;
  const remaining = Math.max(0, limit - count);
  const reset = now + window;

  if (count >= limit) {
    return { allowed: false, remaining, reset };
  }

  // Update or insert rate limit record
  await supabaseClient
    .from('rate_limits')
    .upsert({
      key,
      count: count + 1,
      timestamp: new Date().toISOString()
    });

  return { allowed: true, remaining: remaining - 1, reset };
}

// Rate limiter implementation
export class RateLimiter {
  private requests: Map<string, { count: number; timestamp: number }>;
  private readonly limit: number;
  private readonly window: number;

  /**
   * Creates a new RateLimiter instance
   * @param limit Maximum number of requests allowed within the window (default: 60)
   * @param window Time window in milliseconds (default: 60000 = 1 minute)
   */
  constructor(limit: number = 60, window: number = 60000) {
    this.requests = new Map();
    this.limit = limit;
    this.window = window;
  }

  /**
   * Checks if a request from the given IP should be allowed
   * @param ip The IP address or X-Forwarded-For header
   * @returns true if the request is allowed, false if it should be blocked
   */
  public check(ip: string): boolean {
    const normalizedIp = normalizeIp(ip);
    const now = Date.now();
    const request = this.requests.get(normalizedIp);

    if (!request) {
      this.requests.set(normalizedIp, { count: 1, timestamp: now });
      return true;
    }

    if (now - request.timestamp > this.window) {
      this.requests.set(normalizedIp, { count: 1, timestamp: now });
      return true;
    }

    if (request.count >= this.limit) {
      return false;
    }

    this.requests.set(normalizedIp, { count: request.count + 1, timestamp: request.timestamp });
    return true;
  }

  /**
   * Resets all rate limiting counters
   * Useful after deployments or server restarts
   */
  public reset(): void {
    this.requests.clear();
  }
} 