import { RateLimiter } from "./rate-limiter.ts";

declare global {
  const Deno: {
    test: (name: string, fn: () => Promise<void> | void) => void;
  };
}

// Basic functionality test
Deno.test("RateLimiter - Basic functionality", () => {
  const rateLimiter = new RateLimiter(5, 1000); // 5 requests per second
  const ip = "127.0.0.1";

  // First request should be allowed
  let result = rateLimiter.check(ip);
  if (result !== true) throw new Error("First request should be allowed");

  // Second request should be allowed
  result = rateLimiter.check(ip);
  if (result !== true) throw new Error("Second request should be allowed");

  // Third request should be allowed
  result = rateLimiter.check(ip);
  if (result !== true) throw new Error("Third request should be allowed");

  // Fourth request should be allowed
  result = rateLimiter.check(ip);
  if (result !== true) throw new Error("Fourth request should be allowed");

  // Fifth request should be allowed
  result = rateLimiter.check(ip);
  if (result !== true) throw new Error("Fifth request should be allowed");

  // Sixth request should be blocked
  result = rateLimiter.check(ip);
  if (result !== false) throw new Error("Sixth request should be blocked");
});

// Different IPs test
Deno.test("RateLimiter - Different IPs", () => {
  const rateLimiter = new RateLimiter(2, 1000); // 2 requests per second
  const ip1 = "127.0.0.1";
  const ip2 = "127.0.0.2";

  // Both IPs should be allowed initially
  let result1 = rateLimiter.check(ip1);
  let result2 = rateLimiter.check(ip2);
  if (result1 !== true) throw new Error("First request for IP1 should be allowed");
  if (result2 !== true) throw new Error("First request for IP2 should be allowed");

  // Second request for both IPs should be allowed
  result1 = rateLimiter.check(ip1);
  result2 = rateLimiter.check(ip2);
  if (result1 !== true) throw new Error("Second request for IP1 should be allowed");
  if (result2 !== true) throw new Error("Second request for IP2 should be allowed");

  // Third request for both IPs should be blocked
  result1 = rateLimiter.check(ip1);
  result2 = rateLimiter.check(ip2);
  if (result1 !== false) throw new Error("Third request for IP1 should be blocked");
  if (result2 !== false) throw new Error("Third request for IP2 should be blocked");
});

// Edge cases test
Deno.test("RateLimiter - Edge cases", () => {
  const rateLimiter = new RateLimiter(1, 1000); // 1 request per second

  // Test empty IP
  let result = rateLimiter.check("");
  if (result !== true) throw new Error("First request with empty IP should be allowed");
  result = rateLimiter.check("");
  if (result !== false) throw new Error("Second request with empty IP should be blocked");

  // Test IP with port
  result = rateLimiter.check("127.0.0.1:8080");
  if (result !== true) throw new Error("First request with port should be allowed");
  result = rateLimiter.check("127.0.0.1:8080");
  if (result !== false) throw new Error("Second request with port should be blocked");

  // Test X-Forwarded-For header
  const xForwardedFor = "203.0.113.1, 192.168.1.1, 10.0.0.1";
  result = rateLimiter.check(xForwardedFor);
  if (result !== true) throw new Error("First request with X-Forwarded-For should be allowed");
  result = rateLimiter.check(xForwardedFor);
  if (result !== false) throw new Error("Second request with X-Forwarded-For should be blocked");
});

// Reset functionality test
Deno.test("RateLimiter - Reset functionality", () => {
  const rateLimiter = new RateLimiter(1, 1000); // 1 request per second
  const ip = "127.0.0.1";

  // First request should be allowed
  let result = rateLimiter.check(ip);
  if (result !== true) throw new Error("First request should be allowed");

  // Second request should be blocked
  result = rateLimiter.check(ip);
  if (result !== false) throw new Error("Second request should be blocked");

  // Reset the limiter
  rateLimiter.reset();

  // Request after reset should be allowed
  result = rateLimiter.check(ip);
  if (result !== true) throw new Error("Request after reset should be allowed");
});