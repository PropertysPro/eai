import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { User } from '@/types/user';
import * as authService from '@/services/auth-service';
import { crossStorage } from '@/services/crossPlatformStorage';
import { CheckCircle, XCircle } from 'lucide-react-native';

const AXI_RED = '#6200EE';
const BG = '#F8F8F8';
const SUCCESS_COLOR = '#22C55E';
const ERROR_COLOR = '#D32F2F';

export default function RealtorProfileCompletionHandlerScreen() {
  const router = useRouter();
  const { user, updateProfile: updateAuthContextProfile, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Potentially receive payment status from checkout page if passed via params
  const params = useLocalSearchParams<{ payment_status?: string }>();

  useEffect(() => {
    const completeProfileUpdate = async () => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      // Optional: Check payment_status from params if your checkout flow provides it
      // For now, we assume reaching this screen implies successful payment for simplicity
      // if (params.payment_status !== 'success') {
      //   setError("Payment was not successful. Please try again or contact support.");
      //   setIsLoading(false);
      //   return;
      // }

      if (!user) {
        setError("User session not found. Please log in and try again.");
        setIsLoading(false);
        return;
      }

      try {
        const stashedDataString = await crossStorage.getItem('pendingRealtorProfileUpdate');
        if (!stashedDataString) {
          setError('No pending profile data found. Please try setting up your profile again.');
          setIsLoading(false);
          return;
        }

        const stashedData = JSON.parse(stashedDataString);
        let uploadedAvatarUrl = user.avatar; // Default to current avatar

        // 1. Upload avatar if a new one was picked
        if (stashedData.avatarUri && stashedData.avatarUri !== user.avatar) {
          try {
            const uploadedUrl = await authService.uploadProfilePicture(user.id, stashedData.avatarUri);
            if (uploadedUrl) {
              uploadedAvatarUrl = uploadedUrl;
            } else {
              console.warn('Avatar upload failed during completion, proceeding with old or no avatar.');
            }
          } catch (avatarError: any) {
            console.error('Error uploading avatar during completion:', avatarError);
            // Decide if this is a critical error or if we proceed without new avatar
            setError('Failed to upload new profile picture. Profile updated with previous avatar.');
          }
        }

        // 2. Prepare final updates for the profile
        const finalUpdates: Partial<User> & { onboarding_completed: boolean } = {
          id: user.id,
          avatar: uploadedAvatarUrl,
          experienceYears: stashedData.experienceYears,
          specialties: stashedData.specialties,
          languagesSpoken: stashedData.languagesSpoken,
          bio: stashedData.bio,
          reraLicenseNumber: stashedData.reraLicenseNumber,
          dldLicenseNumber: stashedData.dldLicenseNumber,
          admLicenseNumber: stashedData.admLicenseNumber,
          subscription: stashedData.selectedSubscription, // The paid subscription
          onboarding_completed: true,
        };
        
        // 3. Update profile
        await updateAuthContextProfile(finalUpdates);
        await refreshUser(); // Ensure context has the latest user data

        // 4. Clear stashed data
        await crossStorage.removeItem('pendingRealtorProfileUpdate');

        setIsSuccess(true);
        setTimeout(() => {
          router.replace('/(tabs)'); // Navigate to home
        }, 2000);

      } catch (err: any) {
        console.error('Error completing realtor profile update:', err);
        setError(err.message || 'An unexpected error occurred while finalizing your profile.');
      } finally {
        setIsLoading(false);
      }
    };

    completeProfileUpdate();
  }, [user]); // Rerun if user object changes (e.g., after login)

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={AXI_RED} />
        <Text style={styles.messageText}>Finalizing your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isSuccess && (
        <>
          <CheckCircle size={80} color={SUCCESS_COLOR} />
          <Text style={styles.titleText}>Profile Setup Complete!</Text>
          <Text style={styles.messageText}>Your realtor profile and subscription are active. Redirecting...</Text>
        </>
      )}
      {error && (
        <>
          <XCircle size={80} color={ERROR_COLOR} />
          <Text style={styles.titleText}>Update Failed</Text>
          <Text style={styles.messageText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.buttonText}>Go to Home</Text>
          </TouchableOpacity>
           <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={() => router.replace('/auth/realtor-profile-setup')}>
            <Text style={styles.buttonText}>Retry Profile Setup</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
    padding: 20,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: AXI_RED,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#777',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
