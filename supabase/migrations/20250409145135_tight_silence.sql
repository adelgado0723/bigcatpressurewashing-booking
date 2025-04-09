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

DO $$ BEGIN
  -- Create quotes table if it doesn't exist
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

  -- Enable RLS if not already enabled
  ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

  -- Create policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Anyone can insert quotes'
  ) THEN
    CREATE POLICY "Anyone can insert quotes"
      ON quotes
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Only authenticated users can view quotes'
  ) THEN
    CREATE POLICY "Only authenticated users can view quotes"
      ON quotes
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;