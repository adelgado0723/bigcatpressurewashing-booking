import React, { createContext, useContext, ReactNode } from 'react';
import { Service } from '../types';
import { services } from '../constants';

interface BookingContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
}

const BookingContext = createContext<BookingContextType>({
  services,
  loading: false,
  error: null,
});

export const useBookingContext = () => useContext(BookingContext);

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  return (
    <BookingContext.Provider value={{ services, loading: false, error: null }}>
      {children}
    </BookingContext.Provider>
  );
};

export default BookingContext; 