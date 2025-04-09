import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { z } from 'npm:zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const serviceSchema = z.object({
  service_type: z.enum(['Concrete Cleaning', 'House Cleaning', 'Roof Cleaning', 'Gutter Cleaning']),
  material: z.string().optional().nullable(),
  size: z.number().positive('Size must be a positive number'),
  stories: z.number().int().min(1).max(3).optional().nullable(),
  roof_pitch: z.enum(['low pitch', 'medium pitch', 'high pitch']).optional().nullable(),
  price: z.number().positive('Price must be a positive number'),
});

const bookingSchema = z.object({
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(5, 'ZIP code must be at least 5 characters'),
  total_amount: z.number().positive('Total amount must be a positive number'),
  deposit_amount: z.number().positive('Deposit amount must be a positive number'),
  services: z.array(serviceSchema).min(1, 'At least one service is required'),
});

type Booking = z.infer<typeof bookingSchema>;

async function sendSlackNotification(booking: any, services: any[]) {
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
            text: `*Customer:*\n${booking.customer_email}`
          },
          {
            type: 'mrkdwn',
            text: `*Location:*\n${booking.city}, ${booking.state}`
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
          text: `*Services:*\n${services.map(s => `• ${s.service_type} - ${s.size} ${s.service_type.toLowerCase().includes('gutter') ? 'ft' : 'sqft'}${s.material ? ` (${s.material})` : ''}${s.stories ? ` - ${s.stories} ${s.stories === 1 ? 'story' : 'stories'}` : ''}${s.roof_pitch ? ` - ${s.roof_pitch}` : ''} - $${s.price.toFixed(2)}`).join('\n')}`
        }
      }
    ]
  };

  const response = await fetch(Deno.env.get('SLACK_WEBHOOK_URL') ?? '', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    console.error('Failed to send Slack notification:', await response.text());
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate request body
    const body: Booking = await req.json();
    const validatedData = bookingSchema.parse(body);

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Check if this is a guest booking (using anon key) or authenticated user
    const isGuestBooking = authHeader.includes(Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    let userId: string | null = null;

    if (!isGuestBooking) {
      // For authenticated users, verify the JWT token
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        throw new Error('Invalid authorization token');
      }

      // Verify the customer email matches the authenticated user
      if (validatedData.customer_email !== user.email) {
        throw new Error('Email does not match authenticated user');
      }

      userId = user.id;
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_email: validatedData.customer_email,
        customer_phone: validatedData.customer_phone,
        customer_name: validatedData.customer_name,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        zip: validatedData.zip,
        total_amount: validatedData.total_amount,
        deposit_amount: validatedData.deposit_amount,
        status: 'pending',
        is_guest: isGuestBooking,
        user_id: userId
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Insert booking services
    const bookingServices = validatedData.services.map(service => ({
      booking_id: booking.id,
      service_type: service.service_type,
      material: service.material,
      size: service.size,
      stories: service.stories,
      roof_pitch: service.roof_pitch,
      price: service.price
    }));

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServices);

    if (servicesError) throw servicesError;

    // Send Slack notification
    await sendSlackNotification(booking, validatedData.services);

    // For guest bookings, set the guest token in the response
    const responseData = {
      success: true,
      data: booking,
      ...(isGuestBooking && { guest_token: booking.guest_token })
    };

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return new Response(
        JSON.stringify({ success: false, errors }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('authorization') ? 401 : 400
      }
    );
  }
});