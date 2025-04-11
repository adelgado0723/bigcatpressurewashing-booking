import { BookingContextType } from '@/types';

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const SERVICE_TYPES = {
  HOUSE_WASH: 'house_wash',
  GUTTER_CLEANING: 'gutter_cleaning',
  ROOF_CLEANING: 'roof_cleaning',
  DECK_CLEANING: 'deck_cleaning',
  DRIVEWAY_CLEANING: 'driveway_cleaning',
} as const;

export const MATERIAL_TYPES = {
  VINYL: 'vinyl',
  BRICK: 'brick',
  STUCCO: 'stucco',
  WOOD: 'wood',
  CONCRETE: 'concrete',
} as const;

export const defaultBookingContext: BookingContextType = {
  services: [],
  setServices: () => {},
  selectedService: null,
  setSelectedService: () => {},
  bookingDetails: {},
  setBookingDetails: () => {},
  isLoading: false,
  error: null,
  fetchServices: async () => {}
}; 