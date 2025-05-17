import { supabase } from '@/config/supabase';

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

export const createOrGetChatSession = async (userId1: string, userId2: string) => {
  try {
    console.log(`[Supabase Service] Creating or getting chat session between ${userId1} and ${userId2}`);

    // Ensure user IDs are in the correct order to prevent duplicate sessions
    const sortedUserIds = [userId1, userId2].sort();
    const chatId = `${sortedUserIds[0]}-${sortedUserIds[1]}`;

    // Check if a chat session already exists
    const { data: existingSession, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', chatId)
      .single();

    if (sessionError && sessionError.code !== '404') {
      console.error('[Supabase Service] Error checking for existing chat session:', sessionError.message);
      throw sessionError;
    }

    if (existingSession) {
      console.log('[Supabase Service] Chat session already exists:', existingSession);
      return existingSession;
    }

    // Create a new chat session
    const { data: newSession, error: newSessionError } = await supabase
      .from('chat_sessions')
      .insert([{ id: chatId, user_id1: userId1, user_id2: userId2 }])
      .select()
      .single();

    if (newSessionError) {
      console.error('[Supabase Service] Error creating new chat session:', newSessionError.message);
      throw newSessionError;
    }

    console.log('[Supabase Service] Created new chat session:', newSession);
    return newSession;
  } catch (error: any) {
    console.error('[Supabase Service] Error creating or getting chat session:', error.message);
    throw error;
  }
};

export const getUsersWithChatSessions = async () => {
  try {
    console.log('[Supabase Service] Getting users with chat sessions');

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('user_id')
      .order('user_id', { ascending: true })
      .throwOnError();

    if (error) {
      console.error('[Supabase Service] Error getting users with chat sessions:', error);
      throw error;
    }

    const distinctUserIds = data ? [...new Set(data.map(item => item.user_id))] : [];

    console.log('[Supabase Service] Successfully retrieved users with chat sessions');
    return distinctUserIds;
  } catch (error: any) {
    console.error('[Supabase Service] Error getting users with chat sessions:', error.message);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    console.log('[Supabase Service] Getting user profile with ID:', userId);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Supabase Service] Error getting user profile:', error.message);
      throw error;
    }

    console.log('[Supabase Service] Successfully retrieved user profile:', data);
    return data;
  } catch (error: any) {
    console.error('[Supabase Service] Error getting user profile:', error.message);
    throw error;
  }
};

export const getAllChatMessages = async () => {
  try {
    console.log('[Supabase Service] Getting all chat messages for admin');

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Service] Error getting all chat messages:', error.message);
      throw error;
    }

    console.log('[Supabase Service] Successfully retrieved all chat messages');
    return data;
  } catch (error: any) {
    console.error('[Supabase Service] Error getting all chat messages:', error.message);
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

export const deleteChatMessage = async (messageId: string) => {
  try {
    console.log('[Supabase Service] Deleting chat message with ID:', messageId);

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('[Supabase Service] Error deleting chat message:', error.message);
      throw error;
    }

    console.log('[Supabase Service] Successfully deleted chat message with ID:', messageId);
    return true;
  } catch (error: any) {
    console.error('[Supabase Service] Error deleting chat message:', error.message);
    throw error;
  }
};

export const getAllProperties = async () => {
  console.log('[Supabase Service] getAllProperties called');
  try {
    console.log('[Supabase Service] Getting all properties');

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Service] Error getting all properties:', error.message);
      throw error;
    }

    console.log('[Supabase Service] Successfully retrieved all properties', data);
    return data;
  } catch (error: any) {
    console.error('[Supabase Service] Error getting all properties:', error.message);
    throw error;
  }
};

export const getRealtorProfiles = async (isSubscribed?: boolean, sortBy?: string) => {
  try {
    console.log('[Supabase Service] Getting realtor profiles');

    let query = supabase
      .from('realtors')
      .select(`
        user_id,
        is_subscribed
      `);

    if (isSubscribed !== undefined) {
      query = query.eq('is_subscribed', isSubscribed);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Supabase Service] Error getting realtor profiles:', error.message);
      throw error;
    }

    console.log('[Supabase Service] Successfully retrieved realtor profiles', data);
    return data;
  } catch (error: any) {
    console.error('[Supabase Service] Error getting realtor profiles:', error.message);
    throw error;
  }
};
