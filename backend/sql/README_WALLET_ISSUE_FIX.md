# Wallet Issue Fix

## Issue

The application was encountering errors when trying to access wallet data:

```
GET https://gjymtvzdvyekhocqyvpa.supabase.co/rest/v1/wallets?select=*&user_id=eq.8e86868d-0bbe-4734-a719-74c2fe01af90 406 (Not Acceptable)

Error fetching wallet: 
{code: 'PGRST116', details: 'The result contains 0 rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned'}
```

This error occurs because the wallet service is trying to fetch a wallet for a user using the `.single()` method, but no wallet record exists for that user.

## Solution

The migration script `migration_fix_wallet_issue.sql` addresses this issue by:

1. Ensuring the wallets table exists with the correct structure
2. Creating wallet records for all users who don't have one
3. Creating a trigger to automatically create a wallet for new users
4. Adding a `get_user_wallet` function that creates a wallet if one doesn't exist
5. Updating the `update_wallet_balance` function to create a wallet if needed

## Implementation Details

The script includes several key components:

- **Table Creation**: Creates the wallets table if it doesn't exist
- **Data Migration**: Adds wallet records for all existing users
- **Trigger**: Ensures new users automatically get a wallet
- **Helper Functions**: Provides functions to safely get and update wallets
- **Row Level Security**: Sets up appropriate RLS policies for the wallets table

## How to Apply

Run the migration script against your Supabase database:

```bash
psql -h your-supabase-host -d postgres -U postgres -f migration_fix_wallet_issue.sql
```

Or copy and paste the SQL commands into the Supabase SQL Editor.

## Code Changes

The wallet service is using `.single()` when querying wallets, which expects exactly one row to be returned. The migration ensures that every user has exactly one wallet record, fixing the issue.

## Verification

After applying this migration, the wallet functionality should work correctly without the previous errors. Users should be able to:

1. View their wallet balance
2. Make deposits
3. Request withdrawals
4. See transaction history

If you still encounter issues after applying the migration, try refreshing your Supabase connection or restarting your application.
