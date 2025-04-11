import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyAuth } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface BookingData {
  id: string;
  email: string;
  name: string;
  service_type: string;
  total_amount: number;
  status: string;
}

async function sendConfirmationEmail(booking: BookingData) {
  const emailServiceUrl = Deno.env.get('EMAIL_SERVICE_URL');
  if (!emailServiceUrl) {
    throw new Error('EMAIL_SERVICE_URL environment variable not set');
  }

  const response = await fetch(emailServiceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: booking.email,
      subject: 'Booking Confirmation',
      template: 'booking-confirmation',
      data: {
        name: booking.name,
        serviceType: booking.service_type,
        totalAmount: booking.total_amount,
        status: booking.status,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send confirmation email: ${response.statusText}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase } = await verifyAuth(req);
    const { bookingId } = await req.json();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    await sendConfirmationEmail(booking);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});