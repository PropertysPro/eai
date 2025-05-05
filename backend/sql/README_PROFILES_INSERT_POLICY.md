# Profiles RLS Policy Fix

## Issue

Users were unable to register and create profiles due to a Row Level Security (RLS) policy violation. The error message was:

```
new row violates row-level security policy for table "profiles"
```

The root cause was that while RLS was enabled on the profiles table, there were policies for SELECT and UPDATE operations, but no policy for INSERT operations. This meant that even though the auth service was attempting to create a profile for a new user during registration, the database was rejecting the insert operation due to RLS.

## Solution

Two migration files have been created to fix this issue:

1. `migration_add_profiles_insert_policy.sql`: Adds an RLS policy that allows users to insert their own profile:

```sql
-- Add RLS policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

2. `migration_fix_rls_policies.sql`: A comprehensive fix that combines the INSERT policy with fixes for admin RLS policies:

```sql
-- Add RLS policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Recreate admin RLS policies to only check the role column
CREATE POLICY "Allow admin users to read all profiles"...
CREATE POLICY "Allow admin users to update all profiles"...
CREATE POLICY "Allow admin users to delete profiles"...
```

These policies allow a user to insert a row into the profiles table only if the `id` column matches their authenticated user ID (`auth.uid()`), while also fixing admin access.

## How to Apply the Fix

### Option 1: Apply only the INSERT policy

1. Connect to your Supabase project using the SQL Editor
2. Run the SQL commands in `migration_add_profiles_insert_policy.sql`
3. Verify that users can now register and create profiles successfully

### Option 2: Apply the comprehensive fix (recommended)

1. Connect to your Supabase project using the SQL Editor
2. Run the SQL commands in `migration_fix_rls_policies.sql`
3. Verify that users can now register and create profiles successfully, and that admin functionality works correctly

## Technical Details

The RLS policies work by checking if the authenticated user's ID matches the `id` column of the row being inserted or accessed. This ensures that users can only create and manage their own profile, not profiles for other users.

The admin policies work by checking if the authenticated user has the 'admin' role in the profiles table. This allows admin users to manage all profiles in the system.

These fixes complement the existing RLS policies:
- "Users can read their own profile" (SELECT)
- "Users can update their own profile" (UPDATE)

With these additions, the profiles table now has complete RLS coverage for all necessary operations, ensuring proper security while allowing the application to function correctly.
