-- Migration to fix admin access issues

-- First, drop existing admin RLS policies that might be causing conflicts
DROP POLICY IF EXISTS "Allow admin users to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to delete profiles" ON profiles;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy to allow admin users to read all profiles
CREATE POLICY "Allow admin users to read all profiles"
  ON profiles FOR SELECT
  USING (
    is_admin() OR auth.uid() = id
  );

-- Add RLS policy to allow admin users to update all profiles
CREATE POLICY "Allow admin users to update all profiles"
  ON profiles FOR UPDATE
  USING (
    is_admin() OR auth.uid() = id
  );

-- Add RLS policy to allow admin users to delete profiles
CREATE POLICY "Allow admin users to delete profiles"
  ON profiles FOR DELETE
  USING (
    is_admin() AND auth.uid() != id
  );

-- Add RLS policy to allow users to insert their own profile (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id)';
    END IF;
END
$$;

-- Add comments to explain the policies (wrapped in DO block to handle errors)
DO $$
BEGIN
    BEGIN
        EXECUTE 'COMMENT ON POLICY "Allow admin users to read all profiles" ON profiles IS ''Allows users with admin role to read all user profiles''';
    EXCEPTION WHEN OTHERS THEN
        -- Policy might not exist yet, ignore error
    END;
    
    BEGIN
        EXECUTE 'COMMENT ON POLICY "Allow admin users to update all profiles" ON profiles IS ''Allows users with admin role to update all user profiles''';
    EXCEPTION WHEN OTHERS THEN
        -- Policy might not exist yet, ignore error
    END;
    
    BEGIN
        EXECUTE 'COMMENT ON POLICY "Allow admin users to delete profiles" ON profiles IS ''Allows users with admin role to delete user profiles''';
    EXCEPTION WHEN OTHERS THEN
        -- Policy might not exist yet, ignore error
    END;
    
    BEGIN
        EXECUTE 'COMMENT ON POLICY "Users can insert their own profile" ON profiles IS ''Allows users to insert their own profile during registration''';
    EXCEPTION WHEN OTHERS THEN
        -- Policy might not exist yet, ignore error
    END;
END
$$;

-- Fix the isAdmin check in auth-context.tsx by ensuring it's properly set
-- This SQL doesn't directly modify the code, but documents what needs to be fixed
COMMENT ON TABLE profiles IS 'User profiles table. The role column is used for access control. Valid roles: user, admin';
