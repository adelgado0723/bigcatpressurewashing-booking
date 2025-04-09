/*
  # Initial Schema Setup for Pressure Washing Bookings

  1. New Tables
    - `bookings`
      - Stores customer booking information
      - Includes contact details, address, and payment info
      - Status tracking for booking lifecycle
    - `booking_services`
      - Stores individual services within a booking
      - Links to parent booking via foreign key
      - Captures service-specific details and pricing

  2. Security
    - RLS enabled on both tables
    - Policies allow customers to:
      - View their own bookings and services
      - Insert new bookings and services
      - Update their existing bookings and services
      - Delete their bookings and services
    - All policies are tied to authenticated user's email
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
  status text NOT NULL DEFAULT 'pending'
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

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings table
CREATE POLICY "Customers can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (customer_email = auth.jwt()->>'email');

CREATE POLICY "Customers can insert their own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_email = auth.jwt() ->> 'email');

CREATE POLICY "Customers can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (customer_email = auth.jwt()->>'email');

CREATE POLICY "Customers can delete their own bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (customer_email = auth.jwt()->>'email');

-- Create policies for booking_services table
CREATE POLICY "Customers can view their own booking services"
  ON booking_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_services.booking_id
      AND bookings.customer_email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Customers can insert their own booking services"
  ON booking_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_services.booking_id
      AND bookings.customer_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Customers can update their own booking services"
  ON booking_services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_services.booking_id
      AND bookings.customer_email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Customers can delete their own booking services"
  ON booking_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_services.booking_id
      AND bookings.customer_email = auth.jwt()->>'email'
    )
  );