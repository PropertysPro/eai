import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import * as authService from '@/services/auth-service';
import { supabase } from '@/config/supabase';
import { crossStorage } from '@/services/crossPlatformStorage';

const { width, height } = Dimensions.get('window');

const BG = '#fff';
const TEXT_COLOR = '#333';
const BUTTON_COLOR = '#6200EE';

export default function RegistrationSuccessScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      
      // Store the registration state in local storage to maintain it across navigation
      await crossStorage.setItem('just_registered', 'true');
      
      // Navigate to profile setup
      router.replace('/profile-setup');
    } catch (error) {
      console.error("Error in handleContinue:", error);
      // If there's an error, default to login
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <CheckCircle size={120} color="#22C55E" />
        <Text style={styles.title}>
          To complete registration, check your email to confirm your account.
        </Text>
        <Text style={styles.subtitle}>
          Please remember to check your SPAM or junk folder for our registration
          confirmation email.
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                Continue to Complete Your Profile
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.helperText}>
            You can complete your profile now and verify your email later.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_COLOR,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: BUTTON_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
