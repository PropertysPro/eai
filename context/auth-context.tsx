import React, { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { User } from '@/types/user';
import * as authService from '@/services/auth-service';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/config/supabase';
import { crossStorage } from '@/services/crossPlatformStorage';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmailVerificationNeeded: boolean;
  setUser: (user: User | null) => void;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: { name: string; email: string; password: string }) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  loginWithApple: () => Promise<User>;
  loginWithFacebook: () => Promise<User>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<User>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  checkMessageLimits: () => Promise<{ canSend: boolean; remaining: number; limit: number }>;
  updateMessageUsage: () => Promise<number>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin email for restricted access
const ADMIN_EMAIL = 'propertyspro@gmail.com';

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // --- DEBUG LOGGING & GUARD AGAINST INFINITE LOOPS ---
  const lastLogRef = useRef<{ onboarding_completed: boolean | undefined; segment: string | undefined }>({ onboarding_completed: undefined, segment: undefined });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmailVerificationNeeded, setIsEmailVerificationNeeded] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Check for existing session only on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        // Check for Supabase session
        let { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth Context] Error getting Supabase session:', sessionError.message);
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('[Auth Context] Error refreshing session:', refreshError.message);
            setUser(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsEmailVerificationNeeded(false);
            await crossStorage.removeItem('user_data');
            setIsLoading(false);
            return;
          }
          if (refreshData.session) {
            supabaseSession = refreshData.session;
          }
        }

        if (!supabaseSession?.user) {
          // Not logged in: try to restore from crossStorage
          const storedUser = await crossStorage.getItem('user_data');
          if (storedUser) {
            const restoredUser = JSON.parse(storedUser) as User;
            setUser(restoredUser);
            setIsAuthenticated(true);
      setIsAdmin(restoredUser.role === 'admin' || restoredUser.email === ADMIN_EMAIL);
            setIsEmailVerificationNeeded(!restoredUser.email_verified);
            // Let the second useEffect handle routing
            setIsLoading(false);
            return;
          }
          // No session and nothing to restore: remain logged out
          setUser(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
          setIsEmailVerificationNeeded(false);
          await crossStorage.removeItem('user_data');
          setIsLoading(false);
          // router.replace('/onboarding'); // Removed routing
          return;
        }

        // Logged in: fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseSession.user.id)
          .single();

        if (profileError || !profileData) {
          console.error('[Auth Context] Error getting user profile:', profileError?.message);
          await authService.logout();
          setUser(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
          setIsEmailVerificationNeeded(false);
          // Let the second useEffect handle routing
          // router.replace('/login'); // Removed routing
          setIsLoading(false);
          return;
        }

        // Store user in crossStorage
        await crossStorage.setItem('user_data', JSON.stringify(profileData));
        setUser(profileData as User);
        setIsAuthenticated(true);
        setIsAdmin(profileData.role === 'admin' || profileData.email === ADMIN_EMAIL);
        console.log("isAdmin:", isAdmin);
        setIsEmailVerificationNeeded(!profileData.email_verified);

        // Let the second useEffect handle routing
        // if (!profileData.onboarding_completed) { // Removed routing
        //   if (!segments.includes('onboarding')) {
        //     router.replace('/onboarding');
        //   }
        // } else {
        //   if (!segments.includes('(tabs)')')) {
        //     router.replace('/(tabs)');
        //   }
        // }

        setIsLoading(false);
      } catch (err: unknown) {
        console.error('[Auth Context] Error checking session:', err instanceof Error ? err.message : 'Unknown error');
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsEmailVerificationNeeded(false);
        // Let the second useEffect handle routing
        // router.replace('/login'); // Removed routing
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const transformSupabaseUser = (supabaseUser: any): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.name || supabaseUser.user_metadata?.name || '',
      phone: supabaseUser.phone || '',
      avatar: supabaseUser.avatar || '',
      preferences: supabaseUser.preferences || {},
      role: supabaseUser.role || supabaseUser.user_metadata?.role || 'user',
      subscription: supabaseUser.subscription || supabaseUser.user_metadata?.subscription || 'free',
      message_count: supabaseUser.message_count || supabaseUser.user_metadata?.message_count || 0,
      message_limit: supabaseUser.message_limit || supabaseUser.user_metadata?.message_limit || 10,
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at,
      email_verified: supabaseUser.email_confirmed_at !== null,
      onboarding_completed: supabaseUser.onboarding_completed || supabaseUser.user_metadata?.onboarding_completed || false,
    };
  };

  // Auth context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isEmailVerificationNeeded,
    setUser,
    login: async (credentials: { email: string; password: string }) => {
      const result = await authService.login(credentials.email, credentials.password);
      const transformedUser = transformSupabaseUser(result);
      setUser(transformedUser);
      setIsAuthenticated(true);
      setIsAdmin(transformedUser.role === 'admin' || transformedUser.email === ADMIN_EMAIL);
      setIsEmailVerificationNeeded(!transformedUser.email_verified);
      
      // Store user data in crossStorage
      await crossStorage.setItem('user_data', JSON.stringify(transformedUser));
      
      return transformedUser;
    },
    register: async (data: { email: string; password: string; name: string }) => {
      const result = await authService.register(data.email, data.password, data.name);
      // Access user from result.authData.user
      if (!result.authData || !result.authData.user) {
        throw new Error('Failed to register user: No user data returned from auth service.');
      }
      const transformedUser = transformSupabaseUser(result.authData.user);
      setUser(transformedUser);
      setIsAuthenticated(true);
      setIsAdmin(transformedUser.role === 'admin' || transformedUser.email === ADMIN_EMAIL);
      setIsEmailVerificationNeeded(!transformedUser.email_verified);
      
      // Store user data in crossStorage
      await crossStorage.setItem('user_data', JSON.stringify(transformedUser));
      
      // Navigate based on onboarding status
      if (!transformedUser.onboarding_completed) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
      
      return transformedUser;
    },
    loginWithGoogle: async () => {
      const result = await authService.loginWithGoogle();
      return transformSupabaseUser(result);
    },
    loginWithApple: async () => {
      const result = await authService.loginWithApple();
      return transformSupabaseUser(result);
    },
    loginWithFacebook: async () => {
      const result = await authService.loginWithFacebook();
      return transformSupabaseUser(result);
    },
    logout: async () => {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsEmailVerificationNeeded(false);
      await crossStorage.removeItem('user_data');
      router.replace('/auth/login');
    },
    completeOnboarding: async () => {
      try {
        console.log('[Auth Context] Completing onboarding');
        const updatedUser = await authService.completeOnboarding();
        setUser(updatedUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        router.replace('/(tabs)');
        return updatedUser;
      } catch (error) {
        console.error('[Auth Context] Error completing onboarding:', error);
        setIsLoading(false);
        throw error;
      }
    },
    updateProfile: async (updates: Partial<User>) => {
      setIsLoading(true);
      try {
        console.log('[Auth Context] Updating profile with:', updates);
        const updatedUser = await authService.updateProfile(updates);
        if (!updatedUser) {
          throw new Error('Failed to update profile');
        }
        setUser(updatedUser);
        setIsAuthenticated(true);
        return updatedUser;
      } catch (error) {
        console.error('[Auth Context] Error updating profile:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    checkMessageLimits: authService.checkMessageLimits,
    updateMessageUsage: authService.updateMessageUsage,
    resendVerificationEmail: async (email: string) => {
      console.log('[Auth Context] Resending verification email to:', email);
      return await authService.resendVerificationEmail(email);
    },
    refreshUser: async () => {
      setIsLoading(true);
      try {
        console.log('[Auth Context] Refreshing user data');
        const refreshedUser = await authService.getCurrentUser();
        if (refreshedUser) {
          setUser(refreshedUser);
          setIsAuthenticated(true);
          setIsAdmin(refreshedUser.role === 'admin' || refreshedUser.email === ADMIN_EMAIL);
          setIsEmailVerificationNeeded(!refreshedUser.email_verified);
          await crossStorage.setItem('user_data', JSON.stringify(refreshedUser));
        } else {
          // If getCurrentUser returns null (e.g., session expired or user deleted)
          setUser(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
          setIsEmailVerificationNeeded(false);
          await crossStorage.removeItem('user_data');
        }
        return refreshedUser;
      } catch (error) {
        console.error('[Auth Context] Error refreshing user data:', error);
        // Optionally handle specific errors or re-throw
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsEmailVerificationNeeded(false);
        await crossStorage.removeItem('user_data');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
