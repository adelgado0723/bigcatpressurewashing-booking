import { ServiceQuote } from '../../types';
import { formatPrice, getServiceSummary } from '../../lib/utils';

interface OrderSummaryProps {
  serviceQuotes: ServiceQuote[];
  showPricing: boolean;
  totalPrice: number | null;
}

export function OrderSummary({ serviceQuotes, showPricing, totalPrice }: OrderSummaryProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h3>
      <div className="space-y-4">
        {serviceQuotes.map((quote, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
          >
            <div>
              <p className="font-medium text-gray-800">{getServiceSummary(quote)}</p>
              {showPricing && (
                <p className="text-sm text-gray-600">{formatPrice(quote.price)}</p>
              )}
            </div>
          </div>
        ))}
        {showPricing && totalPrice && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Total: {formatPrice(totalPrice)}
              </p>
              <p className="text-sm text-gray-600">Deposit required: {formatPrice(50)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}