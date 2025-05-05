import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/context/auth-context';
import EmailVerificationBanner from './EmailVerificationBanner';
import { usePathname } from 'expo-router';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isEmailVerificationNeeded } = useAuth();
  const [showBanner, setShowBanner] = useState(true);
  const currentPath = usePathname();

  const handleDismissBanner = () => {
    setShowBanner(false);
  };

  return (
    <View style={styles.container}>
      {isAuthenticated && isEmailVerificationNeeded && showBanner && (
        <EmailVerificationBanner 
          onDismiss={handleDismissBanner} 
          currentPath={currentPath}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
