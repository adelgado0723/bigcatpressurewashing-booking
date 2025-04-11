import { createClient } from '@supabase/supabase-js'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const authSchema = z.object({
  authorization: z.string().regex(/^Bearer .+$/),
  'x-client-info': z.string().optional(),
  'x-forwarded-for': z.string().optional(),
  'user-agent': z.string().optional(),
})

export async function verifyAuth(req: Request) {
  try {
    // Validate headers
    const headers = {
      authorization: req.headers.get('authorization') || '',
      'x-client-info': req.headers.get('x-client-info') || '',
      'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
      'user-agent': req.headers.get('user-agent') || '',
    }
    authSchema.parse(headers)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify JWT token
    const token = headers.authorization.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new Error('Invalid or expired token')
    }

    return {
      user,
      headers,
      supabase,
    }
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

// Rate limiting utility
export class RateLimiter {
  private static instance: RateLimiter
  private requests: Map<string, { count: number; timestamp: number }>
  private readonly limit: number
  private readonly windowMs: number

  private constructor(limit: number = 100, windowMs: number = 60000) {
    this.requests = new Map()
    this.limit = limit
    this.windowMs = windowMs
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  public check(key: string): boolean {
    const now = Date.now()
    const request = this.requests.get(key)

    if (!request) {
      this.requests.set(key, { count: 1, timestamp: now })
      return true
    }

    if (now - request.timestamp > this.windowMs) {
      this.requests.set(key, { count: 1, timestamp: now })
      return true
    }

    if (request.count >= this.limit) {
      return false
    }

    request.count++
    return true
  }
}

// Input sanitization utility
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char] || char))
    .trim()
}

// Validation utility
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
} 