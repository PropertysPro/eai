-- Migration to rebuild the subscriptions table with all required columns
-- This is a more comprehensive fix for the schema cache issues

-- First, create a backup of the existing subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions_backup AS
SELECT * FROM subscriptions;

-- Drop the existing subscriptions table
DROP TABLE IF EXISTS subscriptions;

-- Recreate the subscriptions table with all required columns
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to explain the columns
COMMENT ON COLUMN subscriptions.is_active IS 'Indicates if the subscription is currently active';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Indicates if the subscription should be canceled at the end of the current period';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Start date of the current billing period';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End date of the current billing period';

-- Restore data from the backup table if it exists and has data
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions_backup') THEN
    -- Check if the backup table has the expected columns
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions_backup' AND column_name = 'plan_id'
    ) INTO column_exists;
    
    IF column_exists THEN
      -- If the backup table has plan_id column, use it
      INSERT INTO subscriptions (
        id, 
        user_id, 
        plan_id, 
        status, 
        created_at, 
        updated_at
      )
      SELECT 
        id, 
        user_id, 
        plan_id, 
        status, 
        created_at, 
        updated_at
      FROM 
        subscriptions_backup;
    ELSE
      -- If the backup table doesn't have plan_id column, use a default value
      INSERT INTO subscriptions (
        id, 
        user_id, 
        status, 
        created_at, 
        updated_at
      )
      SELECT 
        id, 
        user_id, 
        status, 
        created_at, 
        updated_at
      FROM 
        subscriptions_backup;
        
      -- Set a default plan_id for existing subscriptions
      UPDATE subscriptions 
      SET plan_id = 'free' 
      WHERE plan_id IS NULL;
    END IF;
      
    -- Update the new columns with appropriate values
    UPDATE subscriptions 
    SET 
      is_active = (status = 'active'),
      cancel_at_period_end = FALSE,
      current_period_start = created_at,
      current_period_end = created_at + INTERVAL '30 days';
  END IF;
END $$;

-- Enable RLS on the subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for the subscriptions table
CREATE POLICY "Users can read their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Drop the backup table if everything is successful
-- Uncomment this after verifying the migration worked correctly
-- DROP TABLE IF EXISTS subscriptions_backup;
