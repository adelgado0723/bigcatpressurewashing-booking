import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  bookingId: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId } = await req.json() as EmailPayload;

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_services (*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;
    if (!booking) throw new Error('Booking not found');

    // Format services for email
    const servicesList = booking.booking_services
      .map((service: any) => {
        let details = `${service.service_type} - ${service.size} ${service.service_type.toLowerCase().includes('gutter') ? 'ft' : 'sqft'}`;
        if (service.material) details += ` (${service.material})`;
        if (service.stories) details += ` - ${service.stories} ${service.stories === 1 ? 'story' : 'stories'}`;
        if (service.roof_pitch) details += ` - ${service.roof_pitch}`;
        details += ` - $${service.price.toFixed(2)}`;
        return details;
      })
      .join('\n');

    const emailContent = `
Hello ${booking.customer_name || 'valued customer'},

Thank you for choosing Big Cat Pressure Washing! Here are your booking details:

Booking Reference: ${booking.id}
Total Amount: $${booking.total_amount.toFixed(2)}
Required Deposit: $${booking.deposit_amount.toFixed(2)}

Services:
${servicesList}

Service Location:
${booking.address}
${booking.city}, ${booking.state} ${booking.zip}

Status: ${booking.status}

We will contact you shortly to confirm your appointment time.

If you have any questions, please don't hesitate to reach out to us at andy@bigcatpressurewashing.com.

Thank you for trusting Big Cat Pressure Washing with your property!

Best regards,
The Big Cat Pressure Washing Team
    `.trim();

    // Send email using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Big Cat Pressure Washing <support@bigcatpressurewashing.com>',
        to: booking.customer_email,
        subject: 'Booking Confirmation - Big Cat Pressure Washing',
        text: emailContent,
      }),
    });

    if (!resendResponse.ok) {
      throw new Error('Failed to send email');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});