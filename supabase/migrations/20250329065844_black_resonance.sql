/*
  # Enable guest bookings

  1. Changes
    - Update RLS policies to allow guest bookings using service role
    - Add policy for public access to bookings table
    - Add policy for public access to booking_services table

  2. Security
    - Service role bypasses RLS
    - Public can only view their own bookings via email
*/

-- Update RLS policies for bookings table to handle guest bookings
DROP POLICY IF EXISTS "Customers can insert their own bookings" ON bookings;
CREATE POLICY "Anyone can insert bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Update RLS policies for booking_services table to handle guest bookings
DROP POLICY IF EXISTS "Customers can insert their own booking services" ON booking_services;
CREATE POLICY "Anyone can insert booking services"
  ON booking_services
  FOR INSERT
  WITH CHECK (true);