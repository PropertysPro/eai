import { supabase } from '@/config/supabase';
import { User } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { crossStorage } from './crossPlatformStorage';

  // Update user profile
export const updateProfile = async (updates: any): Promise<User> => {
  try {
    console.log('[Auth Service] Updating user profile with updates:', JSON.stringify(updates, null, 2));
    
    // First try to get user data from storage
    const storedUserData = await crossStorage.getItem('user_data');
    let userId = null;
    let userEmail = null;
    let sessionData = null;
    
    if (storedUserData) {
      try {
        const storedUser = JSON.parse(storedUserData);
        userId = storedUser.id;
        userEmail = storedUser.email;
        console.log('[Auth Service] Found user ID in storage:', userId);
      } catch (e) {
        console.error('[Auth Service] Error parsing stored user data:', e);
      }
    }
    
    // If we couldn't get the user ID from storage, try to get it from the session
    if (!userId) {
      // Ensure there is a valid Supabase session before updating profile
      let { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionResult?.session) {
        console.log('[Auth Service] No active session, attempting to refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('[Auth Service] Update profile error: No valid session available');
          throw new Error('Update profile error: Auth session missing!');
        }
        
        sessionResult = refreshData;
      }

      if (!sessionResult?.session?.user) {
        throw new Error('Update profile error: No user found in session');
      }
      
      userId = sessionResult.session.user.id;
      userEmail = sessionResult.session.user.email || '';
      sessionData = sessionResult;
    }
    
    if (!userId) {
      throw new Error('Update profile error: Could not determine user ID');
    }

    // Update user metadata in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: {
        name: updates.name
      }
    });

    if (authError) {
      console.error('[Auth Service] Update profile error:', authError.message);
      throw authError;
    }

    // Helper function to handle numeric values
    const parseNumeric = (value: any): number | null => {
      if (value === '' || value === null || value === undefined) return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    // Get current profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('[Auth Service] Error fetching current profile:', profileError.message);
      throw profileError;
    }

    // Prepare profile update data - start with basic fields that are guaranteed to exist
    let profileUpdate: any = {
      name: updates.name,
      // User Preferences
      language: updates.preferences?.language || 'en',
      dark_mode: updates.preferences?.darkMode || false,
      biometric_auth: updates.preferences?.biometricAuth || false,
      // Notification Preferences
      notification_matches: updates.preferences?.notifications?.matches ?? true,
      notification_market_updates: updates.preferences?.notifications?.marketUpdates ?? true,
      notification_new_listings: updates.preferences?.notifications?.newListings ?? true,
      notification_subscription_updates: updates.preferences?.notifications?.subscriptionUpdates ?? true,
      // Property Preferences
      property_types: updates.preferences?.propertyPreferences?.types || [],
      property_budget_min: parseNumeric(updates.preferences?.propertyPreferences?.budget?.min) || 0,
      property_budget_max: parseNumeric(updates.preferences?.propertyPreferences?.budget?.max) || 0,
      property_bedrooms: parseNumeric(updates.preferences?.propertyPreferences?.bedrooms) || 0,
      property_bathrooms: parseNumeric(updates.preferences?.propertyPreferences?.bathrooms) || 0,
      property_locations: updates.preferences?.propertyPreferences?.locations || [],
      // Additional fields
      location: updates.preferences?.location || 'Dubai, UAE',
      currency: updates.preferences?.currency || 'AED',
      is_negotiable: updates.preferences?.isNegotiable || false,
      requesting_price: parseNumeric(updates.preferences?.requestingPrice),
      // Keep existing values for these fields
      subscription: profile.subscription || 'free',
      message_count: profile.message_count || 0,
      message_limit: profile.message_limit || 50,
      role: profile.role || 'user',
      onboarding_completed: updates.onboarding_completed !== undefined ? updates.onboarding_completed : profile.onboarding_completed || false,
      email_verified: sessionData?.session?.user?.email_confirmed_at !== null || false,
      updated_at: new Date().toISOString(),
      // Realtor license fields (if user is a realtor)
      rera_license_number: updates.reraLicenseNumber || profile.rera_license_number || '',
      dld_license_number: updates.dldLicenseNumber || profile.dld_license_number || '',
      adm_license_number: updates.admLicenseNumber || profile.adm_license_number || ''
    };
    
    // Check if avatar field exists in the profile before adding it to the update
    if ('avatar' in profile || updates.avatar) {
      profileUpdate.avatar = updates.avatar;
    }
    
    // Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)
      .select()
      .single();
      
    if (updateError) {
      console.error('[Auth Service] Error updating profile:', updateError.message);
      throw updateError;
    }
    
    if (!updatedProfile) {
      throw new Error('Failed to update profile');
    }
    
    // Create user object with updated data
    const user: User = {
      id: userId,
      email: userEmail,
      name: updatedProfile.name || '',
      phone: updatedProfile.phone || '',
      avatar: updatedProfile.avatar || '',
      preferences: {
        language: updatedProfile.language || 'en',
        darkMode: updatedProfile.dark_mode || false,
        biometricAuth: updatedProfile.biometric_auth || false,
        notifications: {
          matches: updatedProfile.notification_matches ?? true,
          marketUpdates: updatedProfile.notification_market_updates ?? true,
          newListings: updatedProfile.notification_new_listings ?? true,
          subscriptionUpdates: updatedProfile.notification_subscription_updates ?? true
        },
        propertyPreferences: {
          types: updatedProfile.property_types || [],
          budget: {
            min: updatedProfile.property_budget_min || 0,
            max: updatedProfile.property_budget_max || 0
          },
          bedrooms: updatedProfile.property_bedrooms || 0,
          bathrooms: updatedProfile.property_bathrooms || 0,
          locations: updatedProfile.property_locations || []
        },
        location: updatedProfile.location || '',
        currency: updatedProfile.currency || 'AED',
        isNegotiable: updatedProfile.is_negotiable || false,
        requestingPrice: updatedProfile.requesting_price || null
      },
      subscription: updatedProfile.subscription || 'free',
      message_count: updatedProfile.message_count || 0,
      message_limit: updatedProfile.message_limit || 50,
      created_at: updatedProfile.created_at || new Date().toISOString(),
      updated_at: updatedProfile.updated_at || new Date().toISOString(),
      role: updatedProfile.role || 'user',
      onboarding_completed: updatedProfile.onboarding_completed || false,
      email_verified: sessionData?.session?.user?.email_confirmed_at !== null || false,
      // Realtor license fields
      reraLicenseNumber: updatedProfile.rera_license_number || '',
      dldLicenseNumber: updatedProfile.dld_license_number || '',
      admLicenseNumber: updatedProfile.adm_license_number || '',
    };
    
    // Update stored user data
    await crossStorage.setItem('user_data', JSON.stringify(user));

    return user;
  } catch (error: any) {
    console.error('[Auth Service] Update profile error:', error.message);
    throw error;
  }
};

// Register a new user
export const register = async (email: string, password: string, name?: string, phone?: string, roles?: string[]) => {
  try {
    console.log('[Auth Service] Registering user:', email);
    
    // Register user with Supabase Auth and send confirmation email
        const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: roles && roles.length > 0 ? roles[0] : 'user',
          onboarding_completed: false,
        },
        emailRedirectTo: 'https://gjymtvzdvyekhocqyvpa.supabase.co/auth/v1/verify?redirect_to=elmeai://auth/confirm-email'
      },
    });

    // Log the response for debugging
    console.log('[Auth Service] Registration response:', 
      data ? `User ID: ${data.user?.id}, Email confirmation status: ${data.user?.email_confirmed_at ? 'Confirmed' : 'Pending'}` : 'No data', 
      error ? `Error: ${error.message}` : 'No error'
    );
    
    if (error) {
      console.error('[Auth Service] Registration error:', error.message);
      throw error;
    }
    
    console.log('[Auth Service] User registered successfully:', data?.user?.id);
    console.log('[Auth Service] Email confirmation status:', data?.user?.email_confirmed_at ? 'Confirmed' : 'Pending confirmation');
    
    // Create user profile in the database
    if (data?.user?.id) {
      try {
        // Set email_verified to false initially - will be updated when user confirms email
        await createUserProfile(data.user.id, email, name, phone, roles); // Pass phone here
        console.log('[Auth Service] User profile created successfully');
      } catch (profileError: any) {
        console.error('[Auth Service] Error creating user profile during registration:', profileError.message);
        throw profileError; // Re-throw the error to make it visible
      }
    }
    console.log('[Auth Service] Registration data:', JSON.stringify(data, null, 2));
    console.log('[Auth Service] Registration data:', JSON.stringify(data, null, 2));
    console.log('[Auth Service] Registration data:', JSON.stringify(data, null, 2));
    console.log('[Auth Service] Registration data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error('[Auth Service] Registration error:', error.message);
    throw error;
  }
};

// Create user profile in the database
export const createUserProfile = async (userId: string, email: string, name?: string, phone?: string, roles?: string[]) => {
  try {
    console.log('[Auth Service] Creating user profile for:', email);
    
    // First check if profile already exists with a more robust approach
    let profileExists = false;
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors
      
      profileExists = !!existingProfile;
      console.log('[Auth Service] Profile exists check:', profileExists, 'for user ID:', userId);
    } catch (checkErr) {
      console.error('[Auth Service] Error checking if profile exists:', checkErr);
      // Continue with the assumption that the profile might not exist
    }
    
    // If profile exists, update it instead of inserting
    if (profileExists) {
      console.log('[Auth Service] Profile already exists, updating instead of inserting');
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            email,
            name: name || email.split('@')[0],
            role: roles && roles.length > 0 ? roles[0] : 'user',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        
        if (error) {
          console.error('[Auth Service] Error updating user profile:', error.message);
          console.error('[Auth Service] Error details:', error);
          throw error;
        }
      } catch (updateErr) {
        console.error('[Auth Service] Exception during profile update:', updateErr);
        throw updateErr;
      }
    } else {
      // Try to insert new profile with all fields matching the new table structure
      try {
        const upsertData = {
          id: userId,
          email,
          name: name || email.split('@')[0],
          role: roles && roles.length > 0 ? roles[0] : 'user',
          subscription: 'free',
          message_count: 0,
          message_limit: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_verified: false,
          onboarding_completed: false,
          language: 'en',
          dark_mode: false,
          biometric_auth: false,
          notification_matches: true,
          notification_market_updates: true,
          notification_new_listings: true,
          notification_subscription_updates: true,
          property_types: [],
          property_budget_min: 500000,
          property_budget_max: 2000000, // Added default max budget
          property_bedrooms: 0,
          property_bathrooms: 0,
          property_locations: [],
          location: 'Dubai, UAE',
          currency: 'AED',
          is_negotiable: false,
          requesting_price: null,
          phone: phone || ''
        };
        console.log('[Auth Service] Attempting to upsert profile with data:', JSON.stringify(upsertData));
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(upsertData, { onConflict: 'id' }); // Specify the conflict resolution strategy

        if (upsertError) {
          console.error('[Auth Service] Error upserting user profile:', upsertError.message, 'data:', upsertData);
          console.error('[Auth Service] Error details:', upsertError);
          throw upsertError;
        }
      } catch (insertErr) {
        console.error('[Auth Service] Exception during profile upsert:', insertErr);

        // If upsert fails, try a final update as a fallback
        try {
          const updateData = {
            email,
            name: name || email.split('@')[0],
            role: roles && roles.length > 0 ? roles[0] : 'user',
            updated_at: new Date().toISOString(),
          };
          console.log('[Auth Service] Attempting fallback update with data:', updateData);
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);

          if (updateError) {
            console.error('[Auth Service] Error in fallback update:', updateError.message, 'data:', updateData);
            throw updateError;
          }
        } catch (fallbackErr) {
          console.error('[Auth Service] Fallback update also failed:', fallbackErr);
          throw fallbackErr;
        }
      }
    }

    console.log('[Auth Service] User profile created/updated successfully');
    return true;
  } catch (error: any) {
    console.error('[Auth Service] Error creating/updating user profile:', error.message);
    throw error;
  }
};

// Login user
export const login = async (email: string, password: string): Promise<User> => {
  try {
    console.log('[Auth Service] Logging in user:', email);
    
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('[Auth Service] Login error:', error.message);
      throw error;
    }

    if (!session?.user) {
      throw new Error('No user data returned from login');
    }

    // Get user profile data
    let profile = null;
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // If no profile exists, create one
    if (profileError) {
      console.log('[Auth Service] No profile found, creating new profile');
      try {
      // Use the improved createUserProfile function that handles existing profiles
      // This will create a profile with all the required fields for the new table structure
      try {
        await createUserProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.name || session.user.email?.split('@')[0]
        );
        console.log('[Auth Service] Created new profile during login');
      } catch (createErr) {
        console.error('[Auth Service] Error creating profile during login:', createErr);
        throw new Error('Failed to create user profile during login');
      }
        
        // Fetch the newly created/updated profile
        const { data: newProfile, error: newProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (newProfileError || !newProfile) {
          throw new Error('Failed to fetch profile after creation/update');
        }
        
        profile = newProfile;
      } catch (err: any) {
        console.error('[Auth Service] Error creating/updating profile during login:', err?.message || 'Unknown error');
        // Continue with login attempt even if profile creation fails
      }
    } else {
      profile = profileData;
      console.log('[Auth Service] Profile data during login:', JSON.stringify(profile, null, 2));
    }

    if (!profile) {
      throw new Error('Failed to get or create user profile');
    }

    // Create user object with all required fields
    const user: User = {
      id: session.user.id,
      email: session.user.email || '',
      name: profile.name || '',
      phone: profile.phone || '',
      avatar: profile.avatar || '',
      preferences: {
        language: profile.language || 'en',
        darkMode: profile.dark_mode || false,
        biometricAuth: profile.biometric_auth || false,
        notifications: {
          matches: profile.notification_matches ?? true,
          marketUpdates: profile.notification_market_updates ?? true,
          newListings: profile.notification_new_listings ?? true,
          subscriptionUpdates: profile.notification_subscription_updates ?? true
        },
        propertyPreferences: {
          types: profile.property_types || [],
          budget: {
            min: profile.property_budget_min || 0,
            max: profile.property_budget_max || 0
          },
          bedrooms: profile.property_bedrooms || 0,
          bathrooms: profile.property_bathrooms || 0,
          locations: profile.property_locations || []
        },
        location: profile.location || '',
        currency: profile.currency || 'AED',
        isNegotiable: profile.is_negotiable || false,
        requestingPrice: profile.requesting_price || null
      },
      subscription: profile.subscription || 'free',
      message_count: profile.message_count || 0,
      message_limit: profile.message_limit || 50,
      created_at: session.user.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString(),
      role: profile.role || 'user',
      onboarding_completed: profile.onboarding_completed || false,
      email_verified: session.user.email_confirmed_at !== null,
      // Realtor license fields
      reraLicenseNumber: profile.rera_license_number || '',
      dldLicenseNumber: profile.dld_license_number || '',
      admLicenseNumber: profile.adm_license_number || '',
    };

    // Store user data in crossStorage
    await crossStorage.setItem('user_data', JSON.stringify(user));

    return user;
  } catch (error: any) {
    console.error('[Auth Service] Login error:', error.message);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    console.log('[Auth Service] Logging out user');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[Auth Service] Logout error:', error.message);
      throw error;
    }
    
    // Clear user data from AsyncStorage
    await crossStorage.removeItem('user_data');
    
    console.log('[Auth Service] User logged out successfully');
    return;
  } catch (error: any) {
    console.error('[Auth Service] Logout error:', error.message);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    console.log('[Auth Service] Getting current user');
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[Auth Service] Get current user error:', error.message);
      throw error;
    }
    
    if (!data?.user) {
      console.log('[Auth Service] No user found');
      return null;
    }

    // Get user profile from database
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.error('[Auth Service] Error getting user profile:', profileError.message);
      throw profileError;
    }

    if (!profileData) {
      console.error('[Auth Service] No profile found for user:', data.user.id);
      throw new Error('User profile not found');
    }

    // Create user object with proper mapping
    const user: User = {
      id: profileData.id,
      email: profileData.email || '',
      name: profileData.name || '',
      phone: profileData.phone || '',
      avatar: profileData.avatar || '',
      preferences: {
        language: profileData.language || 'en',
        darkMode: profileData.dark_mode || false,
        biometricAuth: profileData.biometric_auth || false,
        notifications: {
          matches: profileData.notification_matches ?? true,
          marketUpdates: profileData.notification_market_updates ?? true,
          newListings: profileData.notification_new_listings ?? true,
          subscriptionUpdates: profileData.notification_subscription_updates ?? true
        },
        propertyPreferences: {
          types: profileData.property_types || [],
          budget: {
            min: profileData.property_budget_min || 0,
            max: profileData.property_budget_max || 0
          },
          bedrooms: profileData.property_bedrooms || 0,
          bathrooms: profileData.property_bathrooms || 0,
          locations: profileData.property_locations || []
        },
        location: profileData.location || '',
        currency: profileData.currency || 'AED',
        isNegotiable: profileData.is_negotiable || false,
        requestingPrice: profileData.requesting_price || null
      },
      subscription: profileData.subscription || 'free',
      message_count: profileData.message_count || 0,
      message_limit: profileData.message_limit || 50,
      created_at: profileData.created_at || new Date().toISOString(),
      updated_at: profileData.updated_at || new Date().toISOString(),
      role: profileData.role || 'user',
      onboarding_completed: profileData.onboarding_completed || false,
      email_verified: data.user.email_confirmed_at !== null,
      // Realtor license fields
      reraLicenseNumber: profileData.rera_license_number || '',
      dldLicenseNumber: profileData.dld_license_number || '',
      admLicenseNumber: profileData.adm_license_number || '',
    };

    // Store user data in AsyncStorage
    await crossStorage.setItem('user_data', JSON.stringify(user));
    return user;
  } catch (error: any) {
    console.error('[Auth Service] Get current user error:', error.message);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    console.log('[Auth Service] Sending password reset email to:', email);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://gjymtvzdvyekhocqyvpa.supabase.co/auth/v1/verify?redirect_to=elmeai://auth/reset-password',
    });
    
    if (error) {
      console.error('[Auth Service] Password reset error:', error.message);
      throw error;
    }
    
    console.log('[Auth Service] Password reset email sent successfully');
    return data;
  } catch (error: any) {
    console.error('[Auth Service] Password reset error:', error.message);
    throw error;
  }
};

// Update user
export const updateUser = async (updates: any) => {
  try {
    console.log('[Auth Service] Updating user');
    // Ensure there is a valid Supabase session before updating user
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('[Auth Service] Update user error: No Supabase session available');
      throw new Error('Update user error: Auth session missing!');
    }
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) {
      console.error('[Auth Service] Update user error:', error.message);
      throw error;
    }
    console.log('[Auth Service] User updated successfully:', data?.user?.id);
    return data?.user;
  } catch (error: any) {
    console.error('[Auth Service] Update user error:', error.message);
    throw error;
  }
};

import { v4 as uuidv4 } from 'uuid';

// Facebook login
import { getUser, createUserProfile as createUserProfileFromSupabase } from './supabase-service';



// Login with Google
export const loginWithGoogle = async (): Promise<string> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://gjymtvzdvyekhocqyvpa.supabase.co/auth/v1/callback?redirect_to=elmeai://auth/callback',
      },
    });

    if (error) {
      console.error('[Auth Service] Google login error:', error.message);
      throw error;
    }

    if (!data?.url) {
      throw new Error('No URL returned from Google login');
    }

    return data.url;
  } catch (error: any) {
    console.error('[Auth Service] Google login error:', error.message);
    throw error;
  }
};

// Login with Apple
export const loginWithApple = async (): Promise<string> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'https://gjymtvzdvyekhocqyvpa.supabase.co/auth/v1/callback?redirect_to=elmeai://auth/callback',
      },
    });

    if (error) {
      console.error('[Auth Service] Apple login error:', error.message);
      throw error;
    }

    if (!data?.url) {
      throw new Error('No URL returned from Apple login');
    }

    return data.url;
  } catch (error: any) {
    console.error('[Auth Service] Apple login error:', error.message);
    throw error;
  }
};


/**
 * Register a new user using Facebook OAuth.
 * This will authenticate, create a profile if needed, and persist the user profile.
 * Use this in registration flows for 'Sign up with Facebook'.
 */
export const registerWithFacebook = async (): Promise<User> => {
  return loginWithFacebook();
};

export const loginWithFacebook = async (): Promise<User> => {
  try {
    console.log('[Auth Service] Attempting Facebook login');
    const { data, error } = await supabase.auth.signInWithOAuth({ 
      provider: 'facebook',
      options: {
        redirectTo: 'https://gjymtvzdvyekhocqyvpa.supabase.co/auth/v1/callback?redirect_to=elmeai://auth/callback',
      }
    });
    if (error) {
      console.error('[Auth Service] Facebook login error:', error.message);
      throw error;
    }
    // After OAuth, get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('[Auth Service][DEBUG] userData after OAuth:', JSON.stringify(userData));
    if (userError || !userData?.user) {
      throw new Error('Failed to get user after Facebook login');
    }
    // Try to fetch profile from DB
    let profile = null;
    try {
      profile = await getUser(userData.user.id);
      console.log('[Auth Service][DEBUG] Profile fetched from DB:', JSON.stringify(profile));
      } catch (err: any) {
        console.log('[Auth Service][DEBUG] No profile found, will create profile. Error:', err?.message || 'Unknown error');
        // ignore fetch error, will create profile below
      }
    if (!profile) {
      const name = typeof userData.user.user_metadata?.name === 'string' && userData.user.user_metadata?.name.trim() !== ''
        ? userData.user.user_metadata.name
        : (userData.user.email || '');
      
      // Use our improved createUserProfile function with the new table structure
      try {
        await createUserProfile(
          userData.user.id,
          userData.user.email || '',
          name
        );
        console.log('[Auth Service] Created new profile for Facebook user with updated table structure');
        
        // Fetch the newly created/updated profile
        const { data: newProfile, error: newProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
          
        if (newProfileError || !newProfile) {
          throw new Error('Failed to fetch profile after Facebook login');
        }
        
        profile = newProfile;
        console.log('[Auth Service][DEBUG] Created/updated profile for Facebook user:', JSON.stringify(profile));
      } catch (err: any) {
        console.error('[Auth Service][DEBUG] Failed to create/update profile for Facebook user:', err?.message);
        throw new Error('Failed to create/update user profile for Facebook user');
      }
    }
    // Call getCurrentUser to ensure user_data is set in AsyncStorage as expected by onboarding
    // Debug: Check what is in crossStorage after Facebook login
    const debugStoredUser = await crossStorage.getItem('user_data');
    console.log('[Auth Service][DEBUG] user_data after Facebook login:', debugStoredUser);
    const currentUser = await getCurrentUser();
    console.log('[Auth Service][DEBUG] currentUser from getCurrentUser:', JSON.stringify(currentUser));
    // Fallback: if getCurrentUser returns null, use the profile we just fetched/created
    return currentUser ?? profile;
  } catch (error: any) {
    console.error('[Auth Service] Facebook login error:', error.message);
    throw error;
  }
};

// Social login using Supabase OAuth
export const socialLogin = async (provider: 'google' | 'apple'): Promise<User> => {
  try {
    console.log(`[Auth Service] Attempting ${provider} login`);
    const { data, error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: 'https://gjymtvzdvyekhocqyvpa.supabase.co/auth/v1/callback?redirect_to=elmeai://auth/callback',
      }
    });
    if (error) {
      console.error(`[Auth Service] ${provider} login error:`, error.message);
      throw error;
    }
    
    // After OAuth, get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error(`[Auth Service] ${provider} login failed: No user returned after OAuth`);
    }
    
    // Try to fetch profile from DB
    let profile = null;
    try {
      // Get user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      
      if (profileError) {
        console.log(`[Auth Service] No profile found for ${provider} user, creating new profile`);
        throw profileError; // This will be caught by the catch block below
      }
      
      profile = profileData;
    } catch (err: any) {
      console.log(`[Auth Service] Error fetching profile for ${provider} user:`, err?.message || 'Unknown error');
      
      // Create profile if it doesn't exist
      const name = typeof userData.user.user_metadata?.name === 'string' && userData.user.user_metadata?.name.trim() !== ''
        ? userData.user.user_metadata.name
        : (userData.user.email || '');
      
      try {
        // Use our improved createUserProfile function with the new table structure
        await createUserProfile(
          userData.user.id,
          userData.user.email || '',
          name
        );
        console.log(`[Auth Service] Created new profile for Facebook user with updated table structure`);
        
        // Fetch the newly created/updated profile
        const { data: newProfile, error: newProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
          
        if (newProfileError || !newProfile) {
          throw new Error(`Failed to fetch profile after ${provider} login`);
        }
        
        profile = newProfile;
        console.log(`[Auth Service] Created/updated profile for Facebook user:`, JSON.stringify(profile));
      } catch (createErr: any) {
        console.error(`[Auth Service] Failed to create/update profile for Facebook user:`, createErr?.message);
        throw new Error(`Failed to create/update user profile for Facebook user`);
      }
    }
    
    // Call getCurrentUser to ensure user_data is set in AsyncStorage as expected by onboarding
    const currentUser = await getCurrentUser();

    // Fallback: if getCurrentUser returns null, use the profile
    return currentUser ?? profile;
  } catch (error: any) {
    console.error(`[Auth Service] Social login error:`, error.message);
    throw error;
  }
};

// Function to check message limits
export const checkMessageLimits = async (): Promise<{ canSend: boolean; remaining: number; limit: number }> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.warn('No active user session found');
      return { canSend: false, remaining: 0, limit: 0 };
    }
    
    const userId = sessionData.session.user.id;
    
    // Fetch user profile with message limits
    const { data, error } = await supabase
      .from('profiles')
      .select('message_count, message_limit')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching message limits:', error.message);
      return { canSend: false, remaining: 0, limit: 0 };
    }

    if (!data) {
      console.warn('No profile data found for user:', userId);
      return { canSend: false, remaining: 0, limit: 0 };
    }

    const { message_count, message_limit } = data;
    const remaining = message_limit - message_count;
    
    return { 
      canSend: message_count < message_limit, 
      remaining, 
      limit: message_limit 
    };
  } catch (error: any) {
    console.error('Error checking message limits:', error.message);
    return { canSend: false, remaining: 0, limit: 0 };
  }
};

// Function to update message usage
export const updateMessageUsage = async (): Promise<number> => {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.warn('No active user session found');
      return 0;
    }
    
    const userId = sessionData.session.user.id;
    
    // First get the current message count
    const { data: currentData, error: fetchError } = await supabase
      .from('profiles')
      .select('message_count')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching current message count:', fetchError.message);
      return 0;
    }
    
    const newCount = (currentData?.message_count || 0) + 1;
    
    // Update message count
    const { data, error } = await supabase
      .from('profiles')
      .update({ message_count: newCount })
      .eq('id', userId)
      .select('message_count')
      .single();

    if (error) {
      console.error('Error updating message usage:', error.message);
      return 0;
    }

    // Return the updated message count
    return data?.message_count || 0;
  } catch (error: any) {
    console.error('Error updating message usage:', error.message);
    return 0;
  }
}

// Function to resend verification email
export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('[Auth Service] Resending verification email to:', email);
    
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: 'https://gjymtvzdvyekhocqyvpa.supabase.co/auth/v1/verify?redirect_to=elmeai://auth/confirm-email',
      }
    });
    
    if (error) {
      console.error('[Auth Service] Error resending verification email:', error.message);
      return { 
        success: false, 
        message: error.message || 'Failed to resend verification email. Please try again later.' 
      };
    }
    
    console.log('[Auth Service] Verification email resent successfully');
    return { 
      success: true, 
      message: 'Verification email has been sent. Please check your inbox.' 
    };
  } catch (error: any) {
    console.error('[Auth Service] Error resending verification email:', error.message);
    return { 
      success: false, 
      message: error.message || 'An unexpected error occurred. Please try again later.' 
    };
  }
};

// Function to upload profile picture
export const uploadProfilePicture = async (userId: string, uri: string): Promise<string | null> => {
  try {
    console.log('[Auth Service] Uploading profile picture for user:', userId);
    
    // Generate a unique file name
    const fileExt = uri.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Convert URI to Blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true
      });
    
    if (error) {
      console.error('[Auth Service] Error uploading profile picture:', error.message);
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    
    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar: publicUrl })
      .eq('id', userId);
    
    if (updateError) {
      console.error('[Auth Service] Error updating profile with avatar URL:', updateError.message);
      throw updateError;
    }
    
    console.log('[Auth Service] Profile picture uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('[Auth Service] Error in uploadProfilePicture:', error.message);
    throw error;
  }
};
