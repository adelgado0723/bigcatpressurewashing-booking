import { ReactNode } from 'react';

export interface Service {
  id: string;
  name: string;
  icon: ReactNode;
  imageUrl?: string;
  description: string;
  materialRequired: boolean;
  baseRate: number;
  minimum: number;
  unit: string;
  materialMultipliers?: Record<string, number>;
  storyMultipliers?: Record<string, number>;
  roofPitchMultipliers?: Record<string, number>;
} 