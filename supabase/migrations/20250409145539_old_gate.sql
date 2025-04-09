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

-- Add role to users
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user'::text;

-- Create view for quote analytics
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
LEFT JOIN bookings b ON q.booking_id = b.id;

-- Create materialized view for conversion metrics
CREATE MATERIALIZED VIEW conversion_metrics AS
SELECT
  date_trunc('day', timestamp) as date,
  COUNT(*) as total_quotes,
  COUNT(CASE WHEN converted_to_booking THEN 1 END) as converted_quotes,
  COUNT(CASE WHEN deposit_paid THEN 1 END) as paid_deposits,
  ROUND(COUNT(CASE WHEN converted_to_booking THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as conversion_rate,
  ROUND(COUNT(CASE WHEN deposit_paid THEN 1 END)::numeric / COUNT(CASE WHEN converted_to_booking THEN 1 END)::numeric * 100, 2) as deposit_rate
FROM quotes
GROUP BY date_trunc('day', timestamp)
ORDER BY date_trunc('day', timestamp);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_timestamp ON quotes(timestamp);

-- Enable RLS on views
ALTER VIEW quote_analytics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW conversion_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view quote analytics"
  ON quote_analytics
  FOR SELECT
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view conversion metrics"
  ON conversion_metrics
  FOR SELECT
  TO authenticated
  USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');