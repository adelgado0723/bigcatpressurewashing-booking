import '@testing-library/jest-dom';
import { afterEach, expect, Mock } from 'vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('../config/env', () => ({
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key'
}));

// Extend expect with jest-dom matchers
expect.extend({
  toHaveBeenCalledWithError(received: Mock, errorMessage: string) {
    const { isNot } = this;
    return {
      pass: received.mock.calls.some((call: any[]) => 
        call[0] instanceof Error && call[0].message === errorMessage
      ),
      message: () => 
        `expected ${received.getMockName()} ${isNot ? 'not ' : ''}to have been called with error: ${errorMessage}`,
    };
  },
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.ResizeObserver = mockResizeObserver;

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