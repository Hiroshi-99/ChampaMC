-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow anonymous order submissions" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to view all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

-- Set up RLS for orders table (make sure it's enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access (insert only)
CREATE POLICY "Allow anonymous order submissions" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Create policy for anonymous to view their own orders (for receipt display)
CREATE POLICY "Allow anonymous to view submitted orders" ON public.orders
    FOR SELECT TO anon
    USING (true);

-- Create policy for authenticated users (view all orders)
CREATE POLICY "Allow authenticated users to view all orders" ON public.orders
    FOR SELECT TO authenticated
    USING (true);

-- Create policy for authenticated users to update orders
CREATE POLICY "Allow authenticated users to update orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policy for admins to delete orders
CREATE POLICY "Allow admins to delete orders" ON public.orders
    FOR DELETE TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admins
        )
    ); 