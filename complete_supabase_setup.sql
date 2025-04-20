-- Complete Supabase Setup for Champa Store

-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------
-- Create the orders table
-------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 16),
    platform TEXT NOT NULL CHECK (platform IN ('java', 'bedrock')),
    rank TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    payment_proof TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id)
);

-- Set up RLS (Row Level Security) for orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access (insert only)
CREATE POLICY "Allow anonymous order submissions" ON public.orders
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create policy for authenticated users (view all orders)
CREATE POLICY "Allow authenticated users to view all orders" ON public.orders
    FOR SELECT TO authenticated
    USING (true);

-- Create policy for authenticated users to update orders
CREATE POLICY "Allow authenticated users to update orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-------------------------------
-- Create order statistics view
-------------------------------
CREATE OR REPLACE VIEW public.order_stats AS
    SELECT 
        COUNT(*) AS total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_orders,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_orders,
        SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) AS total_revenue,
        MIN(created_at) AS first_order_date,
        MAX(created_at) AS latest_order_date
    FROM public.orders;

-------------------------------
-- Create the ranks table
-------------------------------
CREATE TABLE IF NOT EXISTS public.ranks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    color TEXT NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up RLS for ranks table
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous to view ranks
CREATE POLICY "Allow anonymous to view ranks" ON public.ranks
    FOR SELECT TO anon
    USING (true);

-- Create policy for authenticated users to manage ranks
CREATE POLICY "Allow authenticated users to manage ranks" ON public.ranks
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert default ranks if they don't exist
INSERT INTO public.ranks (name, price, color, image_url, description) 
VALUES
    ('VIP', 5.00, 'from-emerald-500 to-emerald-600', 'https://i.imgur.com/NX3RB4i.png', 'Basic VIP privileges'),
    ('MVP', 10.00, 'from-blue-500 to-blue-600', 'https://i.imgur.com/gmlFpV2.png', 'Enhanced privileges with MVP status'),
    ('MVP+', 15.00, 'from-purple-500 to-purple-600', 'https://i.imgur.com/C4VE5b0.png', 'Premium MVP experience with added benefits'),
    ('LEGEND', 20.00, 'from-yellow-500 to-yellow-600', 'https://i.imgur.com/fiqqcOY.png', 'Legendary status with exclusive perks'),
    ('DEVIL', 25.00, 'from-red-500 to-red-600', 'https://i.imgur.com/z0zBiyZ.png', 'Unleash the devil with special abilities'),
    ('INFINITY', 30.00, 'from-pink-500 to-pink-600', 'https://i.imgur.com/SW6dtYW.png', 'Unlimited power and exclusive cosmetics'),
    ('CHAMPA', 50.00, 'from-orange-500 to-orange-600', 'https://i.imgur.com/5xEinAj.png', 'The ultimate rank with all privileges')
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    color = EXCLUDED.color,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description,
    updated_at = now();

-------------------------------
-- Setup storage for payment proofs
-------------------------------
-- Create the storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies for the storage.objects table related to payment-proofs
DROP POLICY IF EXISTS "Allow anonymous to upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage payment proofs" ON storage.objects;

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

-- Create the storage bucket for ranks
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('ranks', 'ranks', true)
ON CONFLICT (id) DO NOTHING;

-- Create a policy to allow authenticated users to manage rank images
CREATE POLICY "Allow authenticated users to manage rank images" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'ranks')
    WITH CHECK (bucket_id = 'ranks');

-- Create a policy to allow public to view rank images
CREATE POLICY "Allow public to view rank images" ON storage.objects
    FOR SELECT TO anon
    USING (bucket_id = 'ranks');

-------------------------------
-- Create helper functions
-------------------------------
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ranks table
DROP TRIGGER IF EXISTS update_ranks_timestamp ON public.ranks;
CREATE TRIGGER update_ranks_timestamp
BEFORE UPDATE ON public.ranks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Function to check if username exists on Minecraft server (placeholder)
CREATE OR REPLACE FUNCTION check_minecraft_username(username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- This is a placeholder. In a real implementation, you would
    -- call an external API or service to verify the username exists.
    -- For now, we'll just do a basic regex check
    RETURN username ~ '^[a-zA-Z0-9_]{3,16}$';
END;
$$ LANGUAGE plpgsql; 