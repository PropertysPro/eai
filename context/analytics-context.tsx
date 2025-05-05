import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/use-auth';

// Define analytics event types
export type EventType = 
  | 'screen_view'
  | 'user_login'
  | 'user_register'
  | 'user_logout'
  | 'property_view'
  | 'property_save'
  | 'property_inquiry'
  | 'chat_message'
  | 'subscription_view'
  | 'subscription_purchase'
  | 'app_error'
  | 'search_query'
  | 'suggestion_used';

interface AnalyticsContextType {
  trackEvent: (eventName: EventType, properties?: Record<string, any>) => void;
  trackScreen: (screenName: string, properties?: Record<string, any>) => void;
  trackError: (error: Error, componentStack?: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent: () => {},
  trackScreen: () => {},
  trackError: () => {},
});

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { user, isAuthenticated } = useAuth();

  // Get or create anonymous user ID
  useEffect(() => {
    const getOrCreateAnonymousId = async () => {
      try {
        let anonymousId = await AsyncStorage.getItem('analytics_anonymous_id');
        if (!anonymousId) {
          anonymousId = uuidv4();
          await AsyncStorage.setItem('analytics_anonymous_id', anonymousId);
        }
      } catch (error) {
        console.error('Failed to get or create anonymous ID:', error);
      }
    };

    getOrCreateAnonymousId();
  }, []);

  // Track screen views
  useEffect(() => {
    if (pathname) {
      trackScreen(pathname);
    }
  }, [pathname]);

  const trackEvent = async (eventName: EventType, properties: Record<string, any> = {}) => {
    try {
      // In a real app, this would send data to your analytics service
      // For now, we'll just log to console
      const anonymousId = await AsyncStorage.getItem('analytics_anonymous_id');
      
      const eventData = {
        event: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          appVersion: '1.0.0', // You would get this from app config
          deviceId: anonymousId,
          userId: user?.id || null,
          isAuthenticated,
        },
      };
      
      console.log('Analytics Event:', eventData);
      
      // In production, you would send this to your analytics service:
      // await fetch('https://analytics.ellaai.com/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventData),
      // });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  const trackScreen = (screenName: string, properties: Record<string, any> = {}) => {
    trackEvent('screen_view', { 
      screen_name: screenName,
      ...properties 
    });
  };

  const trackError = (error: Error, componentStack?: string) => {
    trackEvent('app_error', {
      error_message: error.message,
      error_stack: error.stack,
      component_stack: componentStack,
    });
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackScreen, trackError }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => useContext(AnalyticsContext);