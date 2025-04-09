import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, User, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { ServiceQuote } from '../types';
import { contactSchema } from '../lib/validations';
import { LoadingSpinner } from './LoadingSpinner';
import { PaymentForm } from './PaymentForm';
import { supabase } from '../lib/supabase';

interface ContactFormProps {
  email: string;
  phone: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  loading: boolean;
  error: string | null;
  session: any;
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
  session,
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
    try {
      contactSchema.parse({
        email,
        phone,
        name,
        address,
        city,
        state,
        zip,
      });
      setValidationErrors({});
      return true;
    } catch (error: any) {
      if (error.errors) {
        const formattedErrors: { [key: string]: string } = {};
        error.errors.forEach((err: any) => {
          const path = err.path[0];
          formattedErrors[path] = err.message;
        });
        setValidationErrors(formattedErrors);
      }
      return false;
    }
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
        submit: error.message || 'Failed to submit booking',
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">
          Contact Information
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </div>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
            required
            disabled={submitting}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone (Optional)
            </div>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="(123) 456-7890"
            disabled={submitting}
          />
          {validationErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Name (Optional)
          </div>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Your name"
          disabled={submitting}
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Service Location</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Street Address
            </div>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="123 Main St"
            required
            disabled={submitting}
          />
          {validationErrors.address && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="City"
              required
              disabled={submitting}
            />
            {validationErrors.city && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.state ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="State"
              required
              disabled={submitting}
            />
            {validationErrors.state && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.state}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => onZipChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.zip ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ZIP"
              required
              disabled={submitting}
            />
            {validationErrors.zip && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.zip}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t">
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
                  {formSubmitted && (
                    <p className="text-sm text-gray-600">{formatPrice(quote.price)}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                {formSubmitted ? (
                  <>
                    <p className="text-lg font-semibold text-gray-800">
                      Total: {formatPrice(getTotalPrice()!)}
                    </p>
                    <p className="text-sm text-gray-600">Deposit required: {formatPrice(50)}</p>
                  </>
                ) : (
                  <p className="text-lg font-medium text-gray-800">
                    Submit form to view pricing
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="border border-gray-300 text-gray-600 rounded-lg px-6 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" /> Processing...
              </>
            ) : (
              <>
                Submit <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {validationErrors.submit && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {validationErrors.submit}
          </div>
        )}
      </div>
    </form>
  );
}