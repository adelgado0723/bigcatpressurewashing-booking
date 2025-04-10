import React from 'react';
import { LogIn } from 'lucide-react';
import { ServiceQuote } from '../../types';
import { formatPrice, getServiceSummary } from '../../lib/utils';

interface AuthPromptProps {
  onClose: () => void;
  serviceQuotes: ServiceQuote[];
}

export const AuthPrompt: React.FC<AuthPromptProps> = ({
  onClose,
  serviceQuotes
}) => {
  return (
    <div className="text-center space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Ready to Book Your Services
      </h2>
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Summary</h3>
        {serviceQuotes.map((quote, index) => (
          <div key={index} className="text-left mb-3">
            <p className="font-medium">{getServiceSummary(quote)}</p>
          </div>
        ))}
      </div>
      <p className="text-gray-600">
        Create an account to manage your bookings and get exclusive offers
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={onClose}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Continue as Guest
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          Sign In / Sign Up
        </button>
      </div>
    </div>
  );
};