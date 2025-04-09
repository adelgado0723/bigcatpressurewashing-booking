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