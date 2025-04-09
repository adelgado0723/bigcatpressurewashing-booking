import { useState } from 'react';
import { ServiceQuote } from '../types';
import { services } from '../constants';

interface UseBookingProps {
  session: any;
}

export function useBooking({ session }: UseBookingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (
    bookingData: {
      email: string;
      phone: string | null;
      name: string | null;
      address: string;
      city: string;
      state: string;
      zip: string;
      serviceQuotes: ServiceQuote[];
      totalAmount: number;
      depositAmount: number;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          customer_email: bookingData.email,
          customer_phone: bookingData.phone,
          customer_name: bookingData.name,
          address: bookingData.address,
          city: bookingData.city,
          state: bookingData.state,
          zip: bookingData.zip,
          total_amount: bookingData.totalAmount,
          deposit_amount: bookingData.depositAmount,
          services: bookingData.serviceQuotes.map(quote => ({
            service_type: services.find(s => s.id === quote.serviceId)?.name,
            material: quote.material,
            size: parseFloat(quote.size),
            stories: quote.stories ? parseInt(quote.stories) : null,
            roof_pitch: quote.roofPitch,
            price: quote.price,
          })),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createBooking,
    loading,
    error,
  };
}