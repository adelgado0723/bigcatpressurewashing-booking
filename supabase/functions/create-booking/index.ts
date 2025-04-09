// @deno-types="npm:@supabase/supabase-js@2.39.7"
import { createClient } from '@supabase/supabase-js';
// @deno-types="npm:zod@3.22.4"
import { z } from 'zod';
import { verifyAuth } from '../shared/auth.ts';
import { RateLimiter } from '../shared/rate-limiter.ts';
import { sanitizeInput, validateInput } from '../shared/validation.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'stripe'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Validation schemas
const serviceSchema = z.object({
  service_type: z.enum(['Concrete Cleaning', 'House Cleaning', 'Roof Cleaning', 'Gutter Cleaning']),
  material: z.string().max(100).optional().nullable(),
  size: z.number().positive().max(100000),
  stories: z.number().int().min(1).max(3).optional().nullable(),
  roof_pitch: z.enum(['low pitch', 'medium pitch', 'high pitch']).optional().nullable(),
  price: z.number().positive().max(100000),
})

const bookingSchema = z.object({
  customer_email: z.string().email().max(255),
  customer_phone: z.string().max(20).optional().nullable(),
  customer_name: z.string().max(100).optional().nullable(),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  zip: z.string().min(5).max(10),
  total_amount: z.number().positive().max(50000),
  deposit_amount: z.number().positive().max(5000),
  services: z.array(serviceSchema).min(1).max(10),
  is_guest: z.boolean(),
})

async function sendSlackNotification(booking: any, services: any[]) {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
  if (!webhookUrl) return

  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎯 New Booking Created!',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Customer:*\n${sanitizeInput(booking.customer_email)}`
          },
          {
            type: 'mrkdwn',
            text: `*Location:*\n${sanitizeInput(booking.city)}, ${sanitizeInput(booking.state)}`
          }
        ]
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Amount:*\n$${booking.total_amount.toFixed(2)}`
          },
          {
            type: 'mrkdwn',
            text: `*Deposit Amount:*\n$${booking.deposit_amount.toFixed(2)}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Services:*\n${services.map(s => `• ${sanitizeInput(s.service_type)} - ${s.size} ${s.service_type.toLowerCase().includes('gutter') ? 'ft' : 'sqft'}${s.material ? ` (${sanitizeInput(s.material)})` : ''}${s.stories ? ` - ${s.stories} ${s.stories === 1 ? 'story' : 'stories'}` : ''}${s.roof_pitch ? ` - ${s.roof_pitch}` : ''} - $${s.price.toFixed(2)}`).join('\n')}`
        }
      }
    ]
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      console.error('Failed to send Slack notification:', await response.text())
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
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
    const validatedData = validateInput(bookingSchema, body)

    // Sanitize inputs
    const sanitizedData = {
      ...validatedData,
      customer_name: validatedData.customer_name ? sanitizeInput(validatedData.customer_name) : null,
      customer_phone: validatedData.customer_phone ? sanitizeInput(validatedData.customer_phone) : null,
      address: sanitizeInput(validatedData.address),
      city: sanitizeInput(validatedData.city),
      state: sanitizeInput(validatedData.state),
      zip: sanitizeInput(validatedData.zip),
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        ...sanitizedData,
        user_id: user.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        ip_address: clientIp,
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // Insert booking services
    const bookingServices = validatedData.services.map(service => ({
      booking_id: booking.id,
      service_type: service.service_type,
      material: service.material,
      size: service.size,
      stories: service.stories,
      roof_pitch: service.roof_pitch,
      price: service.price,
    }))

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServices)

    if (servicesError) {
      // Clean up the booking if services insertion fails
      await supabase.from('bookings').delete().eq('id', booking.id)
      throw servicesError
    }

    // Send Slack notification
    await sendSlackNotification(booking, validatedData.services)

    // Log the activity
    const logResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/log-activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        action: 'booking_created',
        details: {
          booking_id: booking.id,
          service_type: booking.service_type,
          status: booking.status,
          total_amount: booking.total_amount,
        },
      }),
    })

    if (!logResponse.ok) {
      console.error('Failed to log activity:', await logResponse.text())
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: booking,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        error_type: error instanceof z.ZodError ? 'validation' : 'server'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Authentication') ? 401 : 400,
      }
    )
  }
})