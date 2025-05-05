# Fixing Infinite Recursion in Profiles RLS Policies

## Issue

The application was encountering an error when updating user profiles:

```
infinite recursion detected in policy for relation "profiles"
```

This error occurred when making PATCH requests to the Supabase REST API endpoint for updating profiles. The specific error code was `42P17`, which is PostgreSQL's error code for infinite recursion.

## Root Cause

The issue was caused by self-referential Row Level Security (RLS) policies on the `profiles` table. The RLS policies for various roles (admin, owner, buyer, realtor) were causing infinite recursion because they were querying the same `profiles` table within their own policy definitions:

```sql
-- Problematic policy that causes infinite recursion
CREATE POLICY "Allow admin users to update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
```

When a user tries to update a profile, Supabase checks if they have permission according to the RLS policies. The policy above checks if the user's ID is in the list of admin users by querying the `profiles` table. However, to query the `profiles` table, Supabase needs to check the RLS policies again, which leads to an infinite recursion.

## User Role Structure

The application has multiple user types:
1. **Admin** - Can access the admin panel and see/update all data
2. **Buyer** - Regular user looking to buy properties
3. **Owner** - User who owns properties
4. **Realtor** - User who lists properties and can be contacted by other users

Buyers, owners, and realtors all have the same features, with the only difference being that realtors can be contacted by other users through chat when they list properties.

## Solution

The solution is to rewrite all role-based RLS policies to avoid querying the `profiles` table within its own policy. Instead, we use the `auth.users` table and the JWT claims to determine a user's role:

```sql
CREATE POLICY "Allow admin users to update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid() AND 
      (auth.users.raw_user_meta_data->>'role' = 'admin' OR 
       auth.users.raw_user_meta_data->>'roles' LIKE '%admin%')
    )
  );
```

This approach checks if:
1. The user's JWT token contains a role claim with the value 'admin', OR
2. The user's metadata in the `auth.users` table indicates they have an admin role

By avoiding the self-reference to the `profiles` table, we prevent the infinite recursion.

We've also added a special policy to allow all users to read realtor profiles, which is necessary for the chat functionality:

```sql
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
```

## Implementation

The fix is implemented in the `migration_fix_infinite_recursion.sql` file, which:

1. Drops all existing role-based RLS policies
2. Creates basic user policies for reading and updating their own profiles
3. Creates admin policies that allow admins to read, update, and delete all profiles
4. Creates a special policy to allow all users to read realtor profiles for chat functionality

## How to Apply

Run the migration script against your Supabase database:

```bash
psql -h your-supabase-db-host -U postgres -d postgres -f migration_fix_infinite_recursion.sql
```

Or apply it through the Supabase SQL Editor in the dashboard.

## Testing

After applying the fix, test profile updates for all user types to ensure:
1. Regular users can update their own profiles
2. Admin users can update any profile
3. All users can view realtor profiles for chat functionality
4. No infinite recursion errors occur for any role
