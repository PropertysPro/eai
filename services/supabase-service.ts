import supabase from '@/config/supabase';

// Export Supabase-related functions here
export const getUser = async (userId: string) => {
  try {
    console.log('[Supabase Service] Getting user with ID:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('[Supabase Service] Error getting user:', error.message);
      throw error;
    }
    
    console.log('[Supabase Service] Successfully retrieved user:', data?.email);
    return data;
  } catch (error: any) {
    console.error('[Supabase Service] Error getting user:', error.message);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: any) => {
  try {
    console.log('[Supabase Service] Updating user with ID:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) {
      console.error('[Supabase Service] Error updating user:', error.message);
      throw error;
    }
    
    console.log('[Supabase Service] Successfully updated user:', data?.[0]?.email);
    return data?.[0];
  } catch (error: any) {
    console.error('[Supabase Service] Error updating user:', error.message);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    console.log('[Supabase Service] Deleting user with ID:', userId);
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('[Supabase Service] Error deleting user:', error.message);
      throw error;
    }
    
    console.log('[Supabase Service] Successfully deleted user with ID:', userId);
    return true;
  } catch (error: any) {
    console.error('[Supabase Service] Error deleting user:', error.message);
    throw error;
  }
};

// Create tables if they don't exist
export const createTablesIfNotExist = async () => {
  try {
    console.log('[Supabase Service] Checking and creating tables if needed');
    
    // Check if profiles table exists
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError && profilesError.code === '42P01') { // Table doesn't exist
      console.log('[Supabase Service] Profiles table does not exist, attempting to create it...');
      
      // We can't use direct SQL queries with the JS client
      // Instead, we'll need to create the table using the Supabase dashboard
      // or through a migration script
      console.warn('[Supabase Service] Please create the profiles table manually or via SQL function');
    }
    
    // Check if properties table exists
    const { error: propertiesError } = await supabase
      .from('properties')
      .select('count')
      .limit(1);
    
    if (propertiesError && propertiesError.code === '42P01') { // Table doesn't exist
      console.log('[Supabase Service] Properties table does not exist, attempting to create it...');
      
      // We can't use direct SQL queries with the JS client
      // Instead, we'll need to create the table using the Supabase dashboard
      // or through a migration script
      console.warn('[Supabase Service] Please create the properties table manually or via SQL function');
    }
    
    // Check if saved_properties table exists
    const { error: savedPropertiesError } = await supabase
      .from('saved_properties')
      .select('count')
      .limit(1);
    
    if (savedPropertiesError && savedPropertiesError.code === '42P01') { // Table doesn't exist
      console.log('[Supabase Service] Saved_properties table does not exist, attempting to create it...');
      
      // We can't use direct SQL queries with the JS client
      // Instead, we'll need to create the table using the Supabase dashboard
      // or through a migration script
      console.warn('[Supabase Service] Please create the saved_properties table manually or via SQL function');
    }
    
    return true;
  } catch (error: any) {
    console.error('[Supabase Service] Error creating tables:', error.message);
    return false;
  }
};

// Create a new user profile
export const createUserProfile = async (userId: string, email: string, name?: string) => {
  try {
    console.log('[Supabase Service] Creating user profile for:', email);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { 
          id: userId,
          email,
          name: name || email.split('@')[0],
          role: 'user',
          subscription: 'free',
          message_count: 0,
          message_limit: 100,
          email_verified: true,
          onboarding_completed: false
        }
      ])
      .select();
    
    if (error) {
      console.error('[Supabase Service] Error creating user profile:', error.message);
      throw error;
    }
    
    console.log('[Supabase Service] Successfully created user profile:', data?.[0]?.email);
    return data?.[0];
  } catch (error: any) {
    console.error('[Supabase Service] Error creating user profile:', error.message);
    throw error;
  }
};