import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ServiceCard } from '../ServiceCard';
import { Droplets } from 'lucide-react';

describe('ServiceCard', () => {
  const mockService = {
    id: 'concrete',
    name: 'Concrete Cleaning',
    icon: <Droplets className="w-8 h-8" />,
    imageUrl: 'https://example.com/concrete.jpg',
    description: 'Professional concrete cleaning for driveways, patios, and walkways',
    materialRequired: false,
    baseRate: 0.25,
    minimum: 199,
    unit: 'sqft'
  };

  const renderServiceCard = (props = {}) => {
    const defaultProps = {
      service: mockService,
      isSelected: false,
      onSelect: vi.fn()
    };
    return render(<ServiceCard {...defaultProps} {...props} />);
  };

  it('renders service information correctly', () => {
    renderServiceCard();
    
    expect(screen.getByText('Concrete Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Professional concrete cleaning for driveways, patios, and walkways')).toBeInTheDocument();
  });

  it('displays the service image when provided', () => {
    renderServiceCard();
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/concrete.jpg');
    expect(image).toHaveAttribute('alt', 'Concrete Cleaning');
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    renderServiceCard({ onSelect });
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('concrete');
  });

  it('applies selected class when isSelected is true', () => {
    renderServiceCard({ isSelected: true });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-blue-500');
    expect(button).toHaveClass('bg-blue-50');
  });

  it('applies hover styles when not selected', () => {
    renderServiceCard();
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-gray-200');
    expect(button).toHaveClass('hover:border-blue-300');
    expect(button).toHaveClass('hover:bg-gray-50');
  });

  it('handles missing image by showing icon', () => {
    const serviceWithoutImage = {
      ...mockService,
      imageUrl: undefined
    };
    
    renderServiceCard({ service: serviceWithoutImage });
    
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('service-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderServiceCard({ className: 'custom-card' });
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('custom-card');
  });

  it('renders with custom test id', () => {
    renderServiceCard({ 'data-testid': 'custom-card' });
    expect(screen.getByTestId('custom-card')).toBeInTheDocument();
  });

  it('applies custom styles', () => {
    const customStyles = { backgroundColor: 'red' };
    renderServiceCard({ style: customStyles });
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('style', 'background-color: red;');
  });

  it('handles keyboard navigation', () => {
    const onSelect = vi.fn();
    renderServiceCard({ onSelect });
    
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    
    expect(onSelect).toHaveBeenCalledWith('concrete');
  });
}); 