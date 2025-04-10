import React from 'react';
import { Droplets, Home, CloudRain, Router as Gutter } from 'lucide-react';
import { Service, RoofPitchMultiplier, StoriesMultiplier } from '../types';

export const services: Service[] = [
  {
    id: 'concrete',
    name: 'Concrete Cleaning',
    icon: <Droplets className="w-8 h-8" />,
   // imageUrl: 'https://images.unsplash.com/photo-1578167635648-df79e1e8b19d?auto=format&fit=crop&q=80',
    description: 'Professional concrete cleaning for driveways, patios, and walkways',
    materialRequired: false,
    baseRate: 0.25,
    minimum: 199,
    unit: 'sqft'
  },
  {
    id: 'house',
    name: 'House Cleaning',
    icon: <Home className="w-8 h-8" />,
   // imageUrl: 'https://images.unsplash.com/photo-1568107964434-e3e6c636cee7?auto=format&fit=crop&q=80',
    description: 'Exterior house washing to remove dirt, mold, and mildew',
    materialRequired: true,
    baseRate: 0.20,
    minimum: 299,
    unit: 'sqft'
  },
  {
    id: 'roof',
    name: 'Roof Cleaning',
    icon: <CloudRain className="w-8 h-8" />,
  //  imageUrl: 'https://images.unsplash.com/photo-1632759145351-1d764a4ac15d?auto=format&fit=crop&q=80',
    description: 'Safe and effective roof cleaning to remove stains and algae',
    materialRequired: true,
    baseRate: 0.33,
    minimum: 299,
    unit: 'sqft'
  },
  {
    id: 'gutter',
    name: 'Gutter Cleaning',
    icon: <Gutter className="w-8 h-8" />,
  //  imageUrl: 'https://images.unsplash.com/photo-1631198591052-80d27f3c63c6?auto=format&fit=crop&q=80',
    description: 'Complete gutter cleaning and maintenance',
    materialRequired: false,
    baseRate: 1.0,
    minimum: 199,
    unit: 'ft'
  },
];

export const buildingMaterials = {
  vinyl: 1.0,
  brick: 1.3,
  stucco: 1.5
};

export const roofMaterials = {
  'asphalt shingles': 1.0,
  steel: 1.2,
  tile: 1.5
};

export const roofPitchMultipliers: RoofPitchMultiplier = {
  'low pitch': 1.0,
  'medium pitch': 1.2,
  'high pitch': 1.5
};

export const storiesMultipliers: StoriesMultiplier = {
  '1': 1.0,
  '2': 1.5,
  '3': 2.0
};