-- Migration to add missing columns to subscriptions table
-- This fixes the errors:
-- "Could not find the 'cancel_at_period_end' column of 'subscriptions' in the schema cache"
-- "Could not find the 'is_active' column of 'subscriptions' in the schema cache"
-- "Could not find the 'current_period_end' column of 'subscriptions' in the schema cache"

-- Add is_active column if it doesn't exist
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add comment to explain the column
COMMENT ON COLUMN subscriptions.is_active IS 'Indicates if the subscription is currently active';

-- Add cancel_at_period_end column if it doesn't exist
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Indicates if the subscription should be canceled at the end of the current period';

-- Add current_period_start column if it doesn't exist
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the column
COMMENT ON COLUMN subscriptions.current_period_start IS 'Start date of the current billing period';

-- Add current_period_end column if it doesn't exist
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the column
COMMENT ON COLUMN subscriptions.current_period_end IS 'End date of the current billing period';

-- Update existing subscriptions to have these values set
UPDATE subscriptions 
SET 
  is_active = (status = 'active'),
  cancel_at_period_end = FALSE,
  current_period_start = created_at,
  current_period_end = created_at + INTERVAL '30 days'
WHERE is_active IS NULL OR current_period_start IS NULL;
