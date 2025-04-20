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

-- Create a simplified wrapper function that is directly callable as an RPC
CREATE OR REPLACE FUNCTION public.rpc_apply_bulk_discount(
  discount_value INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS INTEGER AS $$
  -- Simply call the main function
  SELECT apply_bulk_discount(discount_value, expires_at);
$$ LANGUAGE SQL SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.rpc_apply_bulk_discount(INTEGER, TIMESTAMPTZ) TO authenticated;

-- Add comment to document function
COMMENT ON FUNCTION public.rpc_apply_bulk_discount IS 'RPC endpoint to apply discount percentage to all ranks.'; 