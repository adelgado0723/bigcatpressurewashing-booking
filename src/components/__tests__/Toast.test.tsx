import { fireEvent, render, screen } from '@testing-library/react';
import { Toast } from '../Toast';
import { describe, it, expect, vi } from 'vitest';

describe('Toast', () => {
  it('renders success toast correctly', () => {
    render(
      <Toast
        message="Success message"
        type="success"
        visible={true}
        onHide={() => {}}
      />
    );

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders error toast correctly', () => {
    render(
      <Toast
        message="Error message"
        type="error"
        visible={true}
        onHide={() => {}}
      />
    );

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders info toast correctly', () => {
    render(
      <Toast
        message="Info message"
        type="info"
        visible={true}
        onHide={() => {}}
      />
    );

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('calls onHide when close button is clicked', () => {
    const onHide = vi.fn();
    render(
      <Toast
        message="Test message"
        type="info"
        visible={true}
        onHide={onHide}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onHide).toHaveBeenCalled();
  });

  it('does not render when visible is false', () => {
    render(
      <Toast
        message="Test message"
        type="info"
        visible={false}
        onHide={() => {}}
      />
    );

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });
}); 