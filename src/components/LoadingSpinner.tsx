import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex justify-center items-center" role="status" aria-label="Loading">
      <div
        className={`animate-spin rounded-full border-b-2 border-gray-900 ${sizeClasses[size]} ${className}`}
      />
    </div>
  );
};