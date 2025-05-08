-- Add new columns to the profiles table for realtor/seller specific information
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2, 1) DEFAULT 0.0, -- e.g., 4.5
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
-- Replace boolean flag with a status enum for more control
-- ADD COLUMN IF NOT EXISTS request_properties_market_visibility BOOLEAN DEFAULT FALSE;
ADD COLUMN IF NOT EXISTS properties_market_status TEXT DEFAULT 'not_requested' CHECK (properties_market_status IN ('not_requested', 'pending_approval', 'approved', 'rejected'));

-- Add comments to the new columns in profiles table
COMMENT ON COLUMN profiles.city IS 'Primary city where the realtor/seller operates.';
COMMENT ON COLUMN profiles.experience_years IS 'Number of years of experience for the realtor/seller.';
COMMENT ON COLUMN profiles.specialties IS 'Array of specialties, e.g., ["Luxury Villas", "Commercial Real Estate"].';
COMMENT ON COLUMN profiles.languages_spoken IS 'Array of languages spoken, e.g., ["English", "Arabic"].';
COMMENT ON COLUMN profiles.bio IS 'Short biography for the realtor/seller.';
COMMENT ON COLUMN profiles.average_rating IS 'Calculated average rating from reviews.';
COMMENT ON COLUMN profiles.review_count IS 'Total number of reviews received.';
COMMENT ON COLUMN profiles.properties_market_status IS 'Approval status for visibility in Properties Market (not_requested, pending_approval, approved, rejected). Requires paid subscription to request.';

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- The user being reviewed
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- The user who wrote the review
  reviewer_name TEXT, -- Denormalized for easier display, can be updated via trigger or application logic
  reviewer_avatar TEXT, -- Denormalized for easier display
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_profile_reviewer UNIQUE (profile_id, reviewer_id) -- A user can only review another user once
);

-- Add comments to the reviews table and its columns
COMMENT ON TABLE reviews IS 'Stores reviews and ratings given by users to other users (e.g., realtors, sellers).';
COMMENT ON COLUMN reviews.id IS 'Unique identifier for the review.';
COMMENT ON COLUMN reviews.profile_id IS 'Foreign key referencing the ID of the user being reviewed.';
COMMENT ON COLUMN reviews.reviewer_id IS 'Foreign key referencing the ID of the user who wrote the review.';
COMMENT ON COLUMN reviews.reviewer_name IS 'Name of the reviewer (denormalized for display).';
COMMENT ON COLUMN reviews.reviewer_avatar IS 'Avatar URL of the reviewer (denormalized for display).';
COMMENT ON COLUMN reviews.rating IS 'Rating given by the reviewer (1 to 5 stars).';
COMMENT ON COLUMN reviews.comment IS 'Optional text comment for the review.';
COMMENT ON COLUMN reviews.created_at IS 'Timestamp when the review was created.';
COMMENT ON COLUMN reviews.updated_at IS 'Timestamp when the review was last updated.';
COMMENT ON CONSTRAINT uq_profile_reviewer ON reviews IS 'Ensures a user can only submit one review per profile.';


-- Enable RLS on the reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews table:
-- 1. Allow users to read all reviews.
CREATE POLICY "Allow public read access to reviews"
  ON reviews FOR SELECT
  USING (true);

-- 2. Allow authenticated users to insert a review for another user (but not for themselves).
CREATE POLICY "Allow authenticated users to insert reviews for others"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() != profile_id AND auth.uid() = reviewer_id);

-- 3. Allow users to update their own reviews.
CREATE POLICY "Allow users to update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- 4. Allow users to delete their own reviews.
CREATE POLICY "Allow users to delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- 5. Allow admins to manage all reviews (optional, depending on admin capabilities)
CREATE POLICY "Allow admin full access to reviews"
  ON reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Optional: Create a function and trigger to update average_rating and review_count on the profiles table
CREATE OR REPLACE FUNCTION update_profile_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles
    SET
      review_count = review_count + 1,
      average_rating = (
        (average_rating * (review_count)) + NEW.rating
      ) / (review_count + 1)
    WHERE id = NEW.profile_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles
    SET
      review_count = review_count - 1,
      average_rating = CASE
                        WHEN review_count - 1 > 0 THEN ( (average_rating * review_count) - OLD.rating ) / (review_count - 1)
                        ELSE 0
                       END
    WHERE id = OLD.profile_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.rating <> NEW.rating THEN
      UPDATE profiles
      SET
        average_rating = (
          (average_rating * review_count) - OLD.rating + NEW.rating
        ) / review_count
      WHERE id = NEW.profile_id;
    END IF;
  END IF;
  RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to avoid errors on re-run
DROP TRIGGER IF EXISTS trg_update_profile_review_stats ON reviews;

-- Create the trigger
CREATE TRIGGER trg_update_profile_review_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_profile_review_stats();

COMMENT ON FUNCTION update_profile_review_stats IS 'Updates the average_rating and review_count on the profiles table when a review is added, updated, or deleted.';
COMMENT ON TRIGGER trg_update_profile_review_stats ON reviews IS 'Trigger to automatically update profile review statistics after review changes.';

-- Optional: Trigger to update denormalized reviewer_name and reviewer_avatar
CREATE OR REPLACE FUNCTION update_reviewer_denormalized_fields()
RETURNS TRIGGER AS $$
BEGIN
  SELECT name, avatar INTO NEW.reviewer_name, NEW.reviewer_avatar
  FROM profiles
  WHERE id = NEW.reviewer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_reviewer_denormalized_fields ON reviews;

CREATE TRIGGER trg_update_reviewer_denormalized_fields
BEFORE INSERT OR UPDATE OF reviewer_id ON reviews
FOR EACH ROW EXECUTE FUNCTION update_reviewer_denormalized_fields();

COMMENT ON FUNCTION update_reviewer_denormalized_fields IS 'Updates denormalized reviewer_name and reviewer_avatar in the reviews table from the profiles table.';
COMMENT ON TRIGGER trg_update_reviewer_denormalized_fields ON reviews IS 'Trigger to keep denormalized reviewer fields in sync with the profiles table.';

-- Note: Consider implications of SECURITY DEFINER.
-- The functions above use SECURITY DEFINER to ensure they have permissions to update the profiles table.
-- This is common for triggers that modify other tables but ensure the logic within is secure.
-- Alternatively, grant specific update permissions on profiles table to the role executing these operations if SECURITY DEFINER is not desired.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reraLicenseNumber TEXT,
  ADD COLUMN IF NOT EXISTS dldLicenseNumber TEXT,
  ADD COLUMN IF NOT EXISTS admLicenseNumber TEXT;

COMMENT ON COLUMN profiles.reraLicenseNumber IS 'RERA license number for realtors.';
COMMENT ON COLUMN profiles.dldLicenseNumber IS 'DLD license number for realtors.';
COMMENT ON COLUMN profiles.admLicenseNumber IS 'ADM license number for realtors.';

-- Update RLS policy for profiles to allow reading realtor/seller specific fields by anyone
-- Assuming 'realtor' and 'seller' roles should have their professional profile info public
DROP POLICY IF EXISTS "Allow all users to read realtor profiles" ON profiles;

CREATE POLICY "Allow public read access to realtor and seller profiles"
  ON profiles FOR SELECT
  USING (
    role = 'realtor' OR role = 'seller' OR auth.uid() = id -- Allow users to read their own profile
  );

COMMENT ON POLICY "Allow public read access to realtor and seller profiles" ON profiles IS 'Allows public read access to profiles of users with "realtor" or "seller" roles, and users to read their own profile.';


-- Ensure existing "Users can read their own profile" policy doesn't conflict or is adjusted.
-- If the above policy covers self-reads, the specific self-read policy might be redundant or need adjustment.
-- For simplicity, the above policy includes self-read.

-- The policy "Users can update their own profile" should remain as is,
-- as users should only update their own data.

-- The policy "Allow admin users to read all profiles" should also remain.
-- If admins need to read all fields of all profiles, it's fine.
-- If admins should only read specific roles, that policy would need adjustment.

SELECT 'Migration completed: Added realtor profile fields and reviews table.' AS status;
