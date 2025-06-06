-- Check Supabase storage tables structure

-- Fix for ERROR: 42703: column "path" does not exist
-- In Supabase, the column name is "name" instead of "path" in storage.objects table

-- First, create the storage bucket for payment proofs if it doesn't exist
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies for the storage.objects table related to payment-proofs
DROP POLICY IF EXISTS "Allow anonymous to upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view payment proofs" ON storage.objects;

-- Create a policy to allow anonymous users to upload payment proofs
-- Using 'name' column instead of 'path'
CREATE POLICY "Allow anonymous to upload payment proofs" ON storage.objects
    FOR INSERT TO anon
    WITH CHECK (
        bucket_id = 'payment-proofs' AND 
        (name LIKE 'guest/%' OR name LIKE 'guest%')
    );

-- Create a policy to allow public to view payment proofs
CREATE POLICY "Allow public to view payment proofs" ON storage.objects
    FOR SELECT TO anon
    USING (bucket_id = 'payment-proofs');

-- Add additional policy for authenticated users
CREATE POLICY "Allow authenticated users to manage payment proofs" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'payment-proofs');

-- To check the structure of the storage.objects table, you can run:
-- SELECT column_name FROM information_schema.columns WHERE table_schema = 'storage' AND table_name = 'objects';
