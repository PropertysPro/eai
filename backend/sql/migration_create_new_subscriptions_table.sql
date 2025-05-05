-- Migration to create a new subscriptions table with all required columns
-- This is the simplest approach if you don't have important subscription data to preserve

-- Drop the existing subscriptions table
DROP TABLE IF EXISTS subscriptions;

-- Create the subscriptions table with all required columns
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

-- Enable RLS on the subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the subscriptions table
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
