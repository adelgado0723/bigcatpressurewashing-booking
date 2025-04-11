import { useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { useToast } from '../hooks/useToast';

interface PaymentFormProps {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export function PaymentForm({ bookingId, amount, onSuccess, onError }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const { error: paymentError } = await supabase
        .from('payment_intents')
        .insert([
          {
            booking_id: bookingId,
            amount,
            status: 'pending'
          }
        ])
        .single();

      if (paymentError) throw paymentError;

      showToast({
        message: 'Payment processed successfully',
        type: 'success'
      });

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      showToast({
        message: errorMessage,
        type: 'error'
      });
      onError(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Processing payment...</div>;
  }

  return (
    <button
      onClick={handlePayment}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
    >
      Pay ${amount}
    </button>
  );
}