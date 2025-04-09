// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export async function checkRateLimit(
  key: string,
  limit: number,
  window: number,
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

  constructor(limit: number = 1, window: number = 100) {
    this.requests = new Map();
    this.limit = limit;
    this.window = window;
  }

  public check(ip: string): boolean {
    const now = Date.now();
    const request = this.requests.get(ip);

    if (!request) {
      this.requests.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (now - request.timestamp > this.window) {
      this.requests.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (request.count >= this.limit) {
      return false;
    }

    this.requests.set(ip, { count: request.count + 1, timestamp: request.timestamp });
    return true;
  }

  public reset(): void {
    this.requests.clear();
  }
} 