import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import { Clock, Calendar, DollarSign, Package, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Link, Navigate } from 'react-router-dom';

interface BookingService {
  id: string;
  service_type: string;
  material: string | null;
  size: number;
  stories: number | null;
  roof_pitch: string | null;
  price: number;
}

interface Booking {
  id: string;
  created_at: string;
  customer_email: string;
  customer_phone: string | null;
  customer_name: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  total_amount: number;
  deposit_amount: number;
  status: string;
  booking_services: BookingService[];
}

export function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
      if (session) {
        fetchBookings();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchBookings();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_services (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              No Bookings Found
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't made any bookings yet. Start by booking a service!
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book a Service
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h2 className="text-2xl font-semibold text-gray-800">
                Your Booking History
              </h2>
            </div>
            <Link
              to="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book New Service
            </Link>
          </div>

          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap gap-4 justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(booking.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">{formatPrice(booking.total_amount)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Deposit: {formatPrice(booking.deposit_amount)}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Services
                  </h3>
                  <div className="space-y-2">
                    {booking.booking_services.map((service) => (
                      <div
                        key={service.id}
                        className="bg-gray-50 rounded p-3 text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{service.service_type}</span>
                            <div className="text-gray-600">
                              {service.size} {service.service_type.toLowerCase().includes('gutter') ? 'ft' : 'sqft'}
                              {service.material && ` - ${service.material}`}
                              {service.stories && ` - ${service.stories} ${service.stories === 1 ? 'story' : 'stories'}`}
                              {service.roof_pitch && ` - ${service.roof_pitch}`}
                            </div>
                          </div>
                          <span className="text-gray-700">{formatPrice(service.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 text-sm text-gray-600">
                  <div>{booking.address}</div>
                  <div>{`${booking.city}, ${booking.state} ${booking.zip}`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}