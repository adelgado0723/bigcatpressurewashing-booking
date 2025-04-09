/*
  # Add Stripe payment fields to bookings table

  1. Changes
    - Add stripe_payment_intent_id column for tracking Stripe payments
    - Add stripe_payment_status column for payment status
    - Add payment_method column for storing payment method details
  2. Security
    - Enable RLS on the new columns
*/

ALTER TABLE bookings
ADD COLUMN stripe_payment_intent_id text,
ADD COLUMN stripe_payment_status text DEFAULT 'pending',
ADD COLUMN payment_method jsonb;

-- Update RLS policies to include new columns
CREATE POLICY "Customers can view their own payment details"
ON bookings
FOR SELECT
TO authenticated
USING (customer_email = auth.jwt() ->> 'email');