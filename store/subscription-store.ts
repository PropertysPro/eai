import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscriptionPlan from '../app/subscription';

interface SubscriptionState {
  currentPlanId: string | null;
  userCurrency: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentPlan: (planId: string) => void;
  setUserCurrency: (currency: string) => void;
  getPlansInUserCurrency: () => typeof SubscriptionPlan[];
  getCurrentPlan: () => typeof SubscriptionPlan | null;
  isPremiumUser: () => boolean;
  getMessageLimit: () => number;
}

// Define subscription plans
const SUBSCRIPTION_PLANS: Record<string, Record<string, typeof SubscriptionPlan[]>> = {
  USD: {
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 'AED0/month',
        priceValue: 0,
        currency: 'USD',
        features: [
          'Up to 10 messages per day',
          'Basic property search',
          'Email support',
          'Mobile app access'
        ],
        messageLimit: 10,
      },
      {
        id: 'basic',
        name: 'Basic',
        price: '$9.99/month',
        priceValue: 9.99,
        currency: 'USD',
        features: [
          'Up to 100 messages per day',
          'Advanced property search',
          'Market trend analysis',
          'Priority email support',
          'Save up to 20 properties'
        ],
        messageLimit: 100,
        isPopular: true,
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '$19.99/month',
        priceValue: 19.99,
        currency: 'USD',
        features: [
          'Unlimited messages',
          'Premium property search',
          'Real-time market alerts',
          'Investment analysis tools',
          'Priority phone support',
          'Save unlimited properties',
          'Custom property recommendations'
        ],
        messageLimit: Infinity,
      }
    ]
  },
  EUR: {
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: '€0/month',
        priceValue: 0,
        currency: 'EUR',
        features: [
          'Up to 10 messages per day',
          'Basic property search',
          'Email support',
          'Mobile app access'
        ],
        messageLimit: 10,
      },
      {
        id: 'basic',
        name: 'Basic',
        price: '€8.99/month',
        priceValue: 8.99,
        currency: 'EUR',
        features: [
          'Up to 100 messages per day',
          'Advanced property search',
          'Market trend analysis',
          'Priority email support',
          'Save up to 20 properties'
        ],
        messageLimit: 100,
        isPopular: true,
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '€17.99/month',
        priceValue: 17.99,
        currency: 'EUR',
        features: [
          'Unlimited messages',
          'Premium property search',
          'Real-time market alerts',
          'Investment analysis tools',
          'Priority phone support',
          'Save unlimited properties',
          'Custom property recommendations'
        ],
        messageLimit: Infinity,
      }
    ]
  }
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      currentPlanId: 'free', // Default to free plan
      userCurrency: 'USD',
      isLoading: false,
      error: null,
      
      setCurrentPlan: (planId: string) => {
        set({ currentPlanId: planId });
      },
      
      setUserCurrency: (currency: string) => {
        if (SUBSCRIPTION_PLANS[currency]) {
          set({ userCurrency: currency });
        } else {
          console.warn(`Currency ${currency} not supported, defaulting to USD`);
          set({ userCurrency: 'USD' });
        }
      },
      
      getPlansInUserCurrency: () => {
        const { userCurrency } = get();
        return SUBSCRIPTION_PLANS[userCurrency]?.plans || SUBSCRIPTION_PLANS.USD.plans;
      },
      
      getCurrentPlan: () => {
        const { currentPlanId, userCurrency } = get();
        const plans = SUBSCRIPTION_PLANS[userCurrency]?.plans || SUBSCRIPTION_PLANS.USD.plans;
        return plans.find(plan => plan.id === currentPlanId) || plans[0];
      },
      
      isPremiumUser: () => {
        const { currentPlanId } = get();
        return currentPlanId !== 'free';
      },
      
      getMessageLimit: () => {
        const currentPlan = get().getCurrentPlan();
        return currentPlan?.messageLimit || 10;
      }
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentPlanId: state.currentPlanId,
        userCurrency: state.userCurrency,
      }),
    }
  )
);
