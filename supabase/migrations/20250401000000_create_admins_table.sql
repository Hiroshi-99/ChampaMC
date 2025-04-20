-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can read their own records
CREATE POLICY "Admins can read own records"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Update orders policies to allow admin access
CREATE POLICY "Admins can read all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admins
    )
  );

CREATE POLICY "Admins can update all orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admins
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.admins
    )
  ); 