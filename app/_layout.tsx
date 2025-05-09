import 'expo-crypto';
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/auth-context';
import { initializeDatabase, createRequiredTables } from '@/config/supabase';
import { LogBox, View, Text } from 'react-native';
import { NotificationProvider } from '@/store/notification-store';
import { useRouter, useSegments } from 'expo-router';
import AuthWrapper from '@/components/AuthWrapper';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);


interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error boundary component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Navigation Error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ color: 'red' }}>{this.state.error?.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Initialize database and create required tables
    const initDb = async () => {
      try {
        // await initializeDatabase();
        // await createRequiredTables();
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    initDb();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <StatusBar style="auto" />
          <AuthWrapper>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
            <Stack.Screen name="splash" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="auth" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="admin" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="add-edit-property" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="property-details" options={{ headerShown: true, animation: 'none' }} />
            <Stack.Screen name="chat" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="profile" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="settings" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="subscription" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="distressed-deals" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="my-properties" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="matching" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="history" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="how-we-work" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="checkout" options={{ headerShown: false, animation: 'none' }} />
            <Stack.Screen name="legal" options={{ headerShown: false, animation: 'none' }} /> 
            {/* This will use app/legal/_layout.tsx to manage its children */}
            <Stack.Screen name="version" options={{ title: "App Version", animation: 'none' }} />
            <Stack.Screen name="notifications" options={{ title: "Notifications", animation: 'none' }} />
            </Stack>
          </AuthWrapper>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
