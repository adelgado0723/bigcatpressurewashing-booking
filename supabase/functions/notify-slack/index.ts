import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  type: 'quote' | 'deposit';
  customerEmail: string;
  customerName?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  services: Array<{
    serviceType: string;
    size: number;
    material?: string;
    stories?: number;
    roofPitch?: string;
    price: number;
  }>;
  totalAmount: number;
  bookingId?: string;
  depositAmount?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    
    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: payload.type === 'quote' ? '🎯 New Quote Request!' : '💰 New Deposit Received!',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Customer:*\n${payload.customerEmail}`
            },
            {
              type: 'mrkdwn',
              text: `*Location:*\n${payload.city}, ${payload.state}`
            }
          ]
        }
      ]
    };

    // Add booking-specific information for deposits
    if (payload.type === 'deposit') {
      message.blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Booking ID:*\n${payload.bookingId}`
          },
          {
            type: 'mrkdwn',
            text: `*Deposit Amount:*\n$${payload.depositAmount?.toFixed(2)}`
          }
        ]
      });
    }

    // Add services summary
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Total Amount:* $${payload.totalAmount.toFixed(2)}`
      }
    });

    const response = await fetch(Deno.env.get('SLACK_WEBHOOK_URL') ?? '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error('Failed to send Slack notification');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});