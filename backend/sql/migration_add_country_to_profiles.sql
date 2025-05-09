-- Add country column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add a comment to the new column
COMMENT ON COLUMN public.profiles.country IS 'User country of residence';

-- Optionally, you might want to backfill existing users with a default country
-- For example, if most of your users are from 'United Arab Emirates':
-- UPDATE public.profiles
-- SET country = 'United Arab Emirates'
-- WHERE country IS NULL;
-- Consider if this backfill is necessary for your application.
