-- Migration to add avatar column to profiles table

-- Check if avatar column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar TEXT;
        
        -- Add comment to explain the column
        COMMENT ON COLUMN profiles.avatar IS 'URL to the user''s profile picture';
        
        -- Log the change
        RAISE NOTICE 'Added avatar column to profiles table';
    ELSE
        RAISE NOTICE 'Avatar column already exists in profiles table';
    END IF;
END
$$;
