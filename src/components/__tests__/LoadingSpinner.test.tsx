import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  const renderLoadingSpinner = (props = {}) => {
    return render(<LoadingSpinner {...props} />);
  };

  it('renders loading spinner', () => {
    renderLoadingSpinner();
    const spinner = screen.getByRole('status', { name: 'Loading' });
    expect(spinner).toBeInTheDocument();
    const spinnerDiv = spinner.querySelector('div');
    expect(spinnerDiv).toBeInTheDocument();
  });

  it('applies sm size class', () => {
    renderLoadingSpinner({ size: 'sm' });
    const spinner = screen.getByRole('status', { name: 'Loading' });
    const spinnerDiv = spinner.querySelector('div');
    expect(spinnerDiv?.classList.toString()).toContain('w-4 h-4');
  });

  it('applies md size class (default)', () => {
    renderLoadingSpinner();
    const spinner = screen.getByRole('status', { name: 'Loading' });
    const spinnerDiv = spinner.querySelector('div');
    expect(spinnerDiv?.classList.toString()).toContain('w-5 h-5');
  });

  it('applies lg size class', () => {
    renderLoadingSpinner({ size: 'lg' });
    const spinner = screen.getByRole('status', { name: 'Loading' });
    const spinnerDiv = spinner.querySelector('div');
    expect(spinnerDiv?.classList.toString()).toContain('w-6 h-6');
  });

  it('applies custom className', () => {
    const customClass = 'my-custom-spinner';
    renderLoadingSpinner({ className: customClass });
    const spinner = screen.getByRole('status', { name: 'Loading' });
    const spinnerDiv = spinner.querySelector('div');
    expect(spinnerDiv?.classList.toString()).toContain(customClass);
  });

  it('has animation class', () => {
    renderLoadingSpinner();
    const spinner = screen.getByRole('status', { name: 'Loading' });
    const spinnerDiv = spinner.querySelector('div');
    expect(spinnerDiv?.classList.toString()).toContain('animate-spin');
  });

  it('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { name: 'Loading' });
    expect(spinner).toBeInTheDocument();
    const spinnerDiv = spinner.querySelector('div');
    expect(spinnerDiv?.classList.toString()).toContain('w-5 h-5'); // Default size
  });
}); 