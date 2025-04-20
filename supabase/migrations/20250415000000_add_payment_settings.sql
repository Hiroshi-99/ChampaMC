-- Create a table for store settings
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment to document table
COMMENT ON TABLE public.store_settings IS 'Stores global settings for the store application';

-- Add RLS policies
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Allow anyone to read settings" 
  ON public.store_settings
  FOR SELECT
  TO public
  USING (true);

-- Only admins can edit settings
CREATE POLICY "Only admins can edit settings" 
  ON public.store_settings
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- Insert default payment settings
INSERT INTO public.store_settings 
  (key, value) 
VALUES 
  ('payment_details', jsonb_build_object(
    'qr_image_url', 'https://i.imgur.com/xmzqO4S.jpeg',
    'updated_at', NOW()::TEXT
  ))
ON CONFLICT (key) DO NOTHING;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;

-- Create a trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_store_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Update the embedded timestamp within jsonb as well if it exists
  IF (NEW.value ? 'updated_at') THEN
    NEW.value = jsonb_set(NEW.value, '{updated_at}', to_jsonb(NOW()::TEXT));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_store_settings_timestamp
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION update_store_settings_updated_at(); 