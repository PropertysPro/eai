-- Add new columns to the profiles table for social media links
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS snapchat_username TEXT;

-- Add comments to the new columns in profiles table
COMMENT ON COLUMN profiles.linkedin_url IS 'URL of the user''s LinkedIn profile.';
COMMENT ON COLUMN profiles.youtube_url IS 'URL of the user''s YouTube channel.';
COMMENT ON COLUMN profiles.whatsapp_number IS 'User''s WhatsApp phone number.';
COMMENT ON COLUMN profiles.tiktok_url IS 'URL of the user''s TikTok profile.';
COMMENT ON COLUMN profiles.instagram_url IS 'URL of the user''s Instagram profile.';
COMMENT ON COLUMN profiles.snapchat_username IS 'User''s Snapchat username.';

SELECT 'Migration completed: Added social media fields (including TikTok, Instagram, Snapchat) to profiles table.' AS status;
