-- Migration to add realtor license fields to profiles table

-- Add RERA license number column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rera_license_number TEXT;

-- Add DLD license number column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dld_license_number TEXT;

-- Add ADM license number column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS adm_license_number TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN profiles.rera_license_number IS 'RERA license number for realtor users (optional)';
COMMENT ON COLUMN profiles.dld_license_number IS 'DLD license number for realtor users (optional)';
COMMENT ON COLUMN profiles.adm_license_number IS 'ADM license number for realtor users (optional)';
