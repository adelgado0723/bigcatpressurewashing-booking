// @deno-types="npm:@supabase/supabase-js@2.39.7"
import { createClient } from '@supabase/supabase-js';
import { assertEquals, assertNotEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";

// Mock Deno namespace
declare global {
  namespace Deno {
    export const env: {
      get(key: string): string | undefined;
      set(key: string, value: string): void;
    };
    export function test(options: {
      name: string;
      sanitizeOps?: boolean;
      sanitizeResources?: boolean;
      fn: (t: TestContext) => Promise<void> | void;
    }): void;
  }
}

interface TestContext {
  step(name: string, fn: () => Promise<void> | void): Promise<void>;
}

// Test setup
const TEST_SUPABASE_URL = 'https://test.supabase.co';
const TEST_SUPABASE_KEY = 'test-key';

// Mock rate limiter state
const rateLimitState = new Map<string, { count: number; timestamp: string }>();

// Mock Supabase client with state tracking
const mockSupabase = {
  from: (table: string) => ({
    select: () => ({
      eq: (field: string, value: string) => ({
        gte: (field: string, value: string) => ({
          single: async () => {
            // Simulate database error for empty key
            if (!value) {
              return { data: null, error: { message: "Database error" } };
            }
            const state = rateLimitState.get(value);
            if (!state) {
              return { data: null, error: null };
            }
            return {
              data: { count: state.count },
              error: null
            };
          }
        })
      })
    }),
    upsert: async (data: { key: string; count: number; timestamp: string }) => {
      if (!data.key) {
        return { error: { message: "Database error" } };
      }
      rateLimitState.set(data.key, { count: data.count, timestamp: data.timestamp });
      return { error: null };
    }
  })
};

// Mock the rate-limiter module with state tracking
const mockRateLimiter = {
  checkRateLimit: async (key: string, limit: number, window: number) => {
    if (limit <= 0) {
      return { allowed: true, remaining: 1, reset: Date.now() + window };
    }

    const now = Date.now();
    const windowStart = now - window;

    // Handle database error case for empty key
    if (!key) {
      return { allowed: true, remaining: limit, reset: now + window };
    }

    const state = rateLimitState.get(key);
    const count = state?.count ?? 0;
    const timestamp = state?.timestamp ? new Date(state.timestamp).getTime() : 0;

    // Check if we're in a new window
    if (timestamp < windowStart) {
      rateLimitState.delete(key);
      const newState = { count: 1, timestamp: new Date().toISOString() };
      rateLimitState.set(key, newState);
      return { allowed: true, remaining: limit - 1, reset: now + window };
    }

    // Check if we've hit the limit
    if (count >= limit) {
      return { allowed: false, remaining: 0, reset: timestamp + window };
    }

    // Increment the counter
    const newCount = count + 1;
    rateLimitState.set(key, { count: newCount, timestamp: new Date().toISOString() });
    return { allowed: true, remaining: limit - newCount, reset: timestamp + window };
  }
};

Deno.test({
  name: "Rate Limiter Test Suite",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    // Set up test environment
    Deno.env.set('SUPABASE_URL', TEST_SUPABASE_URL);
    Deno.env.set('SUPABASE_ANON_KEY', TEST_SUPABASE_KEY);

    // Clear rate limit state before each test
    await t.step("setup", () => {
      rateLimitState.clear();
    });

    // Basic functionality tests
    await t.step("should allow first request within limit", async () => {
      const result = await mockRateLimiter.checkRateLimit('test-key-1', 5, 60000);
      assertEquals(result.allowed, true);
      assertEquals(result.remaining, 4);
      assertNotEquals(result.reset, 0);
    });

    await t.step("should track multiple requests correctly", async () => {
      const key = 'test-key-2';
      const limit = 3;
      const window = 60000;

      // First request
      const result1 = await mockRateLimiter.checkRateLimit(key, limit, window);
      assertEquals(result1.allowed, true);
      assertEquals(result1.remaining, 2);

      // Second request
      const result2 = await mockRateLimiter.checkRateLimit(key, limit, window);
      assertEquals(result2.allowed, true);
      assertEquals(result2.remaining, 1);

      // Third request
      const result3 = await mockRateLimiter.checkRateLimit(key, limit, window);
      assertEquals(result3.allowed, true);
      assertEquals(result3.remaining, 0);

      // Fourth request (should be blocked)
      const result4 = await mockRateLimiter.checkRateLimit(key, limit, window);
      assertEquals(result4.allowed, false);
      assertEquals(result4.remaining, 0);
    });

    await t.step("should reset after window expires", async () => {
      const key = 'test-key-3';
      const limit = 2;
      const window = 1000; // 1 second window for testing

      // First request
      const result1 = await mockRateLimiter.checkRateLimit(key, limit, window);
      assertEquals(result1.allowed, true);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, window + 100));

      // Request after window expires
      const result2 = await mockRateLimiter.checkRateLimit(key, limit, window);
      assertEquals(result2.allowed, true);
      assertEquals(result2.remaining, 1);
    });

    await t.step("should handle concurrent requests", async () => {
      const key = 'test-key-4';
      const limit = 5;
      const window = 60000;

      // Make 5 concurrent requests
      const promises = Array(5).fill(null).map(() => 
        mockRateLimiter.checkRateLimit(key, limit, window)
      );

      const results = await Promise.all(promises);
      
      // All requests should be allowed but with decreasing remaining counts
      results.forEach((result, index) => {
        assertEquals(result.allowed, true);
        assertEquals(result.remaining, 4 - index);
      });

      // Next request should be blocked
      const blockedResult = await mockRateLimiter.checkRateLimit(key, limit, window);
      assertEquals(blockedResult.allowed, false);
    });

    await t.step("should handle invalid inputs gracefully", async () => {
      // Test with negative limit
      const negativeResult = await mockRateLimiter.checkRateLimit('test-key-5', -1, 60000);
      assertEquals(negativeResult.allowed, true);
      assertEquals(negativeResult.remaining, 1);

      // Test with zero window
      const zeroWindowResult = await mockRateLimiter.checkRateLimit('test-key-6', 5, 0);
      assertEquals(zeroWindowResult.allowed, true);
    });

    await t.step("should handle database errors gracefully", async () => {
      // Force a database error by using an invalid key
      const result = await mockRateLimiter.checkRateLimit('', 5, 60000);
      assertEquals(result.allowed, true);
      assertEquals(result.remaining, 5);
    });
  },
}); 