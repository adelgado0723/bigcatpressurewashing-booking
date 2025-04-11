import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressSteps } from '../ProgressSteps';

describe('ProgressSteps', () => {
  const renderProgressSteps = (props = {}) => {
    return render(
      <ProgressSteps
        currentStep={1}
        {...props}
      />
    );
  };

  it('renders all step labels', () => {
    renderProgressSteps();
    
    expect(screen.getByText('Select Services')).toBeInTheDocument();
    expect(screen.getByText('Add Details')).toBeInTheDocument();
    expect(screen.getByText('Contact Info')).toBeInTheDocument();
  });

  it('marks current step as active', () => {
    renderProgressSteps({ currentStep: 2 });
    
    const steps = screen.getAllByRole('generic').filter(step => 
      step.firstElementChild?.classList.contains('w-8')
    );
    
    // First two steps should be active (blue)
    expect(steps[0].firstElementChild).toHaveClass('bg-blue-600', 'text-white');
    expect(steps[1].firstElementChild).toHaveClass('bg-blue-600', 'text-white');
    // Last step should be inactive (gray)
    expect(steps[2].firstElementChild).toHaveClass('bg-gray-200', 'text-gray-600');
  });

  it('shows progress lines between steps', () => {
    renderProgressSteps({ currentStep: 2 });
    
    const progressLines = screen.getAllByRole('generic')
      .filter(el => el.classList.contains('h-1'));
    
    // Line between steps 1 and 2 should be blue (completed)
    expect(progressLines[0]).toHaveClass('bg-blue-600');
    // Line between steps 2 and 3 should be gray (pending)
    expect(progressLines[1]).toHaveClass('bg-gray-200');
  });

  it('shows correct icons for each step', () => {
    renderProgressSteps();
    
    const steps = screen.getAllByRole('generic').filter(step => 
      step.firstElementChild?.classList.contains('w-8')
    );
    
    // Check that each step has an icon
    steps.forEach(step => {
      expect(step.querySelector('svg')).toBeInTheDocument();
    });
  });
}); 