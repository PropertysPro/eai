import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedCurrency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR'; // Add more as needed

interface CurrencyState {
  currentCurrency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currentCurrency: 'AED', // Default currency
      setCurrency: (currency) => {
        console.log(`Setting currency to: ${currency}`);
        set({ currentCurrency: currency });
      },
    }),
    {
      name: 'currency-preference-storage', // Unique name for AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to get currency symbol (can be expanded)
export const getCurrencySymbol = (currencyCode: SupportedCurrency): string => {
  switch (currencyCode) {
    case 'AED':
      return 'Ð'; // Or 'د.إ'
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'INR':
      return '₹';
    default:
      return currencyCode; // Fallback to code
  }
};
