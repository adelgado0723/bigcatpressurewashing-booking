import { vi } from 'vitest';
import { Stripe } from '@stripe/stripe-js';

// Create a complete mock of the Stripe interface
export const createStripeMock = (overrides = {}) => ({
  elements: vi.fn(),
  createPaymentMethod: vi.fn().mockResolvedValue({
    paymentMethod: { id: 'pm_test_123' },
  }),
  confirmPayment: vi.fn().mockResolvedValue({
    paymentIntent: { status: 'succeeded' },
  }),
  redirectToCheckout: vi.fn(),
  confirmAcssDebitPayment: vi.fn(),
  confirmUsBankAccountPayment: vi.fn(),
  confirmCardPayment: vi.fn(),
  confirmCardSetup: vi.fn(),
  confirmAlipayPayment: vi.fn(),
  confirmAuBecsDebitPayment: vi.fn(),
  confirmBancontactPayment: vi.fn(),
  confirmBoletoPayment: vi.fn(),
  confirmEpsPayment: vi.fn(),
  confirmFpxPayment: vi.fn(),
  confirmGiropayPayment: vi.fn(),
  confirmGrabPayPayment: vi.fn(),
  confirmIdealPayment: vi.fn(),
  confirmOxxoPayment: vi.fn(),
  confirmP24Payment: vi.fn(),
  confirmSepaDebitPayment: vi.fn(),
  confirmSofortPayment: vi.fn(),
  createToken: vi.fn(),
  createSource: vi.fn(),
  retrieveSource: vi.fn(),
  retrievePaymentIntent: vi.fn(),
  handleCardAction: vi.fn(),
  createRadarSession: vi.fn(),
  ...overrides,
} as unknown as Stripe);
