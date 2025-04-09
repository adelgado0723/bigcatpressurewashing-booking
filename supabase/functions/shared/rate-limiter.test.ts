// @deno-types="npm:@supabase/supabase-js@2.39.7"
import { SupabaseClient } from '@supabase/supabase-js';
import { RateLimiter, checkRateLimit } from './rate-limiter.ts';
import { assertEquals } from "std/assert/mod.ts";

// Mock Supabase client with different scenarios
class MockSupabaseClient {
  private errorMode = false;
  private highCount = false;

  constructor(options?: { errorMode?: boolean; highCount?: boolean }) {
    this.errorMode = options?.errorMode ?? false;
    this.highCount = options?.highCount ?? false;
  }

  from(_table: string) {
    return {
      select: (_column: string) => ({
        eq: (_key: string, _value: string) => ({
          gte: (_column: string, _value: string) => ({
            single: () => Promise.resolve(
              this.errorMode 
                ? { data: null, error: new Error('Database error') }
                : { data: { count: this.highCount ? 5 : 0 }, error: null }
            )
          })
        }),
        single: () => Promise.resolve(
          this.errorMode 
            ? { data: null, error: new Error('Database error') }
            : { data: { count: this.highCount ? 5 : 0 }, error: null }
        )
      }),
      upsert: (_data: unknown) => Promise.resolve(
        this.errorMode 
          ? { data: null, error: new Error('Database error') }
          : { data: null, error: null }
      )
    };
  }
}

Deno.test('RateLimiter - Basic functionality', () => {
  const rateLimiter = new RateLimiter(1, 100);
  const clientIp = '127.0.0.1';

  // First request should be allowed
  assertEquals(rateLimiter.check(clientIp), true);

  // Second request within time window should be blocked
  assertEquals(rateLimiter.check(clientIp), false);
});

Deno.test('RateLimiter - Different IPs', () => {
  const rateLimiter = new RateLimiter(1, 100);
  const ip1 = '127.0.0.1';
  const ip2 = '192.168.1.1';

  // Both IPs should be allowed initially
  assertEquals(rateLimiter.check(ip1), true);
  assertEquals(rateLimiter.check(ip2), true);

  // Both IPs should be blocked on second request
  assertEquals(rateLimiter.check(ip1), false);
  assertEquals(rateLimiter.check(ip2), false);
});

Deno.test('RateLimiter - Reset functionality', () => {
  const rateLimiter = new RateLimiter(1, 100);
  const clientIp = '127.0.0.1';

  // First request should be allowed
  assertEquals(rateLimiter.check(clientIp), true);

  // Reset the rate limiter
  rateLimiter.reset();

  // Request should be allowed again after reset
  assertEquals(rateLimiter.check(clientIp), true);
});

Deno.test('RateLimiter - Edge cases', () => {
  const rateLimiter = new RateLimiter(1, 100);

  // Test with empty IP
  assertEquals(rateLimiter.check(''), true);

  // Test with invalid IP
  assertEquals(rateLimiter.check('invalid-ip'), true);

  // Test with very long IP
  const longIp = 'x'.repeat(1000);
  assertEquals(rateLimiter.check(longIp), true);
});

Deno.test('RateLimiter - Custom limits', () => {
  const rateLimiter = new RateLimiter(3, 1000); // 3 requests per second
  const clientIp = '127.0.0.1';

  // First three requests should be allowed
  assertEquals(rateLimiter.check(clientIp), true);
  assertEquals(rateLimiter.check(clientIp), true);
  assertEquals(rateLimiter.check(clientIp), true);

  // Fourth request should be blocked
  assertEquals(rateLimiter.check(clientIp), false);
});

Deno.test('checkRateLimit - Basic functionality', async () => {
  const mockClient = new MockSupabaseClient() as unknown as SupabaseClient;
  const result = await checkRateLimit('test-key', 1, 100, mockClient);
  
  assertEquals(result.allowed, true);
  assertEquals(result.remaining, 0);
  assertEquals(typeof result.reset, 'number');
});

Deno.test('checkRateLimit - Database error handling', async () => {
  const mockClient = new MockSupabaseClient({ errorMode: true }) as unknown as SupabaseClient;
  const result = await checkRateLimit('test-key', 1, 100, mockClient);
  
  assertEquals(result.allowed, true);
  assertEquals(result.remaining, 1);
  assertEquals(typeof result.reset, 'number');
});

Deno.test('checkRateLimit - Rate limit exceeded', async () => {
  const mockClient = new MockSupabaseClient({ highCount: true }) as unknown as SupabaseClient;
  const result = await checkRateLimit('test-key', 1, 100, mockClient);
  
  assertEquals(result.allowed, false);
  assertEquals(result.remaining, 0);
  assertEquals(typeof result.reset, 'number');
});

Deno.test('RateLimiter - Time window expiration', async () => {
  const rateLimiter = new RateLimiter(1, 100);
  const clientIp = '127.0.0.1';

  // First request should be allowed
  assertEquals(rateLimiter.check(clientIp), true);

  // Second request should be blocked
  assertEquals(rateLimiter.check(clientIp), false);

  // Wait for the time window to expire
  await new Promise(resolve => setTimeout(resolve, 150));

  // Request should be allowed after window expiration
  assertEquals(rateLimiter.check(clientIp), true);
}); 