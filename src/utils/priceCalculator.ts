import { Service } from '@/types';

interface PriceCalculationOptions {
  service: Service;
  squareFootage?: number;
  stories?: number;
  roofPitch?: number;
}

export function calculateServicePrice(options: PriceCalculationOptions): number {
  const { service, squareFootage = 0, stories = 1, roofPitch = 0 } = options;
  
  let basePrice = service.baseRate;
  
  // Apply square footage multiplier if applicable
  if (squareFootage > 0) {
    basePrice *= squareFootage;
  }
  
  // Apply stories multiplier
  if (stories > 1) {
    basePrice *= (1 + (stories - 1) * 0.2); // 20% increase per additional story
  }
  
  // Apply roof pitch multiplier
  if (roofPitch > 0) {
    basePrice *= (1 + roofPitch * 0.1); // 10% increase per unit of roof pitch
  }
  
  return Math.round(basePrice * 100) / 100; // Round to 2 decimal places
} 