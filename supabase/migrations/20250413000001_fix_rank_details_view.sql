-- Alternative approach to fix the rank_details view if the first migration fails
-- If you still encounter errors with the first migration, run this one

-- First make sure the column exists on the ranks table
DO $$
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ranks' 
        AND column_name = 'discount_expires_at'
    ) THEN
        ALTER TABLE public.ranks ADD COLUMN discount_expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- Drop the view regardless of whether it exists
DROP VIEW IF EXISTS public.rank_details;

-- Create a completely fresh view
CREATE VIEW public.rank_details AS
SELECT 
    r.id,
    r.name,
    r.price,
    r.discount,
    r.discount_expires_at,
    -- Only apply discount if it hasn't expired
    CASE 
        WHEN r.discount > 0 AND (r.discount_expires_at IS NULL OR r.discount_expires_at > NOW()) THEN 
            ROUND(r.price * (100 - r.discount) / 100, 2)
        ELSE 
            r.price
    END AS discounted_price,
    -- Indicate if discount is active
    CASE
        WHEN r.discount > 0 AND (r.discount_expires_at IS NULL OR r.discount_expires_at > NOW()) THEN
            TRUE
        ELSE
            FALSE
    END AS is_discount_active,
    -- Calculate days remaining for discount
    CASE
        WHEN r.discount_expires_at IS NOT NULL AND r.discount_expires_at > NOW() THEN
            EXTRACT(DAY FROM (r.discount_expires_at - NOW()))
        ELSE
            NULL
    END AS discount_days_remaining,
    r.color,
    r.image_url,
    r.description,
    r.created_at,
    r.updated_at
FROM public.ranks r; 