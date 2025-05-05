# Role Column Fix

## Issue

The profiles table in Supabase had two columns for user roles:
- `role` (TEXT): A single role value
- `roles` (TEXT[]): An array of role values

This dual-column approach was causing confusion and potential inconsistencies in the application.

## Solution

After evaluating the options, we decided to keep only the `role` column and remove the `roles` column. This simplifies the data model and avoids potential inconsistencies.

## Migration Steps

1. Created `migration_remove_roles_column.sql` to:
   - Fix admin RLS policies to avoid infinite recursion
   - Ensure all data from `roles` is properly migrated to `role` (if needed)
   - Drop the `roles` column

2. Updated application code to:
   - Remove all references to the `roles` array
   - Use only the `role` string for role-based functionality

## Code Changes

The following files were updated:

1. `types/user.ts`: Removed the `roles` property from the User interface
2. `context/auth-context.tsx`: Updated to use only the `role` property for admin checks
3. `services/auth-service.ts`: Updated to use only the `role` property when creating/updating user profiles

## Implementation

To apply these changes:

1. Run the `migration_remove_roles_column.sql` migration to update the database
   - This will first fix the admin RLS policies to avoid infinite recursion
   - Then migrate data and drop the `roles` column
2. Deploy the updated code that uses only the `role` column

## Backward Compatibility

Since we're keeping the `role` column, which was the original column, backward compatibility is maintained. Any code that was using the `role` column will continue to work as expected.
