# Wallet Withdrawal Function

## Issue

The application was encountering errors when trying to request withdrawals from a wallet:

```
Error requesting withdrawal: {code: 'PGRST301', details: null, hint: null, message: 'function request_withdrawal(uuid, numeric, jsonb) does not exist'}
```

This error occurs because the wallet service is trying to call functions called `request_withdrawal` and `approve_withdrawal` that don't exist in the database.

## Solution

The migration script `migration_add_wallet_withdrawal_function.sql` addresses this issue by:

1. Creating the `withdrawal_requests` table if it doesn't exist
2. Creating a `request_withdrawal` function that validates the withdrawal request and creates a record in the withdrawal_requests table
3. Creating an `approve_withdrawal` function that approves a withdrawal request and updates the wallet balance
4. Granting the necessary permissions for authenticated users to execute these functions

## Implementation Details

The script includes:

- **Table Creation**: Creates the `withdrawal_requests` table if it doesn't exist
- **Function Creation**: 
  - `request_withdrawal`: Takes a user ID, amount, and payment details as parameters
  - `approve_withdrawal`: Takes a request ID as a parameter
- **Input Validation**: 
  - Ensures the withdrawal amount is greater than zero
  - Checks if the user has sufficient balance
- **Transaction Processing**: Uses the existing `update_wallet_balance` function to create a transaction record and update the wallet balance when a withdrawal is approved
- **Permissions**: Grants execute permission to authenticated users

## How to Apply

Run the migration script against your Supabase database:

```bash
psql -h your-supabase-host -d postgres -U postgres -f migration_add_wallet_withdrawal_function.sql
```

Or copy and paste the SQL commands into the Supabase SQL Editor.

## Verification

After applying this migration, the withdrawal functionality should work correctly. Users should be able to:

1. Request withdrawals from their wallet
2. See the pending withdrawal requests
3. Admins should be able to approve withdrawal requests

If you still encounter issues after applying the migration, check the Supabase logs for more details.
