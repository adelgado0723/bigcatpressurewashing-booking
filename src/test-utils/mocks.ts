import { vi } from 'vitest';
import { BookingContextType } from '../types/booking';

// Mock Supabase module
vi.mock('../lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    data: [],
    error: null,
  };
  return { supabase: mockSupabase };
});

export const mockBookingContext: BookingContextType = {
  serviceType: null,
  setServiceType: vi.fn(),
  date: null,
  setDate: vi.fn(),
  timeSlot: null,
  setTimeSlot: vi.fn(),
  customerInfo: null,
  setCustomerInfo: vi.fn(),
  submitBooking: vi.fn(),
  isLoading: false,
  error: null,
  resetBooking: vi.fn(),
};

export const mockCustomerInfo = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  address: '123 Main St',
};

export const mockBooking = {
  id: '1',
  serviceType: 'pressure_washing',
  date: '2024-04-10',
  timeSlot: '09:00',
  customerInfo: mockCustomerInfo,
  status: 'pending',
  createdAt: new Date().toISOString(),
}; 