import { z } from 'zod';

export const serviceDetailsSchema = z.object({
  material: z.string().optional(),
  size: z.string().min(1, 'Size is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Size must be a positive number'
  ),
  stories: z.enum(['1', '2', '3']).optional(),
  roofPitch: z.enum(['low pitch', 'medium pitch', 'high pitch']).optional(),
});

export const contactSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  name: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(5, 'ZIP code must be at least 5 characters'),
});

export type ServiceDetailsFormData = z.infer<typeof serviceDetailsSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;