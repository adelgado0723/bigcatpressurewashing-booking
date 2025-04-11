import { Service, ServiceQuote } from '../types';

export const getTotalPrice = (service: Service, quote: ServiceQuote): number => {
  let price = service.baseRate * (quote.size ? parseFloat(quote.size) : 1);

  if (quote.material && service.materialMultipliers) {
    const materialMultiplier = service.materialMultipliers[quote.material] || 1;
    price *= materialMultiplier;
  }

  if (quote.stories && service.storyMultipliers) {
    const storyMultiplier = service.storyMultipliers[quote.stories] || 1;
    price *= storyMultiplier;
  }

  if (quote.roofPitch && service.roofPitchMultipliers) {
    const pitchMultiplier = service.roofPitchMultipliers[quote.roofPitch] || 1;
    price *= pitchMultiplier;
  }

  return Math.max(price, service.minimum || price);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 