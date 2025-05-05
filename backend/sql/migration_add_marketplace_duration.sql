-- Migration to add marketplace_duration column to properties table
-- This column will store the duration in days for which a property is listed in the marketplace

-- Add marketplace_duration column to properties table
ALTER TABLE properties ADD COLUMN marketplace_duration INTEGER;

-- Update the list_property_in_marketplace function to include duration parameter
CREATE OR REPLACE FUNCTION list_property_in_marketplace(
  p_user_id UUID,
  p_property_id UUID,
  p_price NUMERIC,
  p_duration INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property_exists BOOLEAN;
  v_is_owner BOOLEAN;
BEGIN
  -- Check if property exists
  SELECT EXISTS(SELECT 1 FROM properties WHERE id = p_property_id) INTO v_property_exists;
  
  IF NOT v_property_exists THEN
    RAISE EXCEPTION 'Property does not exist';
  END IF;
  
  -- Check if user is the owner of the property
  SELECT (user_id = p_user_id) INTO v_is_owner FROM properties WHERE id = p_property_id;
  
  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'User is not the owner of this property';
  END IF;
  
  -- Update property to list in marketplace
  UPDATE properties
  SET 
    is_in_marketplace = TRUE,
    marketplace_price = p_price,
    marketplace_listing_date = NOW(),
    marketplace_duration = p_duration
  WHERE id = p_property_id;
  
  RETURN TRUE;
END;
$$;

-- Add comment to explain the new column
COMMENT ON COLUMN properties.marketplace_duration IS 'Duration in days for which a property is listed in the marketplace';
