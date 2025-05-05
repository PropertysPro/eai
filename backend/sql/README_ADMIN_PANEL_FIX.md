# Admin Panel Fix: Reading All Users

## Issue
The admin panel was unable to read all users due to Row Level Security (RLS) policies in Supabase. The existing RLS policy only allowed users to read their own profile:

```sql
-- Profiles: Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

This meant that even admin users could only see their own profile in the admin panel, not all users as expected.

## Solution

The solution consists of two parts:

### 1. Updated Admin Panel Code

The `fetchUsers` function in `app/admin/index.tsx` has been updated to:

1. Check if the current user has admin privileges
2. Use a more robust query to fetch all users
3. Handle errors appropriately

The updated function now:
- Verifies the current user's session
- Checks if the user has the 'admin' role
- Orders the results by creation date
- Provides better error handling

### 2. Added RLS Policies for Admin Users

A new migration file `migration_add_admin_rls_policy.sql` has been created with RLS policies that allow admin users to read, update, and delete all profiles:

```sql
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
```

## How to Apply the Fix

1. **Update the Admin Panel Code**:
   - The changes to `app/admin/index.tsx` have already been applied.

2. **Apply the SQL Migrations**:
   - Connect to your Supabase project using the SQL Editor
   - First, run the SQL commands in `migration_add_roles_column.sql` if you haven't already
     - This adds the 'roles' column to the profiles table which is needed for the admin panel
   - Then, run the SQL commands in `migration_add_admin_rls_policy.sql`
     - This will add the necessary RLS policies to allow admin users to manage all profiles

3. **Uncomment the roles field in handleAddUser function**:
   - After applying the migrations, edit the `app/admin/index.tsx` file
   - Find the `handleAddUser` function and uncomment the line `// roles: [newUserRole],`
   - This will ensure new users are created with the proper roles array

4. **Verify the Fix**:
   - Log in to the application as an admin user
   - Navigate to the admin panel
   - Verify that you can now see all users in the system

## Technical Details

The RLS policies work by checking if the authenticated user's ID is in the list of admin users. This is done by querying the profiles table for users with the 'admin' role, either in the `role` column or in the `roles` array.

The updated `fetchUsers` function in the admin panel also performs a similar check to ensure that only admin users can access this functionality, providing an additional layer of security.
