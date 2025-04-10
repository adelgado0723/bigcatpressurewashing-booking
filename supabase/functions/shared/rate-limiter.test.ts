import { describe, it, expect, vi } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  it('should limit requests based on window size', () => {
    const rateLimiter = new RateLimiter(5, 1000); // 5 requests per second
    const ip = '127.0.0.1';

    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.check(ip)).toBe(true);
    }

    // 6th request should be blocked
    expect(rateLimiter.check(ip)).toBe(false);
  });

  it('should handle different IPs independently', () => {
    const rateLimiter = new RateLimiter(2, 1000);
    const ip1 = '127.0.0.1';
    const ip2 = '127.0.0.2';

    // Both IPs should be allowed initially
    expect(rateLimiter.check(ip1)).toBe(true);
    expect(rateLimiter.check(ip2)).toBe(true);

    // Second request for both IPs should be allowed
    expect(rateLimiter.check(ip1)).toBe(true);
    expect(rateLimiter.check(ip2)).toBe(true);

    // Third request for both IPs should be blocked
    expect(rateLimiter.check(ip1)).toBe(false);
    expect(rateLimiter.check(ip2)).toBe(false);
  });

  it('should handle edge cases', () => {
    const rateLimiter = new RateLimiter(1, 1000);

    // Test empty IP
    expect(rateLimiter.check('')).toBe(true);
    expect(rateLimiter.check('')).toBe(false);

    // Test IP with port
    expect(rateLimiter.check('127.0.0.1:8080')).toBe(true);
    expect(rateLimiter.check('127.0.0.1:8080')).toBe(false);

    // Test X-Forwarded-For header
    const xForwardedFor = '203.0.113.1, 192.168.1.1, 10.0.0.1';
    expect(rateLimiter.check(xForwardedFor)).toBe(true);
    expect(rateLimiter.check(xForwardedFor)).toBe(false);
  });

  it('should reset properly', () => {
    const rateLimiter = new RateLimiter(1, 1000);
    const ip = '127.0.0.1';

    expect(rateLimiter.check(ip)).toBe(true);
    expect(rateLimiter.check(ip)).toBe(false);

    rateLimiter.reset();
    expect(rateLimiter.check(ip)).toBe(true);
  });

  it('should handle time window expiration', async () => {
    const rateLimiter = new RateLimiter(2, 1000);
    const ip = '127.0.0.1';

    expect(rateLimiter.check(ip)).toBe(true);
    expect(rateLimiter.check(ip)).toBe(true);
    expect(rateLimiter.check(ip)).toBe(false);

    // Mock Date.now to simulate time passing
    const originalNow = Date.now;
    Date.now = vi.fn(() => originalNow() + 1100);

    expect(rateLimiter.check(ip)).toBe(true);

    // Restore Date.now
    Date.now = originalNow;
  });

  it('should handle high request limits', () => {
    const rateLimiter = new RateLimiter(1000, 1000);
    const ip = '127.0.0.1';

    for (let i = 0; i < 1000; i++) {
      expect(rateLimiter.check(ip)).toBe(true);
    }

    expect(rateLimiter.check(ip)).toBe(false);
  });

  it('should handle IPv6 addresses', () => {
    const rateLimiter = new RateLimiter(2, 1000);
    const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

    expect(rateLimiter.check(ipv6)).toBe(true);
    expect(rateLimiter.check(ipv6)).toBe(true);
    expect(rateLimiter.check(ipv6)).toBe(false);
  });

  it('should handle invalid IP formats', () => {
    const rateLimiter = new RateLimiter(2, 1000);
    const invalidIps = [
      '256.256.256.256',
      '2001:0db8:85a3:0000:0000:8a2e:0370:7334:1234',
      'not.an.ip',
      '127.0.0.1.2',
      '127.0.0',
    ];

    for (const ip of invalidIps) {
      expect(rateLimiter.check(ip)).toBe(true);
      expect(rateLimiter.check(ip)).toBe(true);
      expect(rateLimiter.check(ip)).toBe(false);
    }
  });

  it('should handle concurrent requests', async () => {
    const rateLimiter = new RateLimiter(10, 1000);
    const ip = '127.0.0.1';
    const requests = 20;
    const results: boolean[] = [];

    const promises = Array(requests).fill(null).map(() => 
      new Promise<void>(resolve => {
        const result = rateLimiter.check(ip);
        results.push(result);
        resolve();
      })
    );

    await Promise.all(promises);

    const allowedCount = results.filter(r => r).length;
    expect(allowedCount).toBe(10);
  });
});