import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Lock, CreditCard, DollarSign, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ bookingId, amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    const getBookingDetails = async () => {
      try {
        const bookingData = await supabase.getBooking(bookingId);
        setBooking(bookingData);
        setTotalAmount(bookingData.total_amount);
      } catch (error) {
        console.error("Error fetching booking details:", error);
      }
    };

    getBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Retrieve the "payment_intent_client_secret" query parameter
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        switch (paymentIntent?.status) {
          case 'succeeded':
            setPaymentStatus('succeeded');
            break;
          case 'processing':
            setError('Your payment is processing.');
            break;
          case 'requires_payment_method':
            setError('Your payment was not successful, please try again.');
            break;
          default:
            setError('Something went wrong.');
            break;
        }
      });
    }
  }, [stripe]);

  useEffect(() => {
    if (paymentStatus === 'succeeded') {
      onSuccess();
    }
  }, [paymentStatus, onSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation?id=${bookingId}`,
        },
      });

      if (submitError) {
        throw submitError;
      }
    } catch (error: any) {
      setError(error.message);
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">
          Payment Details
        </h2>
      </div>

      {/* Price Summary Card */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
          Order Summary
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Deposit Amount:</span>
            <span className="font-medium">{formatPrice(amount)}</span>
          </div>
          
          {totalAmount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Total Service Price:</span>
              <span className="font-medium">{formatPrice(totalAmount)}</span>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t border-blue-200">
          <div className="flex justify-between text-lg font-semibold">
            <span>Due Now:</span>
            <span className="text-blue-700">{formatPrice(amount)}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            The remaining balance will be due upon service completion.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <Lock className="w-4 h-4" />
          <span className="text-sm">Secure payment powered by Stripe</span>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Card Details
              </div>
            </label>
            <PaymentElement />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            Processing Payment...
          </>
        ) : (
          <>
            Pay {formatPrice(amount)}
            <Lock className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              bookingId: props.bookingId,
              amount: props.amount,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        setError(error.message);
        props.onError(error.message);
      }
    };

    initializePayment();
  }, [props.bookingId, props.amount, props.onError]);

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
          },
        },
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
}