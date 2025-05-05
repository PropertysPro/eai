import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/config/supabase';
import { CheckCircle, XCircle } from 'lucide-react-native';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token and type from URL params
        const token = params.token as string;
        const type = params.type as string;

        if (!token || !type) {
          setStatus('error');
          setMessage('Invalid verification link. Please try again or contact support.');
          return;
        }

        // Verify the email with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (error) {
          console.error('Email verification error:', error.message);
          setStatus('error');
          setMessage(error.message || 'Failed to verify email. Please try again or contact support.');
          return;
        }

        // Update the user's profile to mark email as verified
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ email_verified: true })
            .eq('id', userData.user.id);

          if (updateError) {
            console.error('Error updating profile:', updateError.message);
          }
        }

        setStatus('success');
        setMessage('Your email has been successfully verified!');
      } catch (err: any) {
        console.error('Email verification error:', err.message);
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred. Please try again or contact support.');
      }
    };

    verifyEmail();
  }, [params]);

  const handleContinue = () => {
    if (status === 'success') {
      router.replace('/auth/login');
    } else {
      router.replace('/auth/register');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color="#6200EE" style={styles.icon} />
            <Text style={styles.title}>Verifying your email...</Text>
            <Text style={styles.message}>Please wait while we confirm your email address.</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={80} color="#22C55E" style={styles.icon} />
            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={80} color="#EF4444" style={styles.icon} />
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>
            {status === 'success' ? 'Continue to Login' : 'Back to Registration'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#6200EE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
