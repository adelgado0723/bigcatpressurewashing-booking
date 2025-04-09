/*
  # Create storage bucket for assets

  1. New Storage Bucket
    - Create a public bucket named 'assets' for storing public files
    - Enable public access for the bucket
  2. Security
    - Add policy for authenticated users to upload files
    - Add policy for public read access
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assets');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'assets');