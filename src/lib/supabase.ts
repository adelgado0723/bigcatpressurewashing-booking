import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { services } from '../constants';
import { ServiceQuote } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const client = createClient<Database>(supabaseUrl, supabaseAnonKey);

type LogQuoteData = {
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
};

type CreateBookingData = {
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
};

type LogQuoteResponse = {
  id: string;
  email: string;
  totalAmount: number;
  created_at: string;
};

type CreateBookingResponse = {
  id: string;
  customer_email: string;
  customer_phone: string | null;
  customer_name: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  total_amount: number;
  deposit_amount: number;
  is_guest: boolean;
  created_at: string;
};

type BookingResponse = {
  id: string;
  customer_email: string;
  customer_phone: string | null;
  customer_name: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  total_amount: number;
  deposit_amount: number;
  payment_intent_id: string | null;
  payment_status: string | null;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
};

type ExtendedSupabaseClient = SupabaseClient<Database> & {
  logQuote: (data: LogQuoteData) => Promise<LogQuoteResponse>;
  createBooking: (data: CreateBookingData) => Promise<CreateBookingResponse>;
  getBooking: (id: string) => Promise<BookingResponse>;
  updateBookingPayment: (bookingId: string, paymentIntentId: string, status: string) => Promise<BookingResponse>;
};

export const supabase = client as ExtendedSupabaseClient;

// Add custom methods
Object.assign(supabase, {
  logQuote: async (data: LogQuoteData): Promise<LogQuoteResponse> => {
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
  createBooking: async (data: CreateBookingData): Promise<CreateBookingResponse> => {
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
        services: data.services.map((quote: ServiceQuote) => ({
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
  getBooking: async (id: string): Promise<BookingResponse> => {
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  updateBookingPayment: async (bookingId: string, paymentIntentId: string, status: string): Promise<BookingResponse> => {
    const { data, error } = await client
      .from('bookings')
      .update({ payment_intent_id: paymentIntentId, payment_status: status })
      .eq('id', bookingId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
});