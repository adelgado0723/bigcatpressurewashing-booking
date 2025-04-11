import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ServiceDetailsForm } from '../ServiceDetailsForm';
import { Service } from '../../types';
import { buildingMaterials } from '../../constants';

describe('ServiceDetailsForm', () => {
  const mockService: Service = {
    id: 'house',
    name: 'House Cleaning',
    icon: null,
    description: 'House pressure washing service',
    materialRequired: true,
    baseRate: 0.15,
    minimum: 100,
    unit: 'sq ft'
  };

  const mockProps = {
    service: mockService,
    material: '',
    size: '',
    stories: '1' as const,
    roofPitch: 'low pitch' as const,
    onMaterialChange: vi.fn(),
    onSizeChange: vi.fn(),
    onStoriesChange: vi.fn(),
    onRoofPitchChange: vi.fn(),
    onCancel: vi.fn(),
    onAdd: vi.fn()
  };

  const renderServiceDetailsForm = (props = mockProps) => {
    return render(<ServiceDetailsForm {...props} />);
  };

  it('renders form with correct fields for house service', () => {
    renderServiceDetailsForm();
    
    expect(screen.getByLabelText(/Surface Material/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Size \(sq ft\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Stories/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Roof Pitch/i)).not.toBeInTheDocument();
  });

  it('renders form with correct fields for roof service', () => {
    const roofService: Service = {
      ...mockService,
      id: 'roof',
      name: 'Roof Cleaning'
    };
    
    renderServiceDetailsForm({ ...mockProps, service: roofService });
    
    expect(screen.getByLabelText(/Surface Material/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Size \(sq ft\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Roof Pitch/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Number of Stories/i)).not.toBeInTheDocument();
  });

  it('shows material options based on service type', () => {
    renderServiceDetailsForm();
    
    const materialSelect = screen.getByLabelText(/Surface Material/i);
    fireEvent.click(materialSelect);
    
    Object.keys(buildingMaterials).forEach(material => {
      expect(screen.getByText(material.charAt(0).toUpperCase() + material.slice(1))).toBeInTheDocument();
    });
  });

  it('validates form before adding service', async () => {
    const onAdd = vi.fn();
    renderServiceDetailsForm({ ...mockProps, onAdd });
    
    // Try to add without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /Add Service/i }));
    
    await waitFor(() => {
      expect(onAdd).not.toHaveBeenCalled();
      expect(screen.getByText(/Size must be a positive number/i)).toBeInTheDocument();
    });
  });

  it('validates size is a positive number', async () => {
    const onAdd = vi.fn();
    renderServiceDetailsForm({ ...mockProps, onAdd });
    
    // Try to add with invalid size
    fireEvent.change(screen.getByLabelText(/Size \(sq ft\)/i), { target: { value: '-100' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Service/i }));
    
    await waitFor(() => {
      expect(onAdd).not.toHaveBeenCalled();
      expect(screen.getByText(/Size must be a positive number/i)).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    renderServiceDetailsForm({ ...mockProps, onCancel });
    
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('handles material change', () => {
    const onMaterialChange = vi.fn();
    renderServiceDetailsForm({ ...mockProps, onMaterialChange });
    
    const materialSelect = screen.getByLabelText(/Surface Material/i);
    fireEvent.change(materialSelect, { target: { value: 'vinyl' } });
    expect(onMaterialChange).toHaveBeenCalledWith('vinyl');
  });

  it('handles size change', () => {
    const onSizeChange = vi.fn();
    renderServiceDetailsForm({ ...mockProps, onSizeChange });
    
    fireEvent.change(screen.getByLabelText(/Size \(sq ft\)/i), { target: { value: '2000' } });
    expect(onSizeChange).toHaveBeenCalledWith('2000');
  });

  it('handles stories change', () => {
    const onStoriesChange = vi.fn();
    renderServiceDetailsForm({ ...mockProps, onStoriesChange });
    
    fireEvent.change(screen.getByLabelText(/Number of Stories/i), { target: { value: '2' } });
    expect(onStoriesChange).toHaveBeenCalledWith('2');
  });

  it('handles roof pitch change for roof service', () => {
    const onRoofPitchChange = vi.fn();
    const roofService: Service = {
      ...mockService,
      id: 'roof',
      name: 'Roof Cleaning'
    };
    
    renderServiceDetailsForm({ ...mockProps, service: roofService, onRoofPitchChange });
    
    fireEvent.change(screen.getByLabelText(/Roof Pitch/i), { target: { value: 'medium pitch' } });
    expect(onRoofPitchChange).toHaveBeenCalledWith('medium pitch');
  });

  it('calls onAdd when form is valid', async () => {
    const onAdd = vi.fn();
    renderServiceDetailsForm({ 
      ...mockProps, 
      onAdd,
      material: 'vinyl',
      size: '2000',
      stories: '1' as const
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Add Service/i }));
    
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
    });
  });
}); 