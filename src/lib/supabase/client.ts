import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ServiceQuote } from '../../types';

export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  get auth() {
    return this.client.auth;
  }

  get realtime() {
    return this.client.realtime;
  }

  from(table: string) {
    return this.client.from(table);
  }

  async logQuote(data: {
    email: string;
    services: Array<{
      serviceType: string;
      size: number;
      material?: string;
      stories?: number;
      roofPitch?: string;
      price: number;
    }>;
    total_amount: number;
  }) {
    const { error } = await this.client.from('quotes').insert({
      email: data.email,
      services: data.services,
      total_amount: data.total_amount
    });

    if (error) throw error;
  }

  async createBooking(data: {
    email: string;
    phone: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    services: ServiceQuote[];
    total_amount: number;
  }) {
    const { data: booking, error } = await this.client.from('bookings').insert({
      email: data.email,
      phone: data.phone,
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      services: data.services,
      total_amount: data.total_amount,
      status: 'pending'
    }).select().single();

    if (error) throw error;
    return booking;
  }

  async getBooking(id: string) {
    const { data: booking, error } = await this.client.from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return booking;
  }

  async updateBookingPayment(id: string, paymentId: string) {
    const { error } = await this.client.from('bookings')
      .update({ payment_id: paymentId, status: 'paid' })
      .eq('id', id);

    if (error) throw error;
  }
}

export const supabase = new SupabaseService();