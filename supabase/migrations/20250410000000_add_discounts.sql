-- Add discount column to ranks table
ALTER TABLE public.ranks
ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;

-- Add discount display to the rank views
CREATE OR REPLACE VIEW public.rank_details AS
SELECT 
    id,
    name,
    price,
    discount,
    CASE 
        WHEN discount > 0 THEN 
            ROUND(price * (100 - discount) / 100, 2)
        ELSE 
            price
    END AS discounted_price,
    color,
    image_url,
    description,
    created_at,
    updated_at
FROM public.ranks;

-- Add discount comment and constraint
COMMENT ON COLUMN public.ranks.discount IS 'Discount percentage between 0-100';
ALTER TABLE public.ranks ADD CONSTRAINT discount_range CHECK (discount >= 0 AND discount <= 100); 