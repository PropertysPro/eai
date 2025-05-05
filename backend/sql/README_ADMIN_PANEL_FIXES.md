# Admin Panel Fixes

This document outlines two issues affecting the admin panel and provides solutions for both.

## Issue 1: Admin Panel Can't Read Users

### Problem
The admin panel is unable to read all users due to Row Level Security (RLS) policies in Supabase. The existing RLS policies are either missing or incorrectly configured, preventing admin users from accessing all profiles.

### Solution
Apply the `migration_fix_admin_access.sql` migration, which:

1. Drops existing admin RLS policies that might be causing conflicts
2. Creates a secure `is_admin()` function to check if a user has admin privileges
3. Adds proper RLS policies to allow admin users to read, update, and delete profiles

```sql
-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy to allow admin users to read all profiles
CREATE POLICY "Allow admin users to read all profiles"
  ON profiles FOR SELECT
  USING (
    is_admin() OR auth.uid() = id
  );
```

## Issue 2: Chat Sessions Relationship Error

### Problem
The admin panel is unable to fetch chat sessions with user information, resulting in the error:
```
Error fetching chat sessions: Could not find a relationship between 'chat_sessions' and 'profiles' in the schema cache
```

This occurs because the `chat_sessions` table has a foreign key to `auth.users`, but the code is trying to join with the `profiles` table.

### Solution
Apply the `migration_fix_chat_sessions_relationship.sql` migration, which:

1. Drops the existing foreign key constraint from `chat_sessions.user_id` to `auth.users`
2. Adds a new foreign key constraint from `chat_sessions.user_id` to `profiles.id`

```sql
-- Drop the existing foreign key constraint
ALTER TABLE chat_sessions DROP CONSTRAINT chat_sessions_user_id_fkey;

-- Add a foreign key constraint that references profiles instead of auth.users
ALTER TABLE chat_sessions
ADD CONSTRAINT chat_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

## How to Apply the Fixes

1. Connect to your Supabase project using the SQL Editor in the Supabase dashboard
2. First, apply the `migration_fix_admin_access.sql` migration to fix the admin access issue
3. Then, apply the `migration_fix_chat_sessions_relationship.sql` migration to fix the chat sessions relationship issue
4. Refresh the admin panel and verify that both issues are resolved

## Testing the Fixes

After applying the migrations:

1. Log in as an admin user and navigate to the admin panel
2. Verify that you can see all users in the "Users" tab
3. Verify that you can see all chat sessions in the "Chats" tab
4. Test creating, editing, and deleting users to ensure all admin functions work correctly
