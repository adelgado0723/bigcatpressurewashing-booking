import React from 'react';
import { Home, Plus, User } from 'lucide-react';

interface ProgressStepsProps {
  currentStep: number;
}

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((stepNumber) => (
          <div
            key={stepNumber}
            className={`flex items-center ${stepNumber < 3 ? 'flex-1' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= stepNumber
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {stepNumber === 1 ? (
                <Home className="w-4 h-4" />
              ) : stepNumber === 2 ? (
                <Plus className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            {stepNumber < 3 && (
              <div
                className={`flex-1 h-1 mx-4 ${
                  currentStep > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-sm font-medium text-gray-600">Select Services</span>
        <span className="text-sm font-medium text-gray-600">Add Details</span>
        <span className="text-sm font-medium text-gray-600">Contact Info</span>
      </div>
    </div>
  );
}