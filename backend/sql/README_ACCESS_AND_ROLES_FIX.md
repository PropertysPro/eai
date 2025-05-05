# Access and User Roles Fix

## Issues Fixed

This update addresses several issues related to user roles and access control in the application:

1. **Role Column Inconsistency**: Fixed inconsistencies between the `role` field in the User interface and the database schema.

2. **Admin Access Problems**: Resolved issues with admin users not being able to access all profiles due to Row Level Security (RLS) policies.

3. **Profile Creation Issues**: Fixed problems with user profile creation during registration.

4. **Auth Service Bugs**: Corrected several bugs in the auth service related to user preferences mapping and profile updates.

5. **Missing Avatar Column**: Added the missing `avatar` column to the profiles table and updated the auth service to handle cases where the column might not exist yet.

## Changes Made

### 1. SQL Migration

A new migration file `migration_fix_admin_access.sql` has been created that:

- Drops existing conflicting admin RLS policies
- Creates a secure `is_admin()` function to check admin status
- Adds proper RLS policies for admin users to:
  - Read all profiles
  - Update all profiles
  - Delete profiles (except their own)
- Adds an RLS policy to allow users to insert their own profile during registration

### 2. Auth Service Fixes

The `auth-service.ts` file has been updated to:

- Fix the `updateProfile` function to properly handle user preferences
- Correct the mapping between database fields and the User interface
- Ensure proper handling of the `role` field
- Fix the `getCurrentUser` function to properly map profile data

### 3. Admin Panel Fixes

The `app/admin/index.tsx` file has been updated to:

- Use the single `role` field instead of the deprecated `roles` array
- Fix duplicate property issues in the user creation form

## How to Apply the Fix

1. **Apply the SQL Migration**:
   - Connect to your Supabase project using the SQL Editor
   - Run the SQL commands in `migration_fix_admin_access.sql`
   - This will update the RLS policies to allow proper admin access

2. **Deploy the Updated Code**:
   - The changes to `auth-service.ts` and `app/admin/index.tsx` have already been applied
   - These changes ensure proper handling of user roles and preferences

## Testing the Fix

After applying the fix, you should test:

1. **User Registration**: Ensure new users can register successfully
2. **Admin Access**: Verify admin users can:
   - View all users in the admin panel
   - Create new users
   - Edit existing users
   - Delete users (except the main admin account)
3. **Profile Updates**: Check that users can update their profiles and preferences

## Technical Details

### Role Field

The application now consistently uses a single `role` field (string) instead of both `role` and `roles` fields. Valid roles are:

- `user`: Regular user with limited access
- `admin`: Administrator with full access to all profiles

### RLS Policies

The RLS policies now use a secure function `is_admin()` to check if the current user has admin privileges. This approach is more secure and maintainable than directly checking the role in each policy.

### User Interface Mapping

The auth service now properly maps between the database schema and the User interface, ensuring all fields are correctly handled, including:

- User preferences
- Property preferences
- Notification settings
- Role and subscription information
