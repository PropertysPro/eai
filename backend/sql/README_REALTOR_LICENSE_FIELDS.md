# Realtor License Fields Migration

This migration adds three optional license number fields to the `profiles` table for realtor users:

1. `rera_license_number` - RERA license number
2. `dld_license_number` - DLD license number
3. `adm_license_number` - ADM license number

These fields are specifically for users with the role 'realtor' and are optional to fill out.

## Purpose

This migration supports the feature that allows realtor users to add their license numbers to their profile. These license numbers are important credentials for real estate professionals in the UAE:

- RERA (Real Estate Regulatory Agency) license is required for real estate brokers in Dubai
- DLD (Dubai Land Department) license is another important credential for real estate professionals
- ADM (Abu Dhabi Municipality) license is required for real estate professionals operating in Abu Dhabi

## How to Apply

To apply this migration to your Supabase database:

1. Go to the Supabase dashboard for your project
2. Navigate to the SQL Editor
3. Copy the contents of `migration_add_realtor_license_fields.sql`
4. Paste into the SQL Editor and run the query

Alternatively, you can use the Supabase CLI:

```bash
supabase db push --db-url <your-db-url> migration_add_realtor_license_fields.sql
```

## Frontend Changes

The frontend has been updated to:

1. Display these fields only for users with the role 'realtor'
2. Make these fields optional
3. Save the values to the database when the user updates their profile

## Verification

After applying the migration, you can verify it was successful by:

1. Checking the `profiles` table schema to confirm the new columns exist
2. Testing the profile update functionality with a realtor user account
