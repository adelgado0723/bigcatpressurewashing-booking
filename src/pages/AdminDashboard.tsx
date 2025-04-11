import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { BOOKING_STATUS, PAYMENT_STATUS } from '@/constants/booking';

interface QuoteAnalytics {
  total: number;
  confirmed: number;
  cancelled: number;
  pending: number;
}

interface ConversionMetrics {
  conversionRate: number;
  averageQuoteValue: number;
  totalRevenue: number;
}

interface UserSession {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export function AdminDashboard() {
  const { toast } = useToast();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [quotes, setQuotes] = useState<QuoteAnalytics>({
    total: 0,
    confirmed: 0,
    cancelled: 0,
    pending: 0,
  });
  const [metrics, setMetrics] = useState<ConversionMetrics>({
    conversionRate: 0,
    averageQuoteValue: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session as UserSession);
        setIsAdmin(session?.user?.role === 'admin');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to check session',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [toast]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAdmin) return;

      try {
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select('*');

        if (quotesError) throw quotesError;

        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*');

        if (bookingsError) throw bookingsError;

        const analytics: QuoteAnalytics = {
          total: quotesData.length,
          confirmed: quotesData.filter(q => q.status === BOOKING_STATUS.CONFIRMED).length,
          cancelled: quotesData.filter(q => q.status === BOOKING_STATUS.CANCELLED).length,
          pending: quotesData.filter(q => q.status === BOOKING_STATUS.PENDING).length,
        };

        const revenue = bookingsData
          .filter(b => b.payment_status === PAYMENT_STATUS.PAID)
          .reduce((sum, b) => sum + b.total_amount, 0);

        const metrics: ConversionMetrics = {
          conversionRate: analytics.confirmed / analytics.total * 100,
          averageQuoteValue: revenue / analytics.confirmed || 0,
          totalRevenue: revenue,
        };

        setQuotes(analytics);
        setMetrics(metrics);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch analytics',
          variant: 'destructive',
        });
      }
    };

    fetchAnalytics();
  }, [isAdmin, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Admin Dashboard</h1>
      
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Total Quotes</h2>
          <p className="text-3xl font-bold">{quotes.total}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Confirmed</h2>
          <p className="text-3xl font-bold">{quotes.confirmed}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Cancelled</h2>
          <p className="text-3xl font-bold">{quotes.cancelled}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Pending</h2>
          <p className="text-3xl font-bold">{quotes.pending}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Conversion Rate</h2>
          <p className="text-3xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Average Quote Value</h2>
          <p className="text-3xl font-bold">${metrics.averageQuoteValue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Total Revenue</h2>
          <p className="text-3xl font-bold">${metrics.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold">Recent Quotes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {quotes.total === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-center">
                    No quotes found
                  </td>
                </tr>
              ) : (
                <tr>
                  <td className="px-4 py-2">Loading...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}