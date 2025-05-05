# Marketplace Duration Feature

This migration adds support for specifying the duration of marketplace listings.

## Changes

1. Added a new `marketplace_duration` column to the `properties` table to store the duration in days for which a property is listed in the marketplace.
2. Updated the `list_property_in_marketplace` function to accept a duration parameter.

## Frontend Changes

The following frontend files have been updated to support this feature:

1. `app/add-edit-property.tsx` - Added marketplace duration dropdown when listing a property in the marketplace.
2. `app/marketplace-listing.tsx` - Added duration selection when listing a property in the marketplace.
3. `services/marketplace-service.ts` - Updated the `listPropertyInMarketplace` function to include the duration parameter.
4. `types/property.ts` - Added `marketplaceDuration` field to the Property and PropertyFormData interfaces.

## How It Works

1. When a user adds a new property, they can choose to list it in the marketplace and specify a duration.
2. When a user lists an existing property in the marketplace, they can specify a duration.
3. The duration is stored in the database and can be used to automatically expire listings after the specified period.

## Default Values

If no duration is specified, the default duration is 30 days.

## Available Duration Options

The following duration options are available:
- 7 days
- 14 days
- 30 days
- 60 days
- 90 days

## Future Enhancements

1. Add a scheduled job to automatically expire listings after the specified duration.
2. Add the ability to extend the duration of an existing listing.
3. Add notifications to alert users when their listings are about to expire.
