import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { z } from 'npm:zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Validation schema for input parameters
const paramsSchema = z.object({
  id: z.string().uuid('Invalid booking ID format'),
});

// Main function handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Validate the request method
    if (req.method !== 'GET') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Get the booking ID from the URL params
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('id');
    
    if (!bookingId) {
      throw new Error('Missing required parameter: id');
    }

    // Validate the ID format
    const { id } = paramsSchema.parse({ id: bookingId });

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth token to check if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Check if this is a guest booking (using anon key) or authenticated user
    const isUsingAnonKey = authHeader.includes(Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    let userId = null;
    let userEmail = null;

    // If not using anon key, verify the JWT token
    if (!isUsingAnonKey) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        throw new Error('Invalid authorization token');
      }

      userId = user.id;
      userEmail = user.email;
    }

    // Fetch the booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, booking_services(*)')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Booking not found');
      }
      throw new Error(`Failed to fetch booking: ${fetchError.message}`);
    }

    // Security check: only allow access if:
    // 1. The user is authenticated and the booking email matches their email, or
    // 2. The booking is a guest booking and they're using the same browser session
    if (!isUsingAnonKey && booking.customer_email !== userEmail) {
      throw new Error('Unauthorized access to booking');
    }

    // Log this access for auditing
    const clientIp = req.headers.get('X-Forwarded-For') || 'unknown';
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'view_booking',
      resource_type: 'booking',
      resource_id: booking.id,
      ip_address: clientIp,
      details: {
        is_guest: isUsingAnonKey,
        email: booking.customer_email
      }
    }).catch(error => {
      // Don't fail if logging fails
      console.error('Error logging activity:', error);
    });

    // Log the activity
    const logResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/log-activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        action: 'booking_retrieved',
        details: {
          booking_id: booking.id,
          status: booking.status,
        },
      }),
    })

    if (!logResponse.ok) {
      console.error('Failed to log activity:', await logResponse.text())
    }

    // Prepare a safe response with only necessary booking details
    const safeBooking = {
      id: booking.id,
      customer_email: booking.customer_email,
      customer_name: booking.customer_name,
      address: booking.address,
      city: booking.city,
      state: booking.state,
      zip: booking.zip,
      total_amount: booking.total_amount,
      deposit_amount: booking.deposit_amount,
      status: booking.status,
      created_at: booking.created_at,
      services: booking.booking_services
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: safeBooking
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error:', error);

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

    // Handle different types of errors with appropriate status codes
    let status = 400;
    if (error.message.includes('authorization') || error.message.includes('Unauthorized')) {
      status = 401;
    } else if (error.message.includes('not found')) {
      status = 404;
    }

    // Handle other errors
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status
      }
    );
  }
}); 