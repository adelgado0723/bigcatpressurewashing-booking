import { ServiceQuote } from '../types';
import { services } from '../constants';

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const getServiceSummary = (quote: ServiceQuote): string => {
  const service = services.find((s) => s.id === quote.serviceId);
  if (!service) return '';
  
  let summary = `${service.name} - ${quote.size} ${service.unit}`;
  if (quote.material) summary += ` (${quote.material})`;
  if (quote.stories) summary += ` - ${quote.stories} stories`;
  if (quote.roofPitch) summary += ` - ${quote.roofPitch}`;
  return summary;
};