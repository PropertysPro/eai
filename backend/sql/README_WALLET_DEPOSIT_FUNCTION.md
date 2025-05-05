# Wallet Deposit Function

## Issue

The application was encountering errors when trying to deposit funds to a wallet:

```
Error processing deposit: {code: 'PGRST301', details: null, hint: null, message: 'function process_wallet_deposit(uuid, numeric) does not exist'}
```

This error occurs because the wallet service is trying to call a function called `process_wallet_deposit` that doesn't exist in the database.

## Solution

The migration script `migration_add_wallet_deposit_function.sql` addresses this issue by:

1. Creating a `process_wallet_deposit` function that uses the existing `update_wallet_balance` function to process deposits
2. Granting the necessary permissions for authenticated users to execute the function

## Implementation Details

The script includes:

- **Function Creation**: Creates the `process_wallet_deposit` function that takes a user ID and amount as parameters
- **Input Validation**: Ensures the deposit amount is greater than zero
- **Transaction Processing**: Uses the existing `update_wallet_balance` function to create a transaction record and update the wallet balance
- **Permissions**: Grants execute permission to authenticated users

## How to Apply

Run the migration script against your Supabase database:

```bash
psql -h your-supabase-host -d postgres -U postgres -f migration_add_wallet_deposit_function.sql
```

Or copy and paste the SQL commands into the Supabase SQL Editor.

## Verification

After applying this migration, the deposit functionality should work correctly. Users should be able to:

1. Add funds to their wallet
2. See the updated balance
3. View the deposit transaction in their transaction history

If you still encounter issues after applying the migration, check the Supabase logs for more details.
