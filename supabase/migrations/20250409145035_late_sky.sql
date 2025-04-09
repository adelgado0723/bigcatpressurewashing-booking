/*
  # Add quotes table for tracking customer quote requests

  1. New Table
    - `quotes`
      - Stores quote requests from customers
      - Includes service details and pricing
      - Optional customer email for follow-up
      - Tracks conversion status
  
  2. Security
    - Enable RLS
    - Allow public inserts
    - Restrict select/update/delete to authenticated users
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  services jsonb NOT NULL,
  total_amount numeric NOT NULL,
  timestamp timestamptz DEFAULT now(),
  converted_to_booking boolean DEFAULT false,
  booking_id uuid REFERENCES bookings(id),
  deposit_paid boolean DEFAULT false,
  deposit_paid_at timestamptz
);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert quotes"
  ON quotes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can view quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);