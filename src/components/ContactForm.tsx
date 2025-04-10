import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, User, MapPin, ArrowRight } from 'lucide-react';
import { ServiceQuote } from '../types';
import { PaymentForm } from './PaymentForm';
import { supabase } from '../lib/supabase';

export interface ContactFormProps {
  email: string;
  phone: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  loading: boolean;
  error: string | null;
  serviceQuotes: ServiceQuote[];
  isGuest: boolean;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onZipChange: (value: string) => void;
  onBack: () => void;
  formatPrice: (price: number) => string;
  getTotalPrice: () => number | null;
  getServiceSummary: (quote: ServiceQuote) => string;
}

export function ContactForm({
  email,
  phone,
  name,
  address,
  city,
  state,
  zip,
  loading,
  error,
  serviceQuotes,
  isGuest,
  onEmailChange,
  onPhoneChange,
  onNameChange,
  onAddressChange,
  onCityChange,
  onStateChange,
  onZipChange,
  onBack,
  formatPrice,
  getTotalPrice,
  getServiceSummary,
}: ContactFormProps) {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validateContactInfo = () => {
    const errors: Record<string, string> = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = 'Invalid email address';
    }
    if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
      errors.phone = 'Invalid phone number';
    }
    if (!address) {
      errors.address = 'Address is required';
    }
    if (!city) {
      errors.city = 'City is required';
    }
    if (!state) {
      errors.state = 'State is required';
    }
    if (!zip) {
      errors.zip = 'ZIP code is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateContactInfo()) {
      return;
    }

    try {
      const totalAmount = getTotalPrice();
      if (!totalAmount) return;

      setSubmitting(true);
      setFormSubmitted(true);

      // Log the quote
      await supabase.logQuote({
        email,
        services: serviceQuotes.map(quote => ({
          serviceType: quote.serviceId,
          size: parseFloat(quote.size),
          material: quote.material,
          stories: quote.stories ? parseInt(quote.stories) : undefined,
          roofPitch: quote.roofPitch,
          price: quote.price,
        })),
        totalAmount,
      });

      // Create the booking
      const { data } = await supabase.createBooking({
        email,
        phone,
        name,
        address,
        city,
        state,
        zip,
        totalAmount,
        depositAmount: 50,
        services: serviceQuotes,
        isGuest,
      });

      setBookingId(data.id);
      setShowPayment(true);
    } catch (error: any) {
      console.error('Submission error:', error);
      setValidationErrors({
        submit: 'failed to submit booking',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (showPayment && bookingId) {
    return (
      <PaymentForm
        bookingId={bookingId}
        amount={50}
        onSuccess={() => window.location.href = `/booking-confirmation?id=${bookingId}`}
        onError={(error) => setValidationErrors({ submit: error })}
      />
    );
  }

  return (
    <form 
      role="form"
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {error && (
        <div role="alert" className="p-4 mb-4 text-red-700 bg-red-50 rounded-lg">
          {error.toString().toLowerCase()}
        </div>
      )}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-semibold text-space_cadet">
          Contact Information
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-space_cadet mb-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </div>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-steel_blue focus:border-steel_blue ${
              validationErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
            required
            disabled={loading || submitting}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-space_cadet mb-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </div>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-steel_blue focus:border-steel_blue ${
              validationErrors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="(123) 456-7890"
            disabled={loading || submitting}
          />
          {validationErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-space_cadet mb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Name
            </div>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel_blue focus:border-steel_blue"
            placeholder="John Doe"
            disabled={loading || submitting}
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-space_cadet mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Street Address
            </div>
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-steel_blue focus:border-steel_blue ${
              validationErrors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="123 Main St"
            required
            disabled={loading || submitting}
          />
          {validationErrors.address && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-space_cadet mb-2">City</label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-steel_blue focus:border-steel_blue ${
              validationErrors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="City"
            required
            disabled={loading || submitting}
          />
          {validationErrors.city && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
          )}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-space_cadet mb-2">State</label>
          <input
            id="state"
            type="text"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-steel_blue focus:border-steel_blue ${
              validationErrors.state ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="State"
            required
            disabled={loading || submitting}
          />
          {validationErrors.state && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.state}</p>
          )}
        </div>

        <div>
          <label htmlFor="zip" className="block text-sm font-medium text-space_cadet mb-2">ZIP Code</label>
          <input
            id="zip"
            type="text"
            value={zip}
            onChange={(e) => onZipChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-steel_blue focus:border-steel_blue ${
              validationErrors.zip ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="ZIP"
            required
            disabled={loading || submitting}
          />
          {validationErrors.zip && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.zip}</p>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-space_cadet mb-4">Order Summary</h3>
          {isGuest && (
            <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg">
              Guest Checkout - No account required
            </div>
          )}
          <div className="space-y-4">
            {serviceQuotes.map((quote, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-alice_blue p-4 rounded-lg"
              >
                <div>
                  <p className="font-medium text-space_cadet">{getServiceSummary(quote)}</p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <p className="text-lg font-medium text-space_cadet">
                  {formSubmitted ? formatPrice(getTotalPrice() || 0) : 'Submit form to view pricing'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={loading || submitting}
            className="border border-gray-300 text-gray-500 rounded-lg px-6 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <button
            type="submit"
            disabled={loading || submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white bg-steel_blue rounded-lg hover:bg-steel_blue-600 focus:outline-none focus:ring-2 focus:ring-steel_blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Payment
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
}