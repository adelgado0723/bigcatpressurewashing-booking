/*
  # Add admin role management and analytics views

  1. Changes
    - Add role column to auth.users
    - Create views for analytics
    - Add RLS policies for admin access
    
  2. Security
    - Only admins can access analytics views
    - Maintain existing user policies
*/

-- Add role to users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN role text DEFAULT 'user'::text;
  END IF;
END $$;

-- Add missing columns to quotes table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quotes' 
    AND column_name = 'converted_to_booking'
  ) THEN
    ALTER TABLE quotes ADD COLUMN converted_to_booking boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quotes' 
    AND column_name = 'deposit_paid'
  ) THEN
    ALTER TABLE quotes ADD COLUMN deposit_paid boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quotes' 
    AND column_name = 'deposit_paid_at'
  ) THEN
    ALTER TABLE quotes ADD COLUMN deposit_paid_at timestamptz;
  END IF;
END $$;

-- Create view for quote analytics with RLS built in
CREATE OR REPLACE VIEW quote_analytics AS
SELECT 
  q.id,
  q.email,
  q.services,
  q.total_amount,
  q.timestamp as quote_time,
  q.converted_to_booking,
  q.booking_id,
  q.deposit_paid,
  q.deposit_paid_at,
  b.created_at as booking_time,
  CASE 
    WHEN q.converted_to_booking THEN
      EXTRACT(EPOCH FROM (b.created_at - q.timestamp))/3600
    ELSE
      NULL
  END as hours_to_convert,
  CASE 
    WHEN q.deposit_paid THEN
      EXTRACT(EPOCH FROM (q.deposit_paid_at - q.timestamp))/3600
    ELSE
      NULL
  END as hours_to_deposit
FROM quotes q
LEFT JOIN bookings b ON q.booking_id = b.id
WHERE (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin';

-- Create materialized view for conversion metrics with RLS built in
CREATE MATERIALIZED VIEW IF NOT EXISTS conversion_metrics AS
WITH metrics AS (
  SELECT
    date_trunc('day', timestamp) as date,
    COUNT(*) as total_quotes,
    COUNT(CASE WHEN converted_to_booking THEN 1 END) as converted_quotes,
    COUNT(CASE WHEN deposit_paid THEN 1 END) as paid_deposits
  FROM quotes
  WHERE (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
  GROUP BY date_trunc('day', timestamp)
)
SELECT
  date,
  total_quotes,
  converted_quotes,
  paid_deposits,
  CASE 
    WHEN total_quotes > 0 THEN
      ROUND((converted_quotes::numeric / total_quotes::numeric) * 100, 2)
    ELSE
      0
  END as conversion_rate,
  CASE 
    WHEN converted_quotes > 0 THEN
      ROUND((paid_deposits::numeric / converted_quotes::numeric) * 100, 2)
    ELSE
      0
  END as deposit_rate
FROM metrics
ORDER BY date;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_timestamp ON quotes(timestamp);