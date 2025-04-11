import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactForm } from '../ContactForm';
import { ServiceQuote } from '../../types';

// Mock supabase module first to avoid hoisting issues
vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    logQuote: vi.fn().mockImplementation(async () => undefined),
    createBooking: vi.fn().mockImplementation(async () => ({ data: { id: 'test-booking-id' } })),
    getBooking: vi.fn().mockImplementation(async () => ({ data: null, error: null })),
    updateBookingPayment: vi.fn().mockImplementation(async () => undefined),
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null })
    })
  }
}));

// Import supabase after mocking
import { supabase } from '../../lib/supabase/client';

// Mock all icon components to avoid SVG rendering issues in tests
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="mock-arrowleft" />,
  ArrowRight: () => <div data-testid="mock-arrowright" />,
  Mail: () => <div data-testid="mock-mail" />,
  Phone: () => <div data-testid="mock-phone" />,
  User: () => <div data-testid="mock-user" />,
  MapPin: () => <div data-testid="mock-mappin" />,
}));

// Simple loading spinner mock to avoid animation complexities
vi.mock('../LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

interface PaymentFormProps {
  onSuccess: () => void;
  bookingId: string;
  amount: number;
}

// Mock PaymentForm to simulate successful payment flow
vi.mock('../PaymentForm', () => ({
  PaymentForm: ({ onSuccess, bookingId, amount }: PaymentFormProps) => (
    <div data-testid="payment-form" className="payment-form">
      <button onClick={onSuccess} role="button">Complete Payment</button>
      <div>Booking ID: {bookingId}</div>
      <div>Amount: ${amount}</div>
    </div>
  )
}));

// Mock window.location to verify navigation after payment
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  ancestorOrigins: {} as DOMStringList,
  hash: '',
  host: '',
  hostname: '',
  origin: '',
  pathname: '',
  port: '',
  protocol: '',
  search: '',
  reload: vi.fn(),
  toString: () => ''
} as unknown as Location;

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
  configurable: true
});

describe('ContactForm', () => {
  // Use realistic service quotes that match the business domain
  const mockServiceQuotes: ServiceQuote[] = [{
    serviceId: 'pressure-washing',
    material: 'concrete',
    size: '1000',
    stories: 1,
    roofPitch: 'low pitch',
    price: 100,
  }];

  // Default props represent a valid form state to test validation from
  const defaultProps = {
    email: 'test@example.com',
    phone: '+1234567890',
    name: 'Test User',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    loading: false,
    error: null,
    serviceQuotes: mockServiceQuotes,
    isGuest: false,
    onEmailChange: vi.fn(),
    onPhoneChange: vi.fn(),
    onNameChange: vi.fn(),
    onAddressChange: vi.fn(),
    onCityChange: vi.fn(),
    onStateChange: vi.fn(),
    onZipChange: vi.fn(),
    onBack: vi.fn(),
    formatPrice: (price: number) => `$${price}`,
    getTotalPrice: () => 100,
    getServiceSummary: (_quote: ServiceQuote) => 'Test Service'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.href before each test
    window.location.href = '';
    // Reset supabase mock implementation
    vi.mocked(supabase.logQuote).mockResolvedValue(undefined);
    vi.mocked(supabase.createBooking).mockResolvedValue({ data: { id: 'test-booking-id' } });
  });

  it('renders form fields correctly', () => {
    render(<ContactForm {...defaultProps} />);

    // Verify all required form elements are present and accessible
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
  });

  it('disables form fields and buttons when loading prop is true', () => {
    render(<ContactForm {...defaultProps} loading={true} />);

    // All form elements should be disabled during loading state
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/phone/i)).toBeDisabled();
    expect(screen.getByLabelText(/street address/i)).toBeDisabled();
    expect(screen.getByLabelText(/city/i)).toBeDisabled();
    expect(screen.getByLabelText(/state/i)).toBeDisabled();
    expect(screen.getByLabelText(/zip code/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /continue to payment/i })).toBeDisabled();
  });

  it('shows validation errors for required fields when submitting empty form', async () => {
    const emptyProps = {
      ...defaultProps,
      email: '',
      address: '',
      city: '',
      state: '',
      zip: ''
    };

    render(<ContactForm {...emptyProps} />);
    const form = screen.getByRole('form');
    
    await act(async () => {
      fireEvent.submit(form);
    });

    // Verify all required field errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/city is required/i)).toBeInTheDocument();
      expect(screen.getByText(/state is required/i)).toBeInTheDocument();
      expect(screen.getByText(/zip code is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format correctly', async () => {
    const invalidProps = {
      ...defaultProps,
      email: 'invalid-email'
    };

    render(<ContactForm {...invalidProps} />);
    const form = screen.getByRole('form');
    const emailInput = screen.getByLabelText(/email/i);

    await act(async () => {
      fireEvent.submit(form);
    });

    // Verify email validation error is displayed
    await waitFor(() => {
      expect(emailInput).toHaveClass('border-red-500');
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format correctly', async () => {
    const invalidProps = {
      ...defaultProps,
      phone: 'abc'  // Invalid phone format
    };

    render(<ContactForm {...invalidProps} />);
    const form = screen.getByRole('form');
    
    // Submit form to trigger validation
    await act(async () => {
      fireEvent.submit(form);
    });

    // Verify phone validation error is displayed
    await waitFor(() => {
      const phoneInput = screen.getByLabelText(/phone number/i);
      expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
      expect(phoneInput.className).toContain('border-red-500');
    }, { timeout: 1000 });
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Test error message';
    render(<ContactForm {...defaultProps} error={errorMessage} />);
    
    // Verify error alert is displayed with correct styling
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveClass('bg-red-50');
    expect(errorElement).toHaveTextContent(errorMessage.toLowerCase());
  });

  it('handles form submission flow correctly', async () => {
    render(<ContactForm {...defaultProps} />);
    const form = screen.getByRole('form');
    
    await act(async () => {
      fireEvent.submit(form);
      // Wait for all promises to resolve
      await Promise.resolve();
    });

    // Verify payment form appears after successful submission
    await waitFor(() => {
      const paymentForm = screen.getByTestId('payment-form');
      expect(paymentForm).toBeInTheDocument();
      expect(paymentForm).toHaveClass('payment-form');
    }, { timeout: 2000 });  // Increased timeout for API calls

    // Verify API calls
    expect(supabase.logQuote).toHaveBeenCalledWith(expect.any(Object));
    expect(supabase.createBooking).toHaveBeenCalledWith(expect.any(Object));
  });

  it('shows guest checkout message when isGuest is true', () => {
    render(<ContactForm {...defaultProps} isGuest={true} />);
    
    // Verify guest checkout message appears with correct styling
    const guestMessage = screen.getByText(/guest checkout/i);
    const messageContainer = guestMessage.closest('div');
    expect(guestMessage).toBeInTheDocument();
    expect(messageContainer).toHaveClass('bg-blue-50', 'text-blue-700');
  });
});