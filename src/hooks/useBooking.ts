import { useContext } from 'react';
import { BookingContext } from '@/contexts/BookingContext';

export const useBooking = () => useContext(BookingContext);