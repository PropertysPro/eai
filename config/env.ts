// Environment variables
// In a real app, these would be loaded from .env files or environment variables

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com';

// Feature flags
export const ENABLE_ANALYTICS = process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true';
export const ENABLE_CRASH_REPORTING = process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true';

// App configuration
export const APP_VERSION = '1.0.0';
export const BUILD_NUMBER = '1';
export const IS_DEVELOPMENT = __DEV__;

// API keys for third-party services
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Default settings
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_THEME = 'light';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr', 'es', 'hi'];

// Supported currencies
export const SUPPORTED_CURRENCIES = ['USD', 'AED'];

// Timeouts
export const API_TIMEOUT = 10000; // 10 seconds
export const CACHE_EXPIRY = 3600; // 1 hour in seconds
