import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gjymtvzdveekhocqyvpa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeW10dnpkdnlla2hvY3F5dnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTU3NDUsImV4cCI6MjA2MTI3MTc0NX0.ts-OO-Djf5go35GqoFzAKvxjdZbIJQQegPJkkqgLeOY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 