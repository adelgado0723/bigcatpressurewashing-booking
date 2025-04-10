import React from 'react';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

export function ServiceCard({ 
  service, 
  isSelected, 
  onSelect,
  className = '',
  style,
  'data-testid': testId
}: ServiceCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onSelect(service.id);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(service.id)}
      onKeyDown={handleKeyDown}
      className={`w-full p-6 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
      } ${className}`}
      style={style}
      data-testid={testId}
    >
      <div className="flex items-center gap-4">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-12 h-12 object-cover rounded-lg"
          />
        ) : (
          <div className="text-blue-600" data-testid="service-icon">
            {service.icon}
          </div>
        )}
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">{service.name}</h3>
          <p className="text-sm text-gray-600">{service.description}</p>
        </div>
      </div>
    </button>
  );
}