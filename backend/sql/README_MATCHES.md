# Creating Matches and Favorites Tables in Supabase

This document explains how to create the necessary tables for property matches and favorites functionality in your Supabase database.

## Background

The application requires two tables that are currently missing:

1. `matches` - Stores property matches for users based on their preferences
2. `favorites` - Stores properties that users have saved as favorites

The absence of these tables is causing errors in the application, specifically in the discover matched properties page where properties and filters appear for 2 seconds and then disappear.

## Instructions

Follow these steps to create the required tables in your Supabase database:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the `matches_tables.sql` file
5. Run the query

### Important Notes

- The script creates both the `matches` and `favorites` tables
- It sets up Row Level Security (RLS) policies to ensure data privacy
- It includes optional sample data insertion (you can remove these lines if not needed)
- The script uses `IF NOT EXISTS` so it's safe to run multiple times

## Table Structure

### Matches Table

```sql
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  match_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);
```

### Favorites Table

```sql
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);
```

## Verification

After running the script, you can verify the tables were created by:

1. Going to the "Table Editor" in your Supabase dashboard
2. Checking that both `matches` and `favorites` tables appear in the list
3. Clicking on each table to verify the structure

## Troubleshooting

If you encounter any errors:

- Make sure the `properties` table exists before running this script
- Check that the `auth.users` table is accessible
- Verify you have the necessary permissions to create tables and policies
