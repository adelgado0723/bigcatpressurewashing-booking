/*
  # Add guest booking support

  1. Changes
    - Add is_guest column to track guest vs authenticated bookings
    - Add guest_token column for guest booking management
    - Add user_id column for authenticated users
    - Update RLS policies to handle guest access
    - Add function to handle guest token management

  2. Security
    - Enable guest access through tokens
    - Maintain existing authenticated user policies
*/

-- Add columns for guest bookings
ALTER TABLE bookings
ADD COLUMN is_guest boolean DEFAULT false,
ADD COLUMN guest_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create index for guest token lookups
CREATE INDEX idx_bookings_guest_token ON bookings(guest_token);

-- Update RLS policies for guest access
CREATE POLICY "Guests can view their bookings using guest token"
  ON bookings
  FOR SELECT
  TO public
  USING (
    guest_token::text = coalesce(
      nullif(current_setting('app.guest_token', true), ''),
      guest_token::text
    )
  );

CREATE POLICY "Guests can view their booking services"
  ON booking_services
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_services.booking_id
      AND bookings.guest_token::text = coalesce(
        nullif(current_setting('app.guest_token', true), ''),
        bookings.guest_token::text
      )
    )
  );

-- Add function to set guest token in session
CREATE OR REPLACE FUNCTION set_guest_token(token uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.guest_token', token::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;