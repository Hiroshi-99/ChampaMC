-- Create a function to apply discounts to all ranks at once
CREATE OR REPLACE FUNCTION apply_bulk_discount(
  discount_value INTEGER,
  expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Verify discount is within valid range
  IF discount_value < 0 OR discount_value > 100 THEN
    RAISE EXCEPTION 'Discount must be between 0 and 100';
  END IF;

  -- Update all ranks with the specified discount and expiration
  UPDATE public.ranks
  SET 
    discount = discount_value,
    discount_expires_at = expires_at,
    updated_at = NOW()
  WHERE TRUE;

  -- Get the number of updated rows
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Return the count of updated ranks
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION apply_bulk_discount(INTEGER, TIMESTAMPTZ) TO authenticated;

-- Add comment to document function
COMMENT ON FUNCTION apply_bulk_discount IS 'Applies the specified discount percentage to all ranks. Set discount to 0 to remove discounts.';

-- Create an RPC endpoint for the bulk discount function
BEGIN;
  SELECT supabase_functions.create_function(
    'apply_bulk_discount',
    $$
      SELECT apply_bulk_discount(
        discount_value := coalesce(rest.discount_value, 0)::integer,
        expires_at := rest.expires_at::timestamptz
      )
    $$,
    'Applies a discount to all ranks at once',
    '{
      "discount_value": {"type": "integer", "description": "Discount percentage (0-100)"},
      "expires_at": {"type": "string", "format": "date-time", "description": "Optional expiration date (ISO format)"}
    }'::jsonb
  );
COMMIT; 