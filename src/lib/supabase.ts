import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { services } from '../constants';
import { ServiceQuote } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const client = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabase = {
  ...client,
  logQuote: async (data: {
    email: string;
    services: Array<{
      serviceType: string;
      size: number;
      material?: string;
      stories?: number;
      roofPitch?: string;
      price: number;
    }>;
    totalAmount: number;
  }) => {
    const response = await fetch(`${supabaseUrl}/functions/v1/log-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        email: data.email,
        services: data.services,
        totalAmount: data.totalAmount
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to log quote');
    }

    return response.json();
  },
  createBooking: async (data: {
    email: string;
    phone?: string;
    name?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    totalAmount: number;
    depositAmount: number;
    services: ServiceQuote[];
    isGuest: boolean;
  }) => {
    const { data: { session } } = await client.auth.getSession();
    const response = await fetch(`${supabaseUrl}/functions/v1/create-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
      },
      body: JSON.stringify({
        customer_email: data.email,
        customer_phone: data.phone || null,
        customer_name: data.name || null,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        total_amount: data.totalAmount,
        deposit_amount: data.depositAmount,
        services: data.services.map(quote => ({
          service_type: services.find(s => s.id === quote.serviceId)?.name,
          material: quote.material,
          size: quote.size ? parseFloat(quote.size) : 1,
          stories: quote.stories ? Number(quote.stories) : null,
          roof_pitch: quote.roofPitch,
          price: quote.price,
        })),
        is_guest: data.isGuest,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create booking');
    }

    return response.json();
  },
  getBooking: async (id: string) => {
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  updateBookingPayment: async (bookingId: string, paymentIntentId: string, status: string) => {
    const { error } = await client
      .from('bookings')
      .update({
        stripe_payment_status: status,
        status: status === 'succeeded' ? 'confirmed' : 'pending'
      })
      .eq('id', bookingId)
      .eq('stripe_payment_intent_id', paymentIntentId);
      
    if (error) throw error;
  }
};