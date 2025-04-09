import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import { CheckCircle2, XCircle, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDetails {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name: string | null;
  total_amount: number;
  deposit_amount: number;
  status: string;
  stripe_payment_status: string;
}

export function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  useEffect(() => {
    const bookingId = searchParams.get('id');
    const paymentIntentId = searchParams.get('payment_intent');
    
    if (!bookingId) {
      setError('Booking ID not found');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        // If we have a payment intent, update the booking status first
        if (paymentIntentId) {
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              stripe_payment_status: 'succeeded',
              status: 'confirmed'
            })
            .eq('id', bookingId)
            .eq('stripe_payment_intent_id', paymentIntentId);

          if (updateError) throw updateError;
        }

        // Fetch the booking details
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        setBooking(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Unable to find booking details'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPaymentSuccessful = booking.stripe_payment_status === 'succeeded';
  console.log(JSON.stringify(booking));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            {isPaymentSuccessful ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Booking Confirmed!
                </h2>
                <p className="text-gray-600">
                  Thank you for choosing Big Cat Pressure Washing
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Payment Failed
                </h2>
                <p className="text-gray-600">
                  There was an issue processing your payment
                </p>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="border-t border-b py-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Booking Details
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-600">Booking Reference</dt>
                  <dd className="text-gray-800 font-medium">{booking.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Date</dt>
                  <dd className="text-gray-800 font-medium">
                    {format(new Date(booking.created_at), 'PPP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Customer</dt>
                  <dd className="text-gray-800 font-medium">
                    {booking.customer_name || booking.customer_email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Total Amount</dt>
                  <dd className="text-gray-800 font-medium">
                    ${booking.total_amount.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Deposit Paid</dt>
                  <dd className="text-gray-800 font-medium">
                    ${booking.deposit_amount.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Status</dt>
                  <dd className={`font-medium ${
                    isPaymentSuccessful ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </dd>
                </div>
              </dl>
            </div>

            {isPaymentSuccessful ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 text-sm">
                  We'll contact you shortly to schedule your service.
                  If you have any questions, please contact us at support@bigcatpressurewashing.com
                </p>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-800 text-sm">
                  Please try booking again or contact us at support@bigcatpressurewashing.com for assistance.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Link
                to="/"
                className="inline-flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Return Home
              </Link>
              {isPaymentSuccessful && (
                <Link
                  to="/history"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  View Bookings
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}