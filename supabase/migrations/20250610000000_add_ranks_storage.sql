/*
  Add ranks folder to payment-proofs bucket
  
  This migration ensures:
  1. The proper folder structure for rank-related images
  2. Appropriate storage permissions for admin users
*/

-- Create the ranks folder in the payment-proofs bucket
-- This is a no-op if the folder already exists
-- The actual folder will be created when the first file is uploaded

-- Define RLS policies for the ranks folder in the payment-proofs bucket

-- First, remove any existing policies that might conflict
DROP POLICY IF EXISTS "Allow authenticated to manage rank images" ON storage.objects;

-- Allow authenticated users (admins) to manage rank images
CREATE POLICY "Allow authenticated to manage rank images" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'payment-proofs' AND
        (storage.foldername(name))[1] = 'ranks'
    )
    WITH CHECK (
        bucket_id = 'payment-proofs' AND
        (storage.foldername(name))[1] = 'ranks'
    );

-- Allow anonymous users to view rank images
DROP POLICY IF EXISTS "Allow public to view rank images" ON storage.objects;
CREATE POLICY "Allow public to view rank images" ON storage.objects
    FOR SELECT TO anon
    USING (
        bucket_id = 'payment-proofs' AND
        (storage.foldername(name))[1] = 'ranks'
    ); 