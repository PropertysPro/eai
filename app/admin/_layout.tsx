import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { colors as Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';

export default function AdminLayout() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted || hasRedirected) return;
    // Redirect non-admin users away from admin panel
    const inTabsGroup = segments[0] === '(tabs)';
    const inAuthGroup = segments[0] === 'auth';
    if (isAuthenticated && !isAdmin && !inTabsGroup) {
      router.replace('/(tabs)');
      setHasRedirected(true);
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
      setHasRedirected(true);
    }
  }, [mounted, isAuthenticated, isAdmin, segments, hasRedirected, router]);
  
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Admin Panel',
          headerTitleStyle: { color: Colors.text },
        }} 
      />
    </Stack>
  );
}
