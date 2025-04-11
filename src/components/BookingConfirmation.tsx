import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDetails {
  id: string;
  customer_email: string;
  customer_name: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  total_amount: number;
  deposit_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
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
        const { data: { session } } = await supabase.auth.getSession();
        const authHeader = session?.access_token 
          ? `Bearer ${session.access_token}` 
          : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;

        const endpoint = paymentIntentId
          ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment?bookingId=${bookingId}&paymentIntentId=${paymentIntentId}`
          : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-booking?id=${bookingId}`;

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch booking details');
        }

        const { data } = await response.json();
        setBooking(data);
      } catch (error: unknown) {
        console.error('Error fetching booking:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch booking details');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-center mb-6">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-center text-gray-600 mb-6">{error || 'Unable to retrieve booking details'}</p>
          <Link to="/" className="block text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Booking Confirmed!</h1>
        <p className="text-center text-gray-600 mb-6">
          Your booking has been successfully created and your deposit has been processed.
        </p>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Booking Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Booking ID:</dt>
              <dd className="text-gray-800 font-medium">{booking.id.substring(0, 8)}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-500">Date:</dt>
              <dd className="text-gray-800 font-medium">
                {format(new Date(booking.created_at), 'MMMM d, yyyy')}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-500">Status:</dt>
              <dd className="text-gray-800 font-medium capitalize">
                {booking.status}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-500">Location:</dt>
              <dd className="text-gray-800 font-medium">
                {booking.city}, {booking.state}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-500">Total Amount:</dt>
              <dd className="text-gray-800 font-medium">
                {formatPrice(booking.total_amount)}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-500">Deposit Paid:</dt>
              <dd className="text-gray-800 font-medium">
                {formatPrice(booking.deposit_amount)}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-500">Balance Due:</dt>
              <dd className="text-gray-800 font-medium">
                {formatPrice(booking.total_amount - booking.deposit_amount)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
          <p className="text-sm text-green-800">
            <strong>Next Steps:</strong> Our team will contact you within 24-48 hours to confirm your booking details and schedule your service.
          </p>
        </div>

        <Link to="/" className="block text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          <div className="flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </div>
        </Link>
      </div>
    </div>
  );
}