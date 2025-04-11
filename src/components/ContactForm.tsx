import React, { useState } from 'react';
import { Service } from '@/types';
import { PaymentForm } from './PaymentForm';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';

interface ContactFormProps {
  services: Service[];
  onSuccess: () => void;
}

export function ContactForm({ services, onSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.createBooking({
        email: formData.email,
        phone: formData.phone,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        total_amount: services.reduce((sum, service) => sum + service.baseRate, 0),
        services: services.map(service => ({
          serviceId: service.id,
          material: 'default',
          size: '1',
          stories: 1,
          roofPitch: 'low',
          price: service.baseRate
        }))
      });

      if (error) throw error;

      setBookingId(data.id);
      showToast({
        message: 'Booking created successfully!',
        type: 'success'
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      showToast({
        message: 'Failed to create booking. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (bookingId) {
    return (
      <PaymentForm
        bookingId={bookingId}
        amount={services.reduce((sum, service) => sum + service.baseRate * 0.3, 0)}
        onSuccess={onSuccess}
        onError={(error) => {
          setError(error.message);
          showToast({
            message: 'Payment failed. Please try again.',
            type: 'error'
          });
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-label="Contact Information">
      {error && (
        <div className="text-red-500 text-sm" role="alert">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          type="text"
          id="address"
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          City
        </label>
        <input
          type="text"
          id="city"
          required
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
          State
        </label>
        <input
          type="text"
          id="state"
          required
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
          ZIP Code
        </label>
        <input
          type="text"
          id="zip"
          required
          value={formData.zip}
          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        {isLoading ? 'Creating Booking...' : 'Create Booking'}
      </button>
    </form>
  );
}