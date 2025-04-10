import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toast } from '../Toast';

describe('Toast', () => {
  const renderToast = (props = {}) => {
    return render(
      <Toast
        message="Test message"
        type="success"
        onClose={() => {}}
        {...props}
      />
    );
  };

  it('renders toast message', () => {
    renderToast();
    expect(screen.getByText(/test message/i)).toBeInTheDocument();
  });

  it('applies correct styling for success type', () => {
    renderToast({ type: 'success' });
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-green-50');
    expect(toast).toHaveClass('text-green-800');
    expect(toast).toHaveClass('border-green-500');
  });

  it('applies correct styling for error type', () => {
    renderToast({ type: 'error' });
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-red-50');
    expect(toast).toHaveClass('text-red-800');
    expect(toast).toHaveClass('border-red-500');
  });

  it('applies correct styling for warning type', () => {
    renderToast({ type: 'warning' });
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-yellow-50');
    expect(toast).toHaveClass('text-yellow-800');
    expect(toast).toHaveClass('border-yellow-500');
  });

  it('applies correct styling for info type', () => {
    renderToast({ type: 'info' });
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-blue-50');
    expect(toast).toHaveClass('text-blue-800');
    expect(toast).toHaveClass('border-blue-500');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderToast({ onClose });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('auto-closes after duration', async () => {
    const onClose = vi.fn();
    renderToast({ onClose, duration: 1000 });
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 1500 });
  });

  it('does not auto-close when duration is 0', async () => {
    const onClose = vi.fn();
    renderToast({ onClose, duration: 0 });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders custom icon when provided', () => {
    const CustomIcon = () => <span data-testid="custom-icon">🎉</span>;
    renderToast({ icon: <CustomIcon /> });
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onAction = vi.fn();
    renderToast({
      action: {
        label: 'Retry',
        onClick: onAction
      }
    });
    
    const actionButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(actionButton);
    
    expect(onAction).toHaveBeenCalled();
  });

  it('handles long messages with ellipsis', () => {
    const longMessage = 'This is a very long message that should be truncated with ellipsis when it exceeds the maximum width of the toast container. This is a very long message that should be truncated with ellipsis when it exceeds the maximum width of the toast container.';
    renderToast({ message: longMessage });
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveStyle({ maxWidth: '400px' });
    expect(toast).toHaveStyle({ textOverflow: 'ellipsis' });
  });

  it('applies custom className', () => {
    const customClass = 'my-custom-class';
    renderToast({ className: customClass });
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass(customClass);
  });

  it('handles multiple toasts with different types', () => {
    const { rerender } = renderToast({ type: 'success' });
    expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
    
    rerender(
      <Toast
        message="Error message"
        type="error"
        onClose={() => {}}
      />
    );
    expect(screen.getByRole('alert')).toHaveClass('bg-red-50');
    
    rerender(
      <Toast
        message="Warning message"
        type="warning"
        onClose={() => {}}
      />
    );
    expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50');
  });
}); 