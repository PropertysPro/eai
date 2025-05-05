# Subscription Columns Fix

## Issue

The application was encountering errors when trying to access columns in the `subscriptions` table that were missing from the schema cache:

```
Could not find the 'cancel_at_period_end' column of 'subscriptions' in the schema cache
Could not find the 'is_active' column of 'subscriptions' in the schema cache
Could not find the 'current_period_end' column of 'subscriptions' in the schema cache
```

These errors occurred in the checkout process when trying to save a new subscription.

## Solution

We've created three migration scripts to fix this issue:

### Option 1: Add Missing Columns (migration_add_subscription_columns.sql)

This script adds the missing columns to the existing `subscriptions` table:

1. Adds an `is_active` column (Boolean, default TRUE) if it doesn't exist
2. Adds a `cancel_at_period_end` column (Boolean, default FALSE) if it doesn't exist
3. Adds `current_period_start` and `current_period_end` columns (TIMESTAMP WITH TIME ZONE) if they don't exist
4. Updates existing subscription records to have these values properly set

### Option 2: Rebuild Subscriptions Table (migration_rebuild_subscriptions_table.sql)

If Option 1 doesn't resolve the schema cache issues, this more comprehensive script:

1. Creates a backup of the existing subscriptions table
2. Drops and recreates the subscriptions table with all required columns
3. Attempts to restore data from the backup (with fallbacks for missing columns)
4. Recreates all RLS policies

This approach ensures a clean table structure that should resolve any schema cache issues.

### Option 3: Create New Subscriptions Table (migration_create_new_subscriptions_table.sql) - SIMPLEST

If you don't have important subscription data to preserve, this is the simplest option:

1. Drops the existing subscriptions table
2. Creates a new subscriptions table with all required columns
3. Sets up RLS policies

This is the most reliable approach if you're willing to start with a fresh subscriptions table.

## Implementation Details

The subscriptions table now includes these columns:

- `is_active` - Boolean that indicates whether the subscription is currently active
- `cancel_at_period_end` - Boolean that indicates whether the subscription should be canceled when the current billing period ends
- `current_period_start` - Timestamp that indicates when the current billing period started
- `current_period_end` - Timestamp that indicates when the current billing period ends

## How to Apply

### Option 1: Add Missing Columns

```bash
psql -h your-supabase-host -d postgres -U postgres -f migration_add_subscription_columns.sql
```

### Option 2: Rebuild Subscriptions Table (Preserves Data)

```bash
psql -h your-supabase-host -d postgres -U postgres -f migration_rebuild_subscriptions_table.sql
```

### Option 3: Create New Subscriptions Table (Simplest)

```bash
psql -h your-supabase-host -d postgres -U postgres -f migration_create_new_subscriptions_table.sql
```

Or copy and paste the SQL commands into the Supabase SQL Editor.

## Code Changes

The checkout.tsx file has been updated to use the correct column names in the subscription creation process:

```javascript
const { data: subscriptionData, error: subscriptionError } = await supabase
  .from('subscriptions')
  .insert([
    {
      user_id: user.id,
      plan_id: planId,
      status: 'active',
      is_active: true,
      cancel_at_period_end: false,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    }
  ])
  .select();
```

## Verification

After applying the migration, the checkout process should work correctly without the previous errors. If you still encounter issues with the schema cache, try refreshing your Supabase connection or restarting your application.
