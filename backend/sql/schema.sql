-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  subscription TEXT DEFAULT 'free',
  message_count INTEGER DEFAULT 0,
  message_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  -- User Preferences
  language TEXT DEFAULT 'en',
  dark_mode BOOLEAN DEFAULT FALSE,
  biometric_auth BOOLEAN DEFAULT FALSE,
  -- Notification Preferences
  notification_matches BOOLEAN DEFAULT TRUE,
  notification_market_updates BOOLEAN DEFAULT TRUE,
  notification_new_listings BOOLEAN DEFAULT TRUE,
  notification_subscription_updates BOOLEAN DEFAULT TRUE,
  -- Property Preferences
  property_types TEXT[] DEFAULT '{}',
  property_budget_min NUMERIC DEFAULT 500000,
  property_budget_max NUMERIC DEFAULT 2000000,
  property_bedrooms INTEGER DEFAULT 0,
  property_bathrooms INTEGER DEFAULT 0,
  property_locations TEXT[] DEFAULT '{}',
  -- Additional Preferences
  location TEXT DEFAULT 'Dubai, UAE',
  currency TEXT DEFAULT 'AED',
  is_negotiable BOOLEAN DEFAULT FALSE,
  requesting_price NUMERIC
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  last_message TEXT
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments JSONB DEFAULT '[]'::jsonb
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',
  bedrooms INTEGER,
  bathrooms NUMERIC,
  square_feet INTEGER,
  lot_size NUMERIC,
  year_built INTEGER,
  type TEXT,
  listing_type TEXT,
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT FALSE,
  area NUMERIC,
  area_unit TEXT DEFAULT 'sqft',
  owner_name TEXT,
  is_distressed BOOLEAN DEFAULT FALSE,
  distress_reason TEXT,
  original_price NUMERIC,
  discount_percentage NUMERIC,
  urgency TEXT,
  estimated_value NUMERIC,
  potential_roi NUMERIC,
  market_trend TEXT,
  is_negotiable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY (userId)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies

-- Profiles: Admin users can read all profiles
CREATE POLICY "Allow admin users to read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.uid() = id AND (raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Profiles: Admin users can update all profiles
CREATE POLICY "Allow admin users to update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.uid() = id AND (raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Profiles: Admin users can update all profiles
CREATE POLICY "Allow admin users to update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.uid() = id AND (raw_user_meta_data ->> 'role') = 'admin'
    )
  );

-- Profiles: All users can read realtor profiles
CREATE POLICY "Allow all users to read realtor profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = profiles.id AND 
      (auth.users.raw_user_meta_data->>'role' = 'realtor' OR 
       auth.users.raw_user_meta_data->>'roles' LIKE '%realtor%')
    )
  );

-- Chat Sessions: Users can read their own chat sessions
CREATE POLICY "Users can read their own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Chat Sessions: Users can insert their own chat sessions
CREATE POLICY "Users can insert their own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chat Sessions: Users can update their own chat sessions
CREATE POLICY "Users can update their own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Chat Sessions: Users can delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Chat Messages: Users can read their own chat messages
CREATE POLICY "Users can read their own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Chat Messages: Users can insert their own chat messages
CREATE POLICY "Users can insert their own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chat Messages: Users can delete their own chat messages
CREATE POLICY "Users can delete their own chat messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Allow users to read all properties
CREATE POLICY "Allow public read access"
  ON properties FOR SELECT
  USING (true);

-- Allow users to insert their own properties
CREATE POLICY "Allow users to insert their own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = userId);

-- Allow users to update their own properties
CREATE POLICY "Allow users to update their own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = userId);

-- Allow users to delete their own properties
CREATE POLICY "Allow users to delete their own properties"
  ON properties FOR DELETE
  USING (auth.uid() = userId);

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
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.uid() = id AND (raw_user_meta_data ->> 'role') = 'admin'
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

-- Add RLS policy to allow users to read their own profile
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

COMMENT ON POLICY "Users can read their own profile" ON profiles IS 'Allows users to read their own profile';

-- Add RLS policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Users can update their own profile" ON profiles IS 'Allows users to update their own profile';

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
    ) AND (NOT (OLD.updated_at = NEW.updated_at))
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
