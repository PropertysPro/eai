import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

export default function ErrorBoundaryFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    resetError();
    router.replace('/(tabs)'); // Navigate to the tabs layout which contains the home screen
  };

  return (
    <View style={styles.container}>
      <AlertTriangle size={60} color={Colors.error} />
      
      <Text style={styles.title}>Something went wrong</Text>
      
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={resetError}>
          <RefreshCw size={20} color="white" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.homeButton]} onPress={handleGoHome}>
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
    width: '100%',
    maxWidth: 400,
  },
  errorMessage: {
    color: Colors.error,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  homeButton: {
    backgroundColor: Colors.secondary,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});