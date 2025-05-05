import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SupportInfo {
  email: string;
  phone: string;
  website: string;
}

interface SupportStore {
  supportInfo: SupportInfo;
  updateSupportInfo: (info: Partial<SupportInfo>) => void;
}

// Default support information
const DEFAULT_SUPPORT_INFO: SupportInfo = {
  email: 'support@ellaai.com',
  phone: '+971 4 123 4567',
  website: 'ellaai.com'
};

export const useSupportStore = create<SupportStore>()(
  persist(
    (set) => ({
      supportInfo: DEFAULT_SUPPORT_INFO,
      updateSupportInfo: (info) => set((state) => ({
        supportInfo: { ...state.supportInfo, ...info }
      })),
    }),
    {
      name: 'support-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
