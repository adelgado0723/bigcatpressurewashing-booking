import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  BarChart,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface QuoteAnalytics {
  id: string;
  email: string;
  services: any[];
  total_amount: number;
  quote_time: string;
  converted_to_booking: boolean;
  booking_id: string | null;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
  booking_time: string | null;
  hours_to_convert: number | null;
  hours_to_deposit: number | null;
}

interface ConversionMetrics {
  date: string;
  total_quotes: number;
  converted_quotes: number;
  paid_deposits: number;
  conversion_rate: number;
  deposit_rate: number;
}

export function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [droppedQuotes, setDroppedQuotes] = useState<QuoteAnalytics[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<QuoteAnalytics[]>([]);
  const [metrics, setMetrics] = useState<ConversionMetrics[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdminStatus(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdminStatus(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (session: any) => {
    if (!session) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setIsAdmin(user?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);

      // Fetch dropped quotes
      const { data: dropped, error: droppedError } = await supabase
        .from('quote_analytics')
        .select('*')
        .eq('converted_to_booking', false)
        .order('quote_time', { ascending: false });

      if (droppedError) throw droppedError;
      setDroppedQuotes(dropped || []);

      // Fetch pending deposits
      const { data: pending, error: pendingError } = await supabase
        .from('quote_analytics')
        .select('*')
        .eq('converted_to_booking', true)
        .eq('deposit_paid', false)
        .order('quote_time', { ascending: false });

      if (pendingError) throw pendingError;
      setPendingDeposits(pending || []);

      // Fetch conversion metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('conversion_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (metricsError) throw metricsError;
      setMetrics(metricsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8 text-blue-600" />
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Quotes (30d)</p>
                <p className="text-2xl font-semibold">
                  {metrics[0]?.total_quotes || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <BarChart className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-semibold">
                  {metrics[0]?.conversion_rate || 0}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Deposit Rate</p>
                <p className="text-2xl font-semibold">
                  {metrics[0]?.deposit_rate || 0}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Time to Convert</p>
                <p className="text-2xl font-semibold">
                  {Math.round(
                    droppedQuotes.reduce((acc, q) => acc + (q.hours_to_convert || 0), 0) /
                    droppedQuotes.filter(q => q.hours_to_convert).length || 0
                  )}h
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dropped Quotes */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Dropped Quotes
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {droppedQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(quote.quote_time), 'PPp')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quote.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {quote.services.map((s: any) => s.serviceType).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${quote.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Deposits */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-yellow-500" />
              Pending Deposits
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Since Quote
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingDeposits.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(booking.booking_time!), 'PPp')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.services.map((s: any) => s.serviceType).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${booking.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDistanceToNow(new Date(booking.quote_time), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}