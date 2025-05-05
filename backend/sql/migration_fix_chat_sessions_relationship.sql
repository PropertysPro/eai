-- Migration to fix the relationship between chat_sessions and profiles

-- First, check if the user_id column in chat_sessions references auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chat_sessions_user_id_fkey'
        AND table_name = 'chat_sessions'
    ) THEN
        -- Drop the existing foreign key constraint
        ALTER TABLE chat_sessions DROP CONSTRAINT chat_sessions_user_id_fkey;
    END IF;
END
$$;

-- Now add a foreign key constraint that references profiles instead of auth.users
ALTER TABLE chat_sessions
ADD CONSTRAINT chat_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add a comment to explain the change
COMMENT ON CONSTRAINT chat_sessions_user_id_fkey ON chat_sessions IS 'Foreign key relationship between chat_sessions and profiles';
