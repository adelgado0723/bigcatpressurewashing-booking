// @deno-types="npm:@supabase/supabase-js@2.39.7"
import { z } from 'npm:zod@3.22.4';
import { verifyAuth } from '../_shared/auth.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const bookingSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  name: z.string().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  services: z.array(z.object({
    serviceId: z.string(),
    material: z.string().optional(),
    size: z.string(),
    stories: z.enum(['1', '2', '3']).optional(),
    roofPitch: z.enum(['low pitch', 'medium pitch', 'high pitch']).optional(),
    price: z.number(),
  })),
  total_amount: z.number(),
});

type BookingData = z.infer<typeof bookingSchema>;

async function sendSlackNotification({ booking, _services }: { booking: BookingData; _services: BookingData['services'] }) {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!webhookUrl) return;

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*New Booking Created*',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Customer:*\n${booking.email}`,
        },
        {
          type: 'mrkdwn',
          text: `*Phone:*\n${booking.phone || 'N/A'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Address:*\n${booking.address}, ${booking.city}, ${booking.state} ${booking.zip}`,
        },
        {
          type: 'mrkdwn',
          text: `*Total Amount:*\n$${booking.total_amount.toFixed(2)}`,
        },
      ],
    },
  ];

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, supabase } = await verifyAuth(req);

    const body = await req.json();
    const bookingData = bookingSchema.parse(body);

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...bookingData,
        user_id: user.id,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Insert booking services
    const bookingServices = bookingData.services.map(service => ({
      booking_id: data.id,
      service_type: service.serviceId,
      material: service.material,
      size: service.size,
      stories: service.stories,
      roof_pitch: service.roofPitch,
      price: service.price,
    }));

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServices);

    if (servicesError) {
      // Clean up the booking if services insertion fails
      await supabase.from('bookings').delete().eq('id', data.id);
      throw servicesError;
    }

    // Send Slack notification
    await sendSlackNotification({ booking: data, _services: bookingData.services });

    // Log the activity
    const { error: logError } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'booking_created',
      details: {
        booking_id: data.id,
        service_type: data.service_type,
        status: data.status,
        total_amount: data.total_amount,
      },
    });

    if (logError) {
      console.error('Failed to log activity:', logError);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});