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

Deno.test('RateLimiter - Basic functionality with real IP', () => {
  const rateLimiter = new RateLimiter(1, 100);
  const clientIp = '203.0.113.1'; // Example public IP

  // First request should be allowed
  assertEquals(rateLimiter.check(clientIp), true);

  // Second request within time window should be blocked
  assertEquals(rateLimiter.check(clientIp), false);
});

Deno.test('RateLimiter - Different real-world IPs', () => {
  const rateLimiter = new RateLimiter(1, 100);
  // Using documentation IPs (RFC 5737)
  const ip1 = '192.0.2.1';    // TEST-NET-1
  const ip2 = '198.51.100.1'; // TEST-NET-2
  const ip3 = '203.0.113.1';  // TEST-NET-3

  // All IPs should be allowed initially
  assertEquals(rateLimiter.check(ip1), true);
  assertEquals(rateLimiter.check(ip2), true);
  assertEquals(rateLimiter.check(ip3), true);

  // All IPs should be blocked on second request
  assertEquals(rateLimiter.check(ip1), false);
  assertEquals(rateLimiter.check(ip2), false);
  assertEquals(rateLimiter.check(ip3), false);
});

Deno.test('RateLimiter - Production rate limits', () => {
  // 60 requests per minute per IP
  const rateLimiter = new RateLimiter(60, 60000);
  const clientIp = '203.0.113.1';

  // Should allow 60 requests
  for (let i = 0; i < 60; i++) {
    assertEquals(rateLimiter.check(clientIp), true, `Request ${i + 1} should be allowed`);
  }

  // 61st request should be blocked
  assertEquals(rateLimiter.check(clientIp), false, '61st request should be blocked');
});

Deno.test('RateLimiter - Edge cases with real IPs', () => {
  const rateLimiter = new RateLimiter(1, 100);

  // Test with IPv6 address
  assertEquals(rateLimiter.check('2001:db8::1'), true);

  // Test with X-Forwarded-For style IP
  assertEquals(rateLimiter.check('203.0.113.1, 198.51.100.1'), true);

  // Test with invalid but realistic IP
  assertEquals(rateLimiter.check('256.256.256.256'), true);
});

Deno.test('RateLimiter - Reset functionality in production scenario', () => {
  // 60 requests per minute
  const rateLimiter = new RateLimiter(60, 60000);
  const clientIp = '203.0.113.1';

  // Fill up the limit
  for (let i = 0; i < 60; i++) {
    assertEquals(rateLimiter.check(clientIp), true);
  }

  // Should be blocked
  assertEquals(rateLimiter.check(clientIp), false);

  // Reset (e.g., after a deployment or server restart)
  rateLimiter.reset();

  // Should work again
  assertEquals(rateLimiter.check(clientIp), true);
});

Deno.test('checkRateLimit - Basic functionality with domain', async () => {
  const mockClient = new MockSupabaseClient() as unknown as SupabaseClient;
  const result = await checkRateLimit('booking.bigcatpressurewashing.com:203.0.113.1', 60, 60000, mockClient);
  
  assertEquals(result.allowed, true);
  assertEquals(result.remaining, 59);
  assertEquals(typeof result.reset, 'number');
});

Deno.test('checkRateLimit - Database error handling in production', async () => {
  const mockClient = new MockSupabaseClient({ errorMode: true }) as unknown as SupabaseClient;
  const result = await checkRateLimit('booking.bigcatpressurewashing.com:203.0.113.1', 60, 60000, mockClient);
  
  assertEquals(result.allowed, true);
  assertEquals(result.remaining, 60);
  assertEquals(typeof result.reset, 'number');
});

Deno.test('checkRateLimit - Rate limit exceeded for domain', async () => {
  const mockClient = new MockSupabaseClient({ highCount: true }) as unknown as SupabaseClient;
  const result = await checkRateLimit('booking.bigcatpressurewashing.com:203.0.113.1', 60, 60000, mockClient);
  
  assertEquals(result.allowed, false);
  assertEquals(result.remaining, 0);
  assertEquals(typeof result.reset, 'number');
});

Deno.test('RateLimiter - Time window expiration in production', async () => {
  // 60 requests per minute
  const rateLimiter = new RateLimiter(60, 60000);
  const clientIp = '203.0.113.1';

  // Fill up the limit
  for (let i = 0; i < 60; i++) {
    assertEquals(rateLimiter.check(clientIp), true);
  }

  // Should be blocked
  assertEquals(rateLimiter.check(clientIp), false);

  // Wait for the time window to expire
  await new Promise(resolve => setTimeout(resolve, 60100));

  // Should work again
  assertEquals(rateLimiter.check(clientIp), true);
}); 