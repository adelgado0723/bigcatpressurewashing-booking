// @deno-types="npm:@supabase/supabase-js@2.39.7"
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
// @deno-types="npm:stripe@13.6.0"
import { Stripe } from 'npm:stripe@13.6.0';

// Declare Deno namespace for TypeScript
declare global {
  namespace Deno {
    function serve(handler: (req: Request) => Promise<Response> | Response): void;
    interface Env {
      get(key: string): string | undefined;
    }
    const env: Env;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

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
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Get request payload
    const { bookingId, paymentIntentId } = await req.json();
    
    if (!bookingId || !paymentIntentId) {
      throw new Error('Missing required parameters: bookingId or paymentIntentId');
    }

    // Get auth token to check if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Verify the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not successful. Current status: ${paymentIntent.status}`);
    }

    // Fetch the booking to verify it exists and matches the payment
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Booking not found');
      }
      throw new Error(`Failed to fetch booking: ${fetchError.message}`);
    }

    // Verify the payment belongs to this booking
    const paymentAmount = paymentIntent.amount / 100; // Stripe amounts are in cents
    
    if (paymentIntent.metadata?.bookingId !== bookingId) {
      throw new Error('Payment does not match this booking');
    }

    // Determine if this is a deposit payment or full payment
    const isDepositPayment = paymentAmount === booking.deposit_amount;
    const isFullPayment = paymentAmount === booking.total_amount;
    
    if (!isDepositPayment && !isFullPayment) {
      throw new Error('Payment amount does not match expected deposit or total amount');
    }

    // Update booking status based on payment type
    const newStatus = isDepositPayment ? 'deposit_paid' : 'paid';
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: newStatus,
        payment_intent_id: paymentIntentId,
        payment_confirmed_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      throw new Error(`Failed to update booking status: ${updateError.message}`);
    }

    // Record this payment in the payments table
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: paymentAmount,
        payment_intent_id: paymentIntentId,
        payment_type: isDepositPayment ? 'deposit' : 'full_payment',
        status: 'successful'
      });

    if (paymentError) {
      console.error('Failed to record payment:', paymentError);
      // Don't throw here, as the payment was successful and booking updated
    }

    // Log the activity
    const logResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/log-activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'payment_confirmed',
        details: {
          booking_id: booking.id,
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method: paymentIntent.payment_method_types[0],
        },
      }),
    })

    if (!logResponse.ok) {
      console.error('Failed to log activity:', await logResponse.text())
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          bookingId,
          status: newStatus,
          paymentConfirmed: true
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error:', error);
    
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