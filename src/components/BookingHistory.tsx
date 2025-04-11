import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { BOOKING_STATUS, PAYMENT_STATUS } from '@/constants/booking';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  service_quotes: Array<{
    serviceId: string;
    material: string;
    size: string;
    stories: string;
    roofPitch: string;
    price: number;
  }>;
  status: string;
  payment_status: string;
  total_amount: number;
  deposit_amount: number;
  created_at: string;
}

export function BookingHistory() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user?.email) {
          setError('No user session found');
          return;
        }

        const { data, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_email', session.user.email)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;
        setBookings(data || []);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        toast({
          title: 'Error',
          description: 'Failed to fetch bookings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Return Home
        </Link>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>No bookings found</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Booking History</h1>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Services</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Payment</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-4 py-2">
                  {new Date(booking.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {booking.service_quotes.map((service) => service.serviceId).join(', ')}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      booking.status === BOOKING_STATUS.CONFIRMED
                        ? 'bg-green-100 text-green-800'
                        : booking.status === BOOKING_STATUS.CANCELLED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      booking.payment_status === PAYMENT_STATUS.PAID
                        ? 'bg-green-100 text-green-800'
                        : booking.payment_status === PAYMENT_STATUS.FAILED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {booking.payment_status}
                  </span>
                </td>
                <td className="px-4 py-2">${booking.total_amount.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <Link
                    to={`/booking/${booking.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}