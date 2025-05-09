import { supabase } from '@/config/supabase';
import { User } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { crossStorage } from './crossPlatformStorage';

  // Update user profile
export const updateProfile = async (updates: any): Promise<User> => {
  try {
    console.log('[Auth Service] Updating user profile with updates:', JSON.stringify(updates, null, 2));
    
    let { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionResult?.session) {
      console.log('[Auth Service] No active session, attempting to refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        console.error('[Auth Service] Update profile error: No valid session available while trying to refresh.');
        throw new Error('Update profile error: Auth session missing or could not be refreshed!');
      }
      sessionResult = refreshData;
    }

    if (!sessionResult?.session?.user) {
      throw new Error('Update profile error: No user found in active session');
    }
    
    const userId = sessionResult.session.user.id;
    const userEmail = sessionResult.session.user.email || '';
    const sessionData = sessionResult; 

    // Update user metadata in Supabase Auth (e.g., name if it's part of Supabase auth user_metadata)
    if (updates.name) {
      const { error: authUserUpdateError } = await supabase.auth.updateUser({
        data: { name: updates.name }
      });
      if (authUserUpdateError) {
        console.error('[Auth Service] Error updating user metadata in Supabase Auth:', authUserUpdateError.message);
        // Decide if this is a fatal error or if profile update can continue
      }
    }

    const parseNumeric = (value: any): number | null => {
      if (value === '' || value === null || value === undefined) return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    let { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); 
      
    if (fetchError) {
      console.error('[Auth Service] Database error while fetching initial profile:', fetchError.message);
      throw fetchError;
    }

    if (!profile) {
      console.log(`[Auth Service] Profile not found for user ID: ${userId}. Creating new profile.`);
      try {
        // Pass all relevant fields from 'updates' that createUserProfile might use
        const newlyCreatedProfile = await createUserProfile(
          userId, 
          userEmail, 
          updates.name, 
          updates.phone, 
          updates.role ? [updates.role] : undefined, 
          updates.country
        );
        if (!newlyCreatedProfile) {
          throw new Error(`[Auth Service] Failed to create or retrieve profile for user ID ${userId}.`);
        }
        profile = newlyCreatedProfile;
      } catch (creationError: any) {
        console.error(`[Auth Service] Error during profile creation for user ID ${userId}:`, creationError.message);
        throw creationError;
      }
    }

    // Prepare profile update data for the 'profiles' table
    let profileUpdate: any = {
      language: updates.preferences?.language !== undefined ? updates.preferences.language : profile.language,
      dark_mode: updates.preferences?.darkMode !== undefined ? updates.preferences.darkMode : profile.dark_mode,
      biometric_auth: updates.preferences?.biometricAuth !== undefined ? updates.preferences.biometricAuth : profile.biometric_auth,
      notification_matches: updates.preferences?.notifications?.matches !== undefined ? updates.preferences.notifications.matches : profile.notification_matches,
      notification_market_updates: updates.preferences?.notifications?.marketUpdates !== undefined ? updates.preferences.notifications.marketUpdates : profile.notification_market_updates,
      notification_new_listings: updates.preferences?.notifications?.newListings !== undefined ? updates.preferences.notifications.newListings : profile.notification_new_listings,
      notification_subscription_updates: updates.preferences?.notifications?.subscriptionUpdates !== undefined ? updates.preferences.notifications.subscriptionUpdates : profile.notification_subscription_updates,
      property_types: updates.preferences?.propertyPreferences?.types !== undefined ? updates.preferences.propertyPreferences.types : profile.property_types,
      property_budget_min: parseNumeric(updates.preferences?.propertyPreferences?.budget?.min) ?? profile.property_budget_min,
      property_budget_max: parseNumeric(updates.preferences?.propertyPreferences?.budget?.max) ?? profile.property_budget_max,
      property_bedrooms: parseNumeric(updates.preferences?.propertyPreferences?.bedrooms) ?? profile.property_bedrooms,
      property_bathrooms: parseNumeric(updates.preferences?.propertyPreferences?.bathrooms) ?? profile.property_bathrooms,
      property_locations: updates.preferences?.propertyPreferences?.locations !== undefined ? updates.preferences.propertyPreferences.locations : profile.property_locations,
      location: updates.preferences?.location !== undefined ? updates.preferences.location : profile.location,
      currency: updates.preferences?.currency !== undefined ? updates.preferences.currency : profile.currency,
      is_negotiable: updates.preferences?.isNegotiable !== undefined ? updates.preferences.isNegotiable : profile.is_negotiable,
      requesting_price: parseNumeric(updates.preferences?.requestingPrice) ?? profile.requesting_price,
      
      message_count: profile.message_count, 
      message_limit: profile.message_limit, 
      role: updates.role !== undefined ? updates.role : profile.role,
      onboarding_completed: updates.onboarding_completed !== undefined ? updates.onboarding_completed : profile.onboarding_completed,
      email_verified: sessionData?.session?.user?.email_confirmed_at !== null || profile.email_verified,
      updated_at: new Date().toISOString(),
      
      rera_license_number: updates.reraLicenseNumber !== undefined ? updates.reraLicenseNumber : profile.rera_license_number,
      dld_license_number: updates.dldLicenseNumber !== undefined ? updates.dldLicenseNumber : profile.dld_license_number,
      adm_license_number: updates.admLicenseNumber !== undefined ? updates.admLicenseNumber : profile.adm_license_number,
      
      city: updates.city !== undefined ? updates.city : profile.city,
      experience_years: updates.experienceYears !== undefined ? parseNumeric(updates.experienceYears) : profile.experience_years,
      specialties: updates.specialties !== undefined ? updates.specialties : profile.specialties,
      languages_spoken: updates.languagesSpoken !== undefined ? updates.languagesSpoken : profile.languages_spoken,
      bio: updates.bio !== undefined ? updates.bio : profile.bio,
      properties_market_status: updates.properties_market_status !== undefined ? updates.properties_market_status : profile.properties_market_status,
      
      phone: updates.phone !== undefined ? updates.phone : profile.phone,
      country: updates.country !== undefined ? updates.country : profile.country,
      subscription: updates.subscription !== undefined ? updates.subscription : profile.subscription,
    };
    
    if (updates.name !== undefined) {
        profileUpdate.name = updates.name;
    } else if (profile.name) {
        profileUpdate.name = profile.name;
    }

    if (updates.avatar !== undefined) {
      profileUpdate.avatar = updates.avatar;
    } else if (profile.avatar) {
      profileUpdate.avatar = profile.avatar;
    }
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)
      .select()
      .single(); 
      
    if (updateError) {
      console.error('[Auth Service] Database error while updating profile:', updateError.message);
      throw updateError;
    }
    
    if (!updatedProfile) {
      const errorMessage = `Failed to retrieve profile after update for user ID: ${userId}.`;
      console.error(`[Auth Service] ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    const user: User = {
      id: userId,
      email: userEmail,
      name: updatedProfile.name || '',
      phone: updatedProfile.phone || '',
      avatar: updatedProfile.avatar || '',
      country: updatedProfile.country || '',
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
      reraLicenseNumber: updatedProfile.rera_license_number || '',
      dldLicenseNumber: updatedProfile.dld_license_number || '',
      admLicenseNumber: updatedProfile.adm_license_number || '',
      city: updatedProfile.city || '',
      experienceYears: updatedProfile.experience_years === null ? undefined : updatedProfile.experience_years,
      specialties: updatedProfile.specialties || [],
      languagesSpoken: updatedProfile.languages_spoken || [],
      bio: updatedProfile.bio || '',
      properties_market_status: updatedProfile.properties_market_status || 'not_requested',
    };
    
    await crossStorage.setItem('user_data', JSON.stringify(user));
    return user;
  } catch (error: any) {
    console.error('[Auth Service] Update profile error:', error.message);
    throw error;
  }
};

// Register a new user
export const register = async (email: string, password: string, name?: string, phone?: string, roles?: string[], country?: string) => {
  try {
    console.log('[Auth Service] Registering user:', email, 'with country:', country);
    
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

    console.log('[Auth Service] Registration response:', 
      data ? `User ID: ${data.user?.id}, Email confirmation status: ${data.user?.email_confirmed_at ? 'Confirmed' : 'Pending'}` : 'No data', 
      error ? `Error: ${error.message}` : 'No error'
    );
    
    if (error) {
      console.error('[Auth Service] Registration error:', error.message);
      throw error;
    }
    
    console.log('[Auth Service] User registered successfully:', data.user?.id);
    console.log('[Auth Service] Email confirmation status:', data.user?.email_confirmed_at ? 'Confirmed' : 'Pending confirmation');
    
    let createdProfile = null;
    if (data.user?.id) {
      try {
        createdProfile = await createUserProfile(data.user.id, email, name, phone, roles, country); 
        console.log('[Auth Service] User profile created/retrieved successfully during registration:', JSON.stringify(createdProfile, null, 2));
      } catch (profileError: any) {
        console.error('[Auth Service] Error creating/retrieving user profile during registration:', profileError.message);
      }
    }
    
    console.log('[Auth Service] Supabase Auth registration data:', JSON.stringify(data, null, 2));
    if (createdProfile) {
      console.log('[Auth Service] Created/Upserted Profile during registration:', JSON.stringify(createdProfile, null, 2));
    }

    return { authData: data, profileData: createdProfile };
  } catch (error: any) {
    console.error('[Auth Service] Registration error:', error.message);
    throw error;
  }
};

// Create user profile in the database
export const createUserProfile = async (userId: string, email: string, name?: string, phone?: string, roles?: string[], country?: string): Promise<any> => {
  try {
    console.log('[Auth Service] Creating/Updating user profile for:', email, 'User ID:', userId, 'Country:', country);
    
    let profileExists = false;
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle(); 
      
      profileExists = !!existingProfile;
      console.log('[Auth Service] Profile exists check:', profileExists, 'for user ID:', userId);
    } catch (checkErr) {
      console.error('[Auth Service] Error checking if profile exists:', checkErr);
    }
    
    const upsertData: any = {
      id: userId, 
      email,
      name: name || email.split('@')[0],
      role: roles && roles.length > 0 ? roles[0] : 'user', 
      subscription: 'free',
      message_count: 0,
      message_limit: 100,
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
      property_budget_max: 2000000,
      property_bedrooms: 0,
      property_bathrooms: 0,
      property_locations: [],
      location: country || 'Dubai, UAE', 
      currency: 'AED',
      is_negotiable: false,
      requesting_price: null,
      phone: phone || '', 
      country: country || '', 
      rera_license_number: '',
      dld_license_number: '',
      adm_license_number: '',
      city: '',
      experience_years: null,
      specialties: [],
      languages_spoken: [],
      bio: '',
      properties_market_status: 'not_requested',
    };

    if (!profileExists) {
      upsertData.created_at = new Date().toISOString();
    }
    
    console.log('[Auth Service] Attempting to upsert profile with data:', JSON.stringify(upsertData, null, 2));
    const { data: upsertedProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(upsertData, { onConflict: 'id' })
      .select() 
      .single(); 

    if (upsertError) {
      console.error('[Auth Service] Error upserting user profile:', upsertError.message);
      console.error('[Auth Service] Upsert data:', JSON.stringify(upsertData, null, 2));
      console.error('[Auth Service] Error details:', upsertError);
      throw upsertError;
    }

    if (!upsertedProfile) {
      console.error('[Auth Service] Upserted profile data is null, though no error was thrown.');
      throw new Error('Failed to retrieve profile data after upsert.');
    }

    console.log('[Auth Service] User profile created/updated successfully via upsert:', JSON.stringify(upsertedProfile, null, 2));
    return upsertedProfile;
  } catch (error: any) {
    console.error('[Auth Service] Error in createUserProfile:', error.message);
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

    let profile = null;
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profileData) {
      console.log('[Auth Service] No profile found, attempting to create one.');
      try {
        const newProfile = await createUserProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.name || session.user.email?.split('@')[0]
        );
        if (!newProfile) {
          throw new Error('Failed to create or retrieve user profile during login.');
        }
        profile = newProfile;
      } catch (createOrFetchErr: any) {
        console.error('[Auth Service] Error creating/retrieving profile during login:', createOrFetchErr.message);
        throw new Error('Failed to get or create user profile during login.');
      }
    } else {
      profile = profileData;
    }

    if (!profile) {
      throw new Error('Failed to get or create user profile.');
    }

    const user: User = {
      id: session.user.id,
      email: session.user.email || '',
      name: profile.name || '',
      phone: profile.phone || '',
      avatar: profile.avatar || '',
      country: profile.country || '',
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
      reraLicenseNumber: profile.rera_license_number || '',
      dldLicenseNumber: profile.dld_license_number || '',
      admLicenseNumber: profile.adm_license_number || '',
      city: profile.city || '',
      experienceYears: profile.experience_years === null ? undefined : profile.experience_years,
      specialties: profile.specialties || [],
      languagesSpoken: profile.languages_spoken || [],
      bio: profile.bio || '',
      properties_market_status: profile.properties_market_status || 'not_requested',
    };

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

    const user: User = {
      id: profileData.id,
      email: profileData.email || '',
      name: profileData.name || '',
      phone: profileData.phone || '',
      avatar: profileData.avatar || '',
      country: profileData.country || '',
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
      reraLicenseNumber: profileData.rera_license_number || '',
      dldLicenseNumber: profileData.dld_license_number || '',
      admLicenseNumber: profileData.adm_license_number || '',
      city: profileData.city || '',
      experienceYears: profileData.experience_years === null ? undefined : profileData.experience_years,
      specialties: profileData.specialties || [],
      languagesSpoken: profileData.languages_spoken || [],
      bio: profileData.bio || '',
      properties_market_status: profileData.properties_market_status || 'not_requested',
    };

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
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('[Auth Service][DEBUG] userData after OAuth:', JSON.stringify(userData));
    if (userError || !userData?.user) {
      throw new Error('Failed to get user after Facebook login');
    }
    let profile = null;
    try {
      profile = await getUser(userData.user.id);
      console.log('[Auth Service][DEBUG] Profile fetched from DB:', JSON.stringify(profile));
      } catch (err: any) {
        console.log('[Auth Service][DEBUG] No profile found, will create profile. Error:', err?.message || 'Unknown error');
      }
    if (!profile) {
      const name = typeof userData.user.user_metadata?.name === 'string' && userData.user.user_metadata?.name.trim() !== ''
        ? userData.user.user_metadata.name
        : (userData.user.email || '');
      
      try {
        await createUserProfile(
          userData.user.id,
          userData.user.email || '',
          name
        );
        console.log('[Auth Service] Created new profile for Facebook user with updated table structure');
        
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
    const debugStoredUser = await crossStorage.getItem('user_data');
    console.log('[Auth Service][DEBUG] user_data after Facebook login:', debugStoredUser);
    const currentUser = await getCurrentUser();
    console.log('[Auth Service][DEBUG] currentUser from getCurrentUser:', JSON.stringify(currentUser));
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
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error(`[Auth Service] ${provider} login failed: No user returned after OAuth`);
    }
    
    let profile = null;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      
      if (profileError) {
        console.log(`[Auth Service] No profile found for ${provider} user, creating new profile`);
        throw profileError; 
      }
      
      profile = profileData;
    } catch (err: any) {
      console.log(`[Auth Service] Error fetching profile for ${provider} user:`, err?.message || 'Unknown error');
      
      const name = typeof userData.user.user_metadata?.name === 'string' && userData.user.user_metadata?.name.trim() !== ''
        ? userData.user.user_metadata.name
        : (userData.user.email || '');
      
      try {
        await createUserProfile(
          userData.user.id,
          userData.user.email || '',
          name
        );
        console.log(`[Auth Service] Created new profile for Facebook user with updated table structure`);
        
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
    
    const currentUser = await getCurrentUser();

    return currentUser ?? profile;
  } catch (error: any) {
    console.error(`[Auth Service] Social login error:`, error.message);
    throw error;
  }
};

// Function to check message limits
export const checkMessageLimits = async (): Promise<{ canSend: boolean; remaining: number; limit: number }> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.warn('No active user session found');
      return { canSend: false, remaining: 0, limit: 0 };
    }
    
    const userId = sessionData.session.user.id;
    
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
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      console.warn('No active user session found');
      return 0;
    }
    
    const userId = sessionData.session.user.id;
    
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

// Function to mark onboarding as complete
export const completeOnboarding = async (): Promise<User> => {
  try {
    console.log('[Auth Service] Completing onboarding for current user');
    const { data: { user: authUser }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !authUser) {
      console.error('[Auth Service] Complete onboarding error: No authenticated user found.');
      throw new Error('Complete onboarding error: User not authenticated.');
    }

    const updates = { onboarding_completed: true };
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Auth Service] Error updating onboarding status:', updateError.message);
      throw updateError;
    }

    if (!updatedProfile) {
      throw new Error('Failed to retrieve profile after updating onboarding status.');
    }
    
    const user: User = {
      id: updatedProfile.id,
      email: updatedProfile.email || '',
      name: updatedProfile.name || '',
      phone: updatedProfile.phone || '',
      avatar: updatedProfile.avatar || '',
      country: updatedProfile.country || '',
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
      onboarding_completed: updatedProfile.onboarding_completed, // Should be true
      email_verified: authUser.email_confirmed_at !== null,
      reraLicenseNumber: updatedProfile.rera_license_number || '',
      dldLicenseNumber: updatedProfile.dld_license_number || '',
      admLicenseNumber: updatedProfile.adm_license_number || '',
      city: updatedProfile.city || '',
      experienceYears: updatedProfile.experience_years === null ? undefined : updatedProfile.experience_years,
      specialties: updatedProfile.specialties || [],
      languagesSpoken: updatedProfile.languages_spoken || [],
      bio: updatedProfile.bio || '',
      properties_market_status: updatedProfile.properties_market_status || 'not_requested',
    };

    await crossStorage.setItem('user_data', JSON.stringify(user));
    console.log('[Auth Service] Onboarding completed and user profile updated.');
    return user;

  } catch (error: any) {
    console.error('[Auth Service] Error in completeOnboarding:', error.message);
    throw error;
  }
};


// Function to upload profile picture
export const uploadProfilePicture = async (userId: string, uri: string): Promise<string | null> => {
  try {
    console.log('[Auth Service] Uploading profile picture for user:', userId);
    
    const fileExt = uri.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true
      });
    
    if (error) {
      console.error('[Auth Service] Error uploading profile picture to Supabase Storage:', error.message);
      return null; 
    }
    
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar: publicUrl })
      .eq('id', userId);
    
    if (updateError) {
      console.error('[Auth Service] Error updating profile table with new avatar URL:', updateError.message);
      return null;
    }
    
    console.log('[Auth Service] Profile picture uploaded and profile updated successfully:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('[Auth Service] General error in uploadProfilePicture (e.g., network, blob conversion):', error.message);
    return null; 
  }
};
