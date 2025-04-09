import { createClient } from '@supabase/supabase-js';

declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  window: number
): Promise<RateLimitResult> {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

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