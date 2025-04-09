import React from 'react';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service.id)}
      className={`w-full p-6 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-4">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-12 h-12 object-cover rounded-lg"
          />
        ) : (
          <div className="text-blue-600">{service.icon}</div>
        )}
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">{service.name}</h3>
          <p className="text-sm text-gray-600">{service.description}</p>
        </div>
      </div>
    </button>
  );
}