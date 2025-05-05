# Database Schema for Real Estate App

This directory contains SQL scripts for setting up and managing the database for the real estate application.

## Files

- `schema.sql`: Contains the database schema definition with tables, indexes, and security policies
- `sample_data.sql`: Contains sample data for testing and development
- `migration.sql`: Contains database migration scripts for version updates
- `migration_add_profiles_insert_policy.sql`: Adds an INSERT policy for the profiles table
- `migration_fix_rls_policies.sql`: Comprehensive fix for RLS policies on the profiles table

## Migration Files

Several migration files are available to address specific issues:

- **RLS Policy Fixes**:
  - `migration_add_profiles_insert_policy.sql`: Fixes the "new row violates row-level security policy" error by adding an INSERT policy for the profiles table
  - `migration_fix_rls_policies.sql`: Comprehensive fix that combines the INSERT policy with fixes for admin RLS policies
  - `migration_fix_admin_rls_policy.sql`: Fixes admin RLS policies to avoid infinite recursion
  - `migration_add_admin_rls_policy.sql`: Adds RLS policies for admin users

- **Role Column Fixes**:
  - `migration_add_roles_column.sql`: Adds the roles column to the profiles table
  - `migration_fix_roles_column.sql`: Ensures data consistency between role and roles columns
  - `migration_remove_roles_column.sql`: Removes the roles column and keeps only the role column
  - `migration_drop_role_column.sql`: Alternative approach to drop the role column

- **Other Migrations**:
  - `migration_add_avatar_column.sql`: Adds avatar column to profiles
  - `migration_add_favorites_table.sql`: Adds favorites table
  - `migration_add_admin_chat.sql`: Adds admin chat functionality

## Database Structure

The database is designed to support a real estate application with the following main entities:

1. **Users**: Store user information, preferences, and subscription details
2. **Properties**: Store property listings with details like price, location, features
3. **Saved Properties**: Track properties saved by users
4. **Property Views**: Track property view statistics
5. **Property Matches**: Store property recommendations for users
6. **Subscription Plans**: Define available subscription plans
7. **User Subscriptions**: Track user subscriptions
8. **Chat Sessions**: Store chat conversations between users and AI
9. **Chat Messages**: Store individual messages in chat sessions
10. **Notifications**: Store user notifications
11. **User Activity Log**: Track user actions for analytics

## Security

The database uses Row Level Security (RLS) to ensure that users can only access their own data. Each table has specific policies that control access based on the authenticated user.

## Setup Instructions

1. Connect to your Supabase project using the SQL Editor
2. Run the `schema.sql` script to create the database structure
3. Run the `sample_data.sql` script to populate the database with sample data

## Migrations

When updating the database schema:

1. Create a new migration script with a descriptive name (e.g., `migration_add_new_feature.sql`)
2. Document the changes in a corresponding README file (e.g., `README_NEW_FEATURE.md`)
3. Test the migration on a development environment before applying to production

### Applying Migrations

To apply a migration:

1. Connect to your Supabase project using the SQL Editor
2. Run the specific migration script you need
3. Verify the changes were applied correctly

For comprehensive fixes that address multiple issues, use the combined migration files like `migration_fix_rls_policies.sql`.

## Row Level Security Policies

The database uses the following RLS policies:

- **Profiles Table**:
  - Users can read their own profile (`auth.uid() = id`)
  - Users can update their own profile (`auth.uid() = id`)
  - Users can insert their own profile (`auth.uid() = id`)
  - Admin users can read all profiles
  - Admin users can update all profiles
  - Admin users can delete profiles

- **Properties Table**:
  - All users can read properties
  - Users can only insert, update, and delete their own properties (`auth.uid() = userId`)

- **Other Tables**:
  - Users can only view and modify their own saved properties, subscriptions, and chat sessions
  - All users can view subscription plans
  - Property views can be created by anyone but only viewed by the property owner or the user who viewed it

## Indexes

Indexes are created on frequently queried columns to improve performance, including:

- User IDs in all related tables
- Property status and type
- Foreign keys in relationship tables
