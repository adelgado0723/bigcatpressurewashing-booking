import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAuth, RateLimiter, sanitizeInput, validateInput } from '../_shared/auth.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const activitySchema = z.object({
  user_id: z.string().optional(),
  action: z.string().min(1).max(100),
  details: z.record(z.unknown()),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().max(500).optional(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const { user, headers, supabase } = await verifyAuth(req)

    // Implement rate limiting
    const rateLimiter = RateLimiter.getInstance()
    const clientIp = headers['x-forwarded-for'] || 'unknown'
    if (!rateLimiter.check(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        },
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = validateInput(activitySchema, body)

    // Sanitize inputs
    const sanitizedData = {
      ...validatedData,
      action: sanitizeInput(validatedData.action),
      user_agent: validatedData.user_agent ? sanitizeInput(validatedData.user_agent) : undefined,
    }

    // Insert activity log
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        ...sanitizedData,
        user_id: user.id,
        ip_address: clientIp,
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('Authentication') ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    )
  }
}) 