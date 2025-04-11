import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ServiceQuoteList } from '../ServiceQuoteList';
import { ServiceQuote } from '../../types';

describe('ServiceQuoteList', () => {
  const mockQuotes: ServiceQuote[] = [
    {
      serviceId: '1',
      material: 'vinyl',
      size: '1000',
      stories: 2,
      roofPitch: 'low pitch',
      price: 500
    },
    {
      serviceId: '2',
      material: 'brick',
      size: '800',
      stories: 1,
      roofPitch: 'medium pitch',
      price: 400
    }
  ];

  const mockProps = {
    quotes: mockQuotes,
    onRemove: vi.fn(),
    onContinue: vi.fn(),
    showPrices: true,
    formatPrice: (price: number) => `$${price.toFixed(2)}`,
    getTotalPrice: () => mockQuotes.reduce((sum, quote) => sum + quote.price, 0),
    getServiceSummary: (quote: ServiceQuote) => `Service ${quote.serviceId}`
  };

  const renderServiceQuoteList = (props = mockProps) => {
    return render(
      <ServiceQuoteList {...props} />
    );
  };

  it('renders list of service quotes', () => {
    renderServiceQuoteList();
    
    expect(screen.getByText(/service 1/i)).toBeInTheDocument();
    expect(screen.getByText(/service 2/i)).toBeInTheDocument();
  });

  it('displays price for each quote', () => {
    renderServiceQuoteList();
    
    expect(screen.getByText(/\$500.00/i)).toBeInTheDocument();
    expect(screen.getByText(/\$400.00/i)).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', async () => {
    const onRemove = vi.fn();
    renderServiceQuoteList({ ...mockProps, onRemove });
    
    const removeButtons = screen.getAllByRole('button', { name: /remove service/i });
    fireEvent.click(removeButtons[0]);
    
    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith(0);
    });
  });

  it('calls onContinue when Get Quote button is clicked', async () => {
    const onContinue = vi.fn();
    renderServiceQuoteList({ ...mockProps, onContinue });
    
    const continueButton = screen.getByRole('button', { name: /get quote/i });
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
    });
  });

  it('shows total price when showPrices is true', () => {
    renderServiceQuoteList();
    
    const total = mockQuotes.reduce((sum, quote) => sum + quote.price, 0);
    expect(screen.getByText(`Total: $${total.toFixed(2)}`)).toBeInTheDocument();
  });

  it('does not show prices when showPrices is false', () => {
    renderServiceQuoteList({ ...mockProps, showPrices: false });
    
    expect(screen.queryByText(/\$\d+\.\d{2}/i)).not.toBeInTheDocument();
  });

  it('handles empty quotes list', () => {
    renderServiceQuoteList({ ...mockProps, quotes: [] });
    
    expect(screen.getByText(/selected services/i)).toBeInTheDocument();
    expect(screen.queryByText(/service \d/i)).not.toBeInTheDocument();
  });
}); 