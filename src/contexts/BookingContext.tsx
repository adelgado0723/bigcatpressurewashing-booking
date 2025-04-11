import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Service } from '@/types';
import { defaultBookingContext } from '@/constants/booking';

interface BookingContextType {
  services: Service[];
  loading: boolean;
  error: Error | null;
}

const BookingContext = createContext<BookingContextType>(defaultBookingContext);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name');

        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <BookingContext.Provider value={{ services, loading, error }}>
      {children}
    </BookingContext.Provider>
  );
}

export { BookingContext }; 