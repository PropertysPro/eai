-- Add new columns to the properties table for construction and market status
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS construction_status TEXT CHECK (construction_status IN ('ready', 'off_plan')),
ADD COLUMN IF NOT EXISTS market_status TEXT CHECK (market_status IN ('new_to_market', 'resale'));

-- Add comments to the new columns
COMMENT ON COLUMN properties.construction_status IS 'Indicates if the property is ready or off-plan.';
COMMENT ON COLUMN properties.market_status IS 'Indicates if the property is new to the market or a resale.';

-- Optional: Set default values for existing rows if needed
-- Example: Assume existing properties are 'ready' and 'resale' by default
-- UPDATE properties SET construction_status = 'ready' WHERE construction_status IS NULL;
-- UPDATE properties SET market_status = 'resale' WHERE market_status IS NULL;

SELECT 'Migration completed: Added construction_status and market_status to properties table.' AS status;
