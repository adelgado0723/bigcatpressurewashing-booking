import type { Service } from './service';

export interface ServiceQuote {
  serviceId: string;
  material?: string;
  size?: string;
  stories?: number;
  roofPitch?: string;
  price: number;
}

export interface MaterialMultiplier {
  [key: string]: number;
}

export interface RoofPitchMultiplier {
  'low pitch': number;
  'medium pitch': number;
  'high pitch': number;
}

export interface StoriesMultiplier {
  '1': number;
  '2': number;
  '3': number;
}

export interface ContactInfo {
  email: string;
  phone: string;
  name: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  service_quotes: ServiceQuote[];
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid';
  total_amount: number;
  deposit_amount: number;
  created_at: string;
}

export interface BookingContextType {
  services: Service[];
  setServices: (services: Service[]) => void;
  selectedService: Service | null;
  setSelectedService: (service: Service | null) => void;
  bookingDetails: Record<string, string | number | boolean>;
  setBookingDetails: (details: Record<string, string | number | boolean>) => void;
  isLoading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
}

export type { Service };