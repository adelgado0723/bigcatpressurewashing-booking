/*
  # Create base tables for the application

  1. Tables to be created:
    - `bookings` - Stores customer booking information
    - `booking_services` - Stores services within a booking
    - `payments` - Stores payment transactions
    - `activity_logs` - Stores user activity logs
    - `quotes` - Stores quote requests
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  customer_email text NOT NULL,
  customer_phone text,
  customer_name text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  total_amount numeric NOT NULL,
  deposit_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  user_id uuid REFERENCES auth.users(id),
  is_guest boolean DEFAULT false
);

-- Create booking services table
CREATE TABLE IF NOT EXISTS booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  material text,
  size numeric NOT NULL,
  stories integer,
  roof_pitch text,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
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

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

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

-- Add booking_id column to quotes if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'quotes' 
    AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN booking_id uuid REFERENCES bookings(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_booking_id ON quotes(booking_id); 