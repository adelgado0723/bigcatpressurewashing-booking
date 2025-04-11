// @deno-types="npm:@supabase/supabase-js@2.39.7"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { SupabaseClient } from '@supabase/supabase-js';

// Declare Deno namespace for TypeScript
declare global {
  interface DenoEnv {
    get(key: string): string | undefined;
  }

  const env: DenoEnv;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface PaymentData {
  paymentIntentId: string;
  bookingId: string;
}

export async function confirmPayment(paymentData: PaymentData, supabase: SupabaseClient) {
  try {
    const { error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', paymentData.bookingId)
      .single();

    if (bookingError) throw bookingError;

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        payment_intent_id: paymentData.paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentData.bookingId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Payment confirmation error:', error);
    throw error;
  }
}

// Main function handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase } = await verifyAuth(req);
    const { paymentIntentId, bookingId } = await req.json();

    const result = await confirmPayment({ paymentIntentId, bookingId }, supabase);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
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