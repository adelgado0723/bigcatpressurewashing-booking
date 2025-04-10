import React from 'react';
import { Check, Trash2, ArrowRight } from 'lucide-react';
import { ServiceQuote } from '../types';

interface ServiceQuoteListProps {
  quotes: ServiceQuote[];
  onRemove: (index: number) => void;
  onContinue: () => void;
  showPrices: boolean;
  formatPrice: (price: number) => string;
  getTotalPrice: () => number | null;
  getServiceSummary: (quote: ServiceQuote) => string;
}

export function ServiceQuoteList({ 
  quotes, 
  onRemove, 
  onContinue,
  showPrices,
  formatPrice, 
  getTotalPrice,
  getServiceSummary,
}: ServiceQuoteListProps) {
  const totalPrice = getTotalPrice();

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Selected Services</h3>
      <div className="space-y-4">
        {quotes.map((quote, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-800">{getServiceSummary(quote)}</p>
                {showPrices && (
                  <p className="text-sm text-gray-600">{formatPrice(quote.price)}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700"
              aria-label="Remove Service"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        <div className="flex justify-end pt-4 border-t">
          {showPrices && totalPrice && (
            <div className="mr-4">
              <p className="text-lg font-semibold text-gray-800">
                Total: {formatPrice(totalPrice)}
              </p>
            </div>
          )}
          <button
            onClick={onContinue}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Get Quote
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}