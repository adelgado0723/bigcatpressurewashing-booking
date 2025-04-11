import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Service } from '@/types';
import { defaultBookingContext } from '@/constants/booking';

interface BookingContextType {
  services: Service[];
  isLoading: boolean;
  error: string | null;
}

const BookingContext = createContext<BookingContextType>(defaultBookingContext);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : 'Failed to fetch services');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <BookingContext.Provider value={{ services, isLoading, error }}>
      {children}
    </BookingContext.Provider>
  );
}

export { BookingContext }; 