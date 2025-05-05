import { create } from 'zustand';
import { authService } from '../services/auth-service';
import { User } from '../types/user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<User>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  updateProfile: async (updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedUser = await authService.updateProfile(updates);
      set({ user: updatedUser, isLoading: false });
      return updatedUser;
    } catch (error: any) {
      console.error('[Auth Store] Update profile error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  updatePreferences: async (preferences) => {
    try {
      set({ isLoading: true, error: null });
      const currentUser = get().user;
      if (!currentUser) {
        throw new Error('No user found');
      }
      const updatedUser = await authService.updateProfile({
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          ...preferences
        }
      });
      set({ user: updatedUser, isLoading: false });
      return updatedUser;
    } catch (error: any) {
      console.error('[Auth Store] Update preferences error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
})); 