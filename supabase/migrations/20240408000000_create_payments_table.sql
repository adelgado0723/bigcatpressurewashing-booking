/*
  # Create payments table for tracking payment transactions

  1. New Table
    - `payments`
      - Stores payment transactions
      - Links to bookings via foreign key
      - Tracks payment amount, status, and method
      - Includes timestamps for payment processing
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL,
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  is_guest boolean DEFAULT false
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id); 