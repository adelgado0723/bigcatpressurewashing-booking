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
  materialMultipliers?: MaterialMultiplier;
  storyMultipliers?: StoriesMultiplier;
  roofPitchMultipliers?: RoofPitchMultiplier;
}

export interface ServiceQuote {
  serviceId: string;
  material?: string;
  size: string;
  stories?: '1' | '2' | '3';
  roofPitch?: 'low pitch' | 'medium pitch' | 'high pitch';
  price: number;
}

export interface MaterialMultiplier {
  [key: string]: number;
}

export interface RoofPitchMultiplier {
  'low pitch': number;
  'medium pitch': number;
  'high pitch': number;
}

export interface StoriesMultiplier {
  '1': number;
  '2': number;
  '3': number;
}

export interface ContactInfo {
  email: string;
  phone: string;
  name: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}