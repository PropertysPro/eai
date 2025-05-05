# Roles Column Migration

## Issue

The profiles table in Supabase has two columns for user roles:
- `role` (TEXT): A single role value (legacy)
- `roles` (TEXT[]): An array of role values (new)

This dual-column approach was causing confusion and potential inconsistencies in the application.

## Migration Plan

We've created a three-phase migration process to address this issue:

### Phase 1: Synchronization (migration_fix_roles_column.sql)

This migration:
1. Ensures all data from `role` is properly migrated to `roles`
2. Creates a trigger to keep `role` and `roles` in sync during the transition period
   - When `roles` is updated, `role` is set to the first element of `roles`
   - When `role` is updated, it's added to the `roles` array if not already present

This allows the application to continue functioning while we update the code to use only the `roles` column.

### Phase 2: Code Updates

Update all application code to:
1. Only write to the `roles` column
2. Read from the `roles` column instead of `role` when possible
3. Only fall back to `role` for backward compatibility with older data

### Phase 3: Column Removal (migration_drop_role_column.sql)

After all code has been updated and deployed, this migration:
1. Drops the trigger that keeps `role` and `roles` in sync
2. Drops the `role` column from the profiles table

## Implementation Steps

1. Apply the `migration_fix_roles_column.sql` migration
2. Update application code to use `roles` instead of `role`
3. Test thoroughly to ensure all functionality works with the `roles` column
4. Apply the `migration_drop_role_column.sql` migration

## Backward Compatibility

During the transition period (after Phase 1 but before Phase 3), both columns will be kept in sync by the database trigger. This ensures that any code still using the `role` column will continue to work correctly.

After Phase 3, all code must use the `roles` column, as the `role` column will no longer exist.
