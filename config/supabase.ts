import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';

// Get Supabase credentials from environment variables
const supabaseUrl = 'https://gjymtvzdvyekhocqyvpa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeW10dnpkdnlla2hvY3F5dnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTU3NDUsImV4cCI6MjA2MTI3MTc0NX0.ts-OO-Djf5go35GqoFzAKvxjdZbIJQQegPJkkqgLeOY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration.');
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'elme-ai',
      'Content-Type': 'application/json',
    },
  },
});

// Log connection status
console.log(`[Supabase] Initialized with URL: ${supabaseUrl}`);
console.log(`[Supabase] Anon Key available: ${supabaseAnonKey ? 'Yes' : 'No'}`);

// Initialize database
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('[Supabase] Initializing database...');
    
    // Check if we have credentials
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[Supabase] Missing credentials, using mock data');
      return false;
    }
    
    // Try to connect to Supabase
    try {
      // First check if we can connect to Supabase at all
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('[Supabase] Error connecting to auth service:', authError.message);
        return false;
      }
      
      console.log('[Supabase] Successfully connected to auth service');
      
      // Log the session for debugging
      if (authData?.session) {
        console.log('[Supabase] Active session found for user:', authData.session.user.id);
      } else {
        console.log('[Supabase] No active session found');
      }
      
      // Check if profiles table exists
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (profilesError) {
          console.error('[Supabase] Error accessing profiles table:', profilesError.message);
          console.log('[Supabase] profiles table may not exist. Please create it with the following schema:');
          console.log('- id: uuid (primary key)');
          console.log('- email: text');
          console.log('- name: text');
          console.log('- phone: text');
          console.log('- role: text (user, admin)');
          console.log('- subscription: text (free, premium, enterprise)');
          console.log('- message_count: integer');
          console.log('- message_limit: integer');
          console.log('- created_at: timestamp');
          console.log('- updated_at: timestamp');
          console.log('- email_verified: boolean');
          console.log('- onboarding_completed: boolean');
          console.log('- preferences: jsonb {');
          console.log('    language: text,');
          console.log('    location: text,');
          console.log('    currency: text,');
          console.log('    darkMode: boolean,');
          console.log('    isNegotiable: boolean,');
          console.log('    requestingPrice: text,');
          console.log('    notifications: {');
          console.log('      matches: boolean,');
          console.log('      marketUpdates: boolean,');
          console.log('      newListings: boolean,');
          console.log('      subscriptionUpdates: boolean');
          console.log('    },');
          console.log('    propertyPreferences: {');
          console.log('      types: text[],');
          console.log('      budget: {');
          console.log('        min: numeric,');
          console.log('        max: numeric');
          console.log('      },');
          console.log('      bedrooms: integer,');
          console.log('      bathrooms: integer,');
          console.log('      locations: text[]');
          console.log('    }');
          console.log('  }');
        } else {
          console.log('[Supabase] Successfully connected to profiles table');
        }
      } catch (e) {
        console.error('[Supabase] Error checking profiles table:', e);
      }
      
      // Check if chat_sessions table exists
      try {
        const { data: chatSessionsData, error: chatSessionsError } = await supabase
          .from('chat_sessions')
          .select('count')
          .limit(1);
        
        if (chatSessionsError) {
          console.error('[Supabase] Error accessing chat_sessions table:', chatSessionsError.message);
          console.log('[Supabase] chat_sessions table may not exist. Please create it with the following schema:');
          console.log('- id: text (primary key)');
          console.log('- user_id: uuid (foreign key to profiles.id)');
          console.log('- title: text');
          console.log('- created_at: timestamp');
          console.log('- updated_at: timestamp');
          console.log('- message_count: integer');
          console.log('- last_message: text');
        } else {
          console.log('[Supabase] Successfully connected to chat_sessions table');
        }
      } catch (e) {
        console.error('[Supabase] Error checking chat_sessions table:', e);
      }
      
      // Check if chat_messages table exists
      try {
        const { data: chatMessagesData, error: chatMessagesError } = await supabase
          .from('chat_messages')
          .select('count')
          .limit(1);
        
        if (chatMessagesError) {
          console.error('[Supabase] Error accessing chat_messages table:', chatMessagesError.message);
          console.log('[Supabase] chat_messages table may not exist. Please create it with the following schema:');
          console.log('- id: text (primary key)');
          console.log('- session_id: text (foreign key to chat_sessions.id)');
          console.log('- user_id: uuid (foreign key to profiles.id)');
          console.log('- content: text');
          console.log('- role: text (user, assistant)');
          console.log('- created_at: timestamp');
        } else {
          console.log('[Supabase] Successfully connected to chat_messages table');
        }
      } catch (e) {
        console.error('[Supabase] Error checking chat_messages table:', e);
      }
      
      // Check if notifications table exists
      try {
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('count')
          .limit(1);
        
        if (notificationsError) {
          console.error('[Supabase] Error accessing notifications table:', notificationsError.message);
          console.log('[Supabase] notifications table may not exist. Please create it with the following schema:');
          console.log('- id: text (primary key)');
          console.log('- userId: uuid (foreign key to profiles.id)');
          console.log('- type: text (property, message, system, alert)');
          console.log('- title: text');
          console.log('- message: text');
          console.log('- read: boolean');
          console.log('- data: jsonb (optional)');
          console.log('- createdAt: timestamp');
        } else {
          console.log('[Supabase] Successfully connected to notifications table');
        }
      } catch (e) {
        console.error('[Supabase] Error checking notifications table:', e);
      }
      
      // Check if properties table exists
      try {
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('count')
          .limit(1);
        
        if (propertiesError) {
          console.error('[Supabase] Error accessing properties table:', propertiesError.message);
          console.log('[Supabase] properties table may not exist. Please create it with the following schema:');
          console.log('- id: uuid (primary key)');
          console.log('- title: text');
          console.log('- description: text');
          console.log('- price: numeric');
          console.log('- location: text');
          console.log('- type: text');
          console.log('- bedrooms: integer');
          console.log('- bathrooms: integer');
          console.log('- area: numeric');
          console.log('- images: text[]');
          console.log('- isDistressed: boolean');
          console.log('- createdAt: timestamp');
          console.log('- updatedAt: timestamp');
        } else {
          console.log('[Supabase] Successfully connected to properties table');
        }
      } catch (e) {
        console.error('[Supabase] Error checking properties table:', e);
      }
      
      console.log('[Supabase] Database initialization completed');
      return true;
    } catch (error: any) {
      console.error('[Supabase] Error connecting to database:', error.message);
      return false;
    }
  } catch (error: any) {
    console.error('[Supabase] Error initializing database:', error.message);
    return false;
  }
};

// Create required tables if they don't exist
export const createRequiredTables = async (): Promise<boolean> => {
  try {
    console.log('[Supabase] Checking and creating required tables...');
    
    // We can't create tables directly with the JS client
    // This function is a placeholder to remind users to create tables manually
    
    console.log('[Supabase] Please create the following tables in your Supabase dashboard:');
    console.log('1. profiles: id, email, name, role, subscription, message_count, message_limit, created_at, updated_at, email_verified, onboarding_completed');
    console.log('2. chat_sessions: id, user_id, title, created_at, updated_at, message_count, last_message');
    console.log('3. chat_messages: id, session_id, user_id, content, role, created_at');
    console.log('4. notifications: id, userId, type, title, message, read, data, createdAt');
    
    return true;
  } catch (error: any) {
    console.error('[Supabase] Error creating tables:', error.message);
    return false;
  }
};