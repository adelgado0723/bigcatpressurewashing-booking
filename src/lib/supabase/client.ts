import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { services } from '../../constants';
import { ServiceQuote } from '../../types';

export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  get auth() {
    return this.client.auth;
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
    totalAmount: number;
  }) {
    const { error } = await this.client.from('quotes').insert({
      email: data.email || null,
      services: data.services.map(service => ({
        service_type: services.find(s => s.id === service.serviceType)?.name,
        material: service.material,
        size: service.size,
        stories: service.stories,
        roof_pitch: service.roofPitch,
        price: service.price
      })),
      total_amount: data.totalAmount
    });

    if (error) throw error;
  }

  async createBooking(data: {
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
  }) {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.client.auth.session()?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
          service_type: quote.serviceId,
          material: quote.material,
          size: parseFloat(quote.size),
          stories: quote.stories ? parseInt(quote.stories) : null,
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
  }
}

export const supabase = new SupabaseService();