import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactForm } from '../ContactForm';
import { Service } from '@/types';

// Mock the supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    createBooking: vi.fn()
  }
}));

// Mock the useToast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

describe('ContactForm', () => {
  const mockServices: Service[] = [
    { 
      id: '1', 
      name: 'Service 1', 
      baseRate: 100,
      icon: 'pressure',
      description: 'Test service 1',
      materialRequired: false,
      minimum: 50,
      unit: 'sq ft',
      materialMultipliers: {},
      storyMultipliers: {},
      roofPitchMultipliers: {}
    },
    { 
      id: '2', 
      name: 'Service 2', 
      baseRate: 200,
      icon: 'pressure',
      description: 'Test service 2',
      materialRequired: false,
      minimum: 50,
      unit: 'sq ft',
      materialMultipliers: {},
      storyMultipliers: {},
      roofPitchMultipliers: {}
    }
  ];

  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    render(<ContactForm services={mockServices} onSuccess={mockOnSuccess} />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockBookingId = '123';
    const mockSupabase = await import('@/lib/supabase/client');
    (mockSupabase.supabase.createBooking as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ 
      data: { id: mockBookingId }, 
      error: null 
    });

    render(<ContactForm services={mockServices} onSuccess={mockOnSuccess} />);

    // Fill out the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });
      fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Anytown' } });
      fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'CA' } });
      fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '12345' } });
    });

    // Submit the form
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });

    // Wait for the booking to be created
    await waitFor(() => {
      expect(mockSupabase.supabase.createBooking).toHaveBeenCalledWith({
        email: 'john@example.com',
        phone: '1234567890',
        name: 'John Doe',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        total_amount: 300, // Sum of base rates
        services: mockServices.map(service => ({
          serviceId: service.id,
          material: 'default',
          size: '1',
          stories: 1,
          roofPitch: 'low',
          price: service.baseRate
        }))
      });
    });

    // Verify success callback was called
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('handles form submission error', async () => {
    const mockError = new Error('Failed to create booking');
    const mockSupabase = await import('@/lib/supabase/client');
    (mockSupabase.supabase.createBooking as ReturnType<typeof vi.fn>).mockRejectedValueOnce(mockError);

    render(<ContactForm services={mockServices} onSuccess={mockOnSuccess} />);

    // Fill out the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });
      fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Anytown' } });
      fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'CA' } });
      fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '12345' } });
    });

    // Submit the form
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to create booking/i)).toBeInTheDocument();
    });

    // Verify success callback was not called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});