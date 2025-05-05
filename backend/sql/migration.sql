-- Add isAdminChat column to chat_sessions table
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS is_admin_chat BOOLEAN DEFAULT FALSE;

-- Add property_id column to chat_sessions table if it doesn't exist
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

-- Update existing chat sessions with property context to be admin chats
UPDATE chat_sessions
SET is_admin_chat = TRUE
WHERE title LIKE 'Chat with Admin about%' OR title LIKE 'Chat about%' AND property_id IS NOT NULL;

-- Add RLS policy to allow admin users to read all profiles
CREATE POLICY "Allow admin users to read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' OR 'admin' = ANY(roles)
    )
  );

-- Add RLS policy to allow admin users to update all profiles
CREATE POLICY "Allow admin users to update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' OR 'admin' = ANY(roles)
    )
  );

-- Add RLS policy to allow admin users to delete profiles
CREATE POLICY "Allow admin users to delete profiles"
  ON profiles FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' OR 'admin' = ANY(roles)
    )
  );

-- Add comment to explain the policies
COMMENT ON POLICY "Allow admin users to read all profiles" ON profiles IS 'Allows users with admin role to read all user profiles';
COMMENT ON POLICY "Allow admin users to update all profiles" ON profiles IS 'Allows users with admin role to update all user profiles';
COMMENT ON POLICY "Allow admin users to delete profiles" ON profiles IS 'Allows users with admin role to delete user profiles';

-- Add avatar column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Update existing profiles to have a default avatar
UPDATE profiles SET avatar = NULL WHERE avatar IS NULL;

-- Add comment to the column
COMMENT ON COLUMN profiles.avatar IS 'URL to the user''s profile picture stored in Supabase Storage';

-- Create favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Enable RLS on favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for favorites table
CREATE POLICY "Users can read their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Add RLS policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add comment to explain the policy
COMMENT ON POLICY "Users can insert their own profile" ON profiles IS 'Allows users to insert their own profile during registration';

-- Add roles column to profiles table
ALTER TABLE profiles ADD COLUMN roles TEXT[] DEFAULT '{}';

-- Migrate existing role data to roles array
UPDATE profiles SET roles = ARRAY[role] WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

-- Add index for faster queries on roles
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON profiles USING GIN (roles);

-- Add comment to explain the column
COMMENT ON COLUMN profiles.roles IS 'Array of user roles (e.g., buyer, owner, realtor)';

-- This migration should only be applied after ensuring all application code
-- has been updated to use the 'roles' column instead of 'role'

-- First, drop the trigger that keeps role and roles in sync
DROP TRIGGER IF EXISTS sync_role_and_roles_trigger ON profiles;
DROP FUNCTION IF EXISTS sync_role_and_roles();

-- Then drop the role column
ALTER TABLE profiles DROP COLUMN role;

-- Add comment to the roles column to indicate it replaces the role column
COMMENT ON COLUMN profiles.roles IS 'Array of user roles (e.g., buyer, owner, realtor). Replaces the old role column.';

-- Drop existing admin RLS policies
DROP POLICY IF EXISTS "Allow admin users to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to delete profiles" ON profiles;

-- Recreate RLS policies to only check the role column (not roles array)
-- Add RLS policy to allow admin users to read all profiles
CREATE POLICY "Allow admin users to read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add RLS policy to allow admin users to update all profiles
CREATE POLICY "Allow admin users to update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add RLS policy to allow admin users to delete profiles
CREATE POLICY "Allow admin users to delete profiles"
  ON profiles FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add comment to explain the policies
COMMENT ON POLICY "Allow admin users to read all profiles" ON profiles IS 'Allows users with admin role to read all user profiles';
COMMENT ON POLICY "Allow admin users to update all profiles" ON profiles IS 'Allows users with admin role to update all user profiles';
COMMENT ON POLICY "Allow admin users to delete profiles" ON profiles IS 'Allows users with admin role to delete user profiles';

-- Migration to fix infinite recursion in RLS policies for the profiles table

-- First, drop all existing RLS policies that might be causing the recursion
DROP POLICY IF EXISTS "Allow admin users to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow owner users to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow owner users to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow realtor users to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow realtor users to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow buyer users to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow buyer users to update all profiles" ON profiles;

-- Recreate the RLS policies without self-referential queries
-- This avoids the infinite recursion by not querying the profiles table within its own policy

-- Basic user policies - these are simple and don't cause recursion
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin policies - using auth.users metadata instead of profiles table
-- Only admin can access admin panel and see/update all data
-- CREATE POLICY "Allow admin users to read all profiles"
--   ON profiles FOR SELECT
--   USING (
--     auth.jwt() ->> 'role' = 'admin' OR
--     EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE auth.users.id = auth.uid() AND 
--       (auth.users.raw_user_meta_data->>'role' = 'admin' OR 
--        auth.users.raw_user_meta_data->>'roles' LIKE '%admin%')
--     )
--   );

-- CREATE POLICY "Allow admin users to update all profiles"
--   ON profiles FOR UPDATE
--   USING (
--     auth.jwt() ->> 'role' = 'admin' OR
--     EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE auth.users.id = auth.uid() AND 
--       (auth.users.raw_user_meta_data->>'role' = 'admin' OR 
--        auth.users.raw_user_meta_data->>'roles' LIKE '%admin%')
--     )
--   );

-- CREATE POLICY "Allow admin users to delete profiles"
--   ON profiles FOR DELETE
--   USING (
--     auth.jwt() ->> 'role' = 'admin' OR
--     EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE auth.users.id = auth.uid() AND 
--       (auth.users.raw_user_meta_data->>'role' = 'admin' OR 
--        auth.users.raw_user_meta_data->>'roles' LIKE '%admin%')
--     )
--   );

-- Create a policy to allow all users to read realtor profiles
-- This is needed so users can chat with realtors who list properties
CREATE POLICY "Allow all users to read realtor profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid() AND 
      (auth.users.raw_user_meta_data->>'role' = 'realtor' OR 
       auth.users.raw_user_meta_data->>'roles' LIKE '%realtor%')
    )
  );

-- Add comments to explain the policies
COMMENT ON POLICY "Users can read their own profile" ON profiles IS 'Allows users to read their own profile';
COMMENT ON POLICY "Users can update their own profile" ON profiles IS 'Allows users to update their own profile';
COMMENT ON POLICY "Allow admin users to read all profiles" ON profiles IS 'Allows users with admin role to read all user profiles without causing recursion';
COMMENT ON POLICY "Allow admin users to update all profiles" ON profiles IS 'Allows users with admin role to update all user profiles without causing recursion';
COMMENT ON POLICY "Allow admin users to delete profiles" ON profiles IS 'Allows users with admin role to delete user profiles without causing recursion';
COMMENT ON POLICY "Allow all users to read realtor profiles" ON profiles IS 'Allows all users to read realtor profiles for chat functionality';

-- Migration to fix Row Level Security (RLS) policies for the profiles table

-- First, ensure all existing admin RLS policies are dropped to avoid conflicts
DROP POLICY IF EXISTS "Allow admin users to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to delete profiles" ON profiles;

-- Add RLS policy to allow users to insert their own profile
-- This fixes the "new row violates row-level security policy for table 'profiles'" error
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Recreate admin RLS policies to only check the role column
-- Add RLS policy to allow admin users to read all profiles
CREATE POLICY "Allow admin users to read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add RLS policy to allow admin users to update all profiles
CREATE POLICY "Allow admin users to update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add RLS policy to allow admin users to delete profiles
CREATE POLICY "Allow admin users to delete profiles"
  ON profiles FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add comments to explain the policies
COMMENT ON POLICY "Users can insert their own profile" ON profiles IS 'Allows users to insert their own profile during registration';
COMMENT ON POLICY "Allow admin users to read all profiles" ON profiles IS 'Allows users with admin role to read all user profiles';
COMMENT ON POLICY "Allow admin users to update all profiles" ON profiles IS 'Allows users with admin role to update all user profiles';
COMMENT ON POLICY "Allow admin users to delete profiles" ON profiles IS 'Allows users with admin role to delete user profiles';

-- Ensure all data from role is properly migrated to roles
UPDATE profiles SET roles = ARRAY[role] WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

-- Create a trigger to keep roles and role in sync during the transition period
CREATE OR REPLACE FUNCTION sync_role_and_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- When roles is updated, update role to be the first element of roles
  IF NEW.roles IS NOT NULL AND array_length(NEW.roles, 1) > 0 THEN
    NEW.role := NEW.roles[1];
  END IF;
  
  -- When role is updated, ensure it's in the roles array
  IF NEW.role IS NOT NULL THEN
    IF NEW.roles IS NULL THEN
      NEW.roles := ARRAY[NEW.role];
    ELSIF NOT (NEW.role = ANY(NEW.roles)) THEN
      NEW.roles := array_append(NEW.roles, NEW.role);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the profiles table
DROP TRIGGER IF EXISTS sync_role_and_roles_trigger ON profiles;
CREATE TRIGGER sync_role_and_roles_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_role_and_roles();

-- Add comment to explain the purpose of the trigger
COMMENT ON FUNCTION sync_role_and_roles() IS 'Keeps role and roles columns in sync during transition period';

-- This migration removes the roles column and keeps only the role column

-- First, fix the admin RLS policies to avoid infinite recursion
-- Drop existing admin RLS policies
DROP POLICY IF EXISTS "Allow admin users to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin users to delete profiles" ON profiles;

-- Recreate RLS policies to only check the role column (not roles array)
-- Add RLS policy to allow admin users to read all profiles
CREATE POLICY "Allow admin users to read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add RLS policy to allow admin users to update all profiles
CREATE POLICY "Allow admin users to update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Add RLS policy to allow admin users to delete profiles
CREATE POLICY "Allow admin users to delete profiles"
  ON profiles FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Now, ensure all data from roles is properly migrated to role
-- If roles has values, set role to the first element of roles
UPDATE profiles SET role = roles[1] WHERE roles IS NOT NULL AND array_length(roles, 1) > 0 AND (role IS NULL OR role = '');

-- Drop the roles column
ALTER TABLE profiles DROP COLUMN IF EXISTS roles;

-- Add comment to explain the role column
COMMENT ON COLUMN profiles.role IS 'User role (e.g., user, admin, buyer, owner, realtor)';

-- Migration Script from MongoDB to PostgreSQL for Ella AI

-- This script assumes you have exported MongoDB data to JSON format
-- and are using a tool like mongodump/mongorestore or mongoexport/mongoimport

-- Step 1: Create a temporary staging table for users
CREATE TEMPORARY TABLE temp_users (
  data JSONB
);

-- Step 2: Create a temporary staging table for properties
CREATE TEMPORARY TABLE temp_properties (
  data JSONB
);

-- Step 3: Create a temporary staging table for chat sessions
CREATE TEMPORARY TABLE temp_chat_sessions (
  data JSONB
);

-- Step 4: Import MongoDB JSON data into temporary tables
-- You would use COPY or \COPY commands here with your exported JSON data
-- Example:
-- \COPY temp_users (data) FROM 'path/to/users.json';
-- \COPY temp_properties (data) FROM 'path/to/properties.json';
-- \COPY temp_chat_sessions (data) FROM 'path/to/chat_sessions.json';

-- Step 5: Migrate users from MongoDB to PostgreSQL
INSERT INTO users (
  id,
  name,
  email,
  password,
  phone,
  profile_image,
  preferences,
  role,
  reset_password_token,
  reset_password_expire,
  created_at,
  updated_at
)
SELECT
  (data->>'_id')::integer,
  data->>'name',
  data->>'email',
  data->>'password',
  data->>'phone',
  data->>'profileImage',
  (data->>'preferences')::jsonb,
  data->>'role',
  data->>'resetPasswordToken',
  (data->>'resetPasswordExpire')::timestamp,
  (data->>'createdAt')::timestamp,
  (data->>'updatedAt')::timestamp
FROM temp_users;

-- Step 6: Migrate properties from MongoDB to PostgreSQL
INSERT INTO properties (
  id,
  title,
  description,
  price,
  requesting_price,
  is_negotiable,
  currency,
  location,
  coordinates,
  type,
  property_type,
  features,
  images,
  owner_id,
  views,
  status,
  is_distressed,
  distress_reason,
  original_price,
  distressed_deal_approved,
  distressed_deal_start_date,
  distressed_deal_end_date,
  distressed_deal_daily_fee,
  distressed_deal_payment_status,
  created_at,
  updated_at
)
SELECT
  (data->>'_id')::integer,
  data->>'title',
  data->>'description',
  (data->>'price')::decimal,
  (data->>'requestingPrice')::decimal,
  (data->>'isNegotiable')::boolean,
  data->>'currency',
  data->>'location',
  (data->>'coordinates')::jsonb,
  data->>'type',
  data->>'propertyType',
  (data->>'features')::jsonb,
  (data->>'images')::jsonb,
  (data->>'owner')::integer,
  (data->>'views')::integer,
  data->>'status',
  (data->>'isDistressed')::boolean,
  data->>'distressReason',
  (data->>'originalPrice')::decimal,
  (data->>'distressedDealApproved')::boolean,
  (data->>'distressedDealStartDate')::timestamp,
  (data->>'distressedDealEndDate')::timestamp,
  (data->>'distressedDealDailyFee')::decimal,
  data->>'distressedDealPaymentStatus',
  (data->>'createdAt')::timestamp,
  (data->>'updatedAt')::timestamp
FROM temp_properties;

-- Step 7: Migrate saved properties relationships
INSERT INTO saved_properties (
  user_id,
  property_id,
  created_at
)
SELECT
  (data->>'user_id')::integer,
  jsonb_array_elements_text(data->'savedProperties')::integer,
  CURRENT_TIMESTAMP
FROM temp_users;

-- Step 8: Migrate chat sessions from MongoDB to PostgreSQL
INSERT INTO chat_sessions (
  id,
  user_id,
  title,
  last_message,
  unread,
  context,
  is_active,
  created_at,
  updated_at
)
SELECT
  (data->>'_id')::integer,
  (data->>'user')::integer,
  data->>'title',
  data->>'lastMessage',
  (data->>'unread')::integer,
  (data->>'context')::jsonb,
  (data->>'isActive')::boolean,
  (data->>'createdAt')::timestamp,
  (data->>'updatedAt')::timestamp
FROM temp_chat_sessions;

-- Step 9: Migrate messages from chat sessions
INSERT INTO messages (
  session_id,
  text,
  sender,
  attachments,
  created_at
)
SELECT
  (data->>'_id')::integer,
  msg->>'text',
  msg->>'sender',
  (msg->>'attachments')::jsonb,
  (msg->>'timestamp')::timestamp
FROM temp_chat_sessions,
jsonb_array_elements(data->'messages') as msg;

-- Step 10: Migrate property references in chat
INSERT INTO chat_property_references (
  session_id,
  property_id,
  created_at
)
SELECT
  (data->>'_id')::integer,
  jsonb_array_elements_text(data->'context'->'propertyReferences')::integer,
  CURRENT_TIMESTAMP
FROM temp_chat_sessions
WHERE jsonb_array_length(data->'context'->'propertyReferences') > 0;

-- Step 11: Clean up temporary tables
DROP TABLE temp_users;
DROP TABLE temp_properties;
DROP TABLE temp_chat_sessions;
