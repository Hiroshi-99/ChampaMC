-- Add discount expiration date column to ranks table
ALTER TABLE public.ranks
ADD COLUMN IF NOT EXISTS discount_expires_at TIMESTAMPTZ;

-- First drop the existing view if it exists
DROP VIEW IF EXISTS public.rank_details;

-- Create the rank_details view with all columns including the new ones
CREATE VIEW public.rank_details AS
SELECT 
    id,
    name,
    price,
    discount,
    discount_expires_at,
    -- Only apply discount if it hasn't expired
    CASE 
        WHEN discount > 0 AND (discount_expires_at IS NULL OR discount_expires_at > NOW()) THEN 
            ROUND(price * (100 - discount) / 100, 2)
        ELSE 
            price
    END AS discounted_price,
    -- Indicate if discount is active
    CASE
        WHEN discount > 0 AND (discount_expires_at IS NULL OR discount_expires_at > NOW()) THEN
            TRUE
        ELSE
            FALSE
    END AS is_discount_active,
    -- Calculate days remaining for discount
    CASE
        WHEN discount_expires_at IS NOT NULL AND discount_expires_at > NOW() THEN
            EXTRACT(DAY FROM (discount_expires_at - NOW()))
        ELSE
            NULL
    END AS discount_days_remaining,
    color,
    image_url,
    description,
    created_at,
    updated_at
FROM public.ranks;

-- Add comment for the expiration date column
COMMENT ON COLUMN public.ranks.discount_expires_at IS 'Date when the discount expires (null means no expiration)'; 