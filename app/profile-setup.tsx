import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { CheckCircle } from 'lucide-react-native';
import { User } from '@/types/user';

const { width } = Dimensions.get('window');

const AXI_RED = '#6200EE';
const CARD_BG = '#FFFFFF';
const BG = '#FFFFFF';
const BORDER = '#E0E0E0';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  // Initialize form with user data if available
  useEffect(() => {
    if (user) {
      setPropertyTypes(user.preferences?.propertyPreferences?.types || []);
      setBudget(user.preferences?.propertyPreferences?.budget 
        ? `${user.preferences.propertyPreferences.budget.min} - ${user.preferences.propertyPreferences.budget.max}`
        : '500K - 2M');
      setCity(user.preferences?.location || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (propertyTypes.length === 0) {
        setError('Please select at least one property type');
        setIsLoading(false);
        return;
      }

      if (!city.trim()) {
        setError('City is required');
        setIsLoading(false);
        return;
      }

      // Parse budget
      let minPrice = 500000;
      let maxPrice = 2000000;
      
      if (budget.includes('-')) {
        const [min, max] = budget.split('-').map(part => {
          // Extract numeric part
          const numericPart = part.trim().replace(/[^0-9.]/g, '');
          // Convert to number
          let value = parseFloat(numericPart);
          // Apply multiplier if K or M is present
          if (part.includes('K')) value *= 1000;
          if (part.includes('M')) value *= 1000000;
          return value;
        });
        
        minPrice = min;
        maxPrice = max;
      }

      // Prepare the updates object
      const updates: Partial<User> = {
        preferences: {
          ...(user?.preferences || {
            language: 'en',
            darkMode: false,
            biometricAuth: false,
            notifications: {
              matches: true,
              marketUpdates: true,
              newListings: true,
              subscriptionUpdates: true
            },
            currency: 'USD',
            isNegotiable: false
          }),
          location: city,
          propertyPreferences: {
            types: propertyTypes,
            budget: {
              min: minPrice,
              max: maxPrice
            },
            bedrooms: user?.preferences?.propertyPreferences?.bedrooms || 0,
            bathrooms: user?.preferences?.propertyPreferences?.bathrooms || 0,
            locations: user?.preferences?.propertyPreferences?.locations || []
          }
        }
      };

      // Update the user profile
      await updateProfile(updates);
      
      // Show success state
      setIsSuccess(true);
      
      // Navigate to profile page after a short delay
      setTimeout(() => {
        router.replace('/profile?firstTime=true');
      }, 1500);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successContent}>
          <CheckCircle size={80} color="#22C55E" />
          <Text style={styles.successTitle}>Profile Updated!</Text>
          <Text style={styles.successMessage}>
            Your profile has been successfully updated. Redirecting to the app...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Complete Your Profile</Text>
            <Text style={styles.headerSubtitle}>
              Please provide some additional information to help us personalize your experience.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.form}>
              <Text style={styles.label}>I'm interested in</Text>
              <View style={styles.propertyTypesContainer}>
                <TouchableOpacity
                  style={[
                    styles.propertyTypeButton,
                    propertyTypes.includes('buy') && styles.propertyTypeButtonActive
                  ]}
                  onPress={() => {
                    if (propertyTypes.includes('buy')) {
                      setPropertyTypes(propertyTypes.filter(t => t !== 'buy'));
                    } else {
                      setPropertyTypes([...propertyTypes, 'buy']);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.propertyTypeText,
                      propertyTypes.includes('buy') && styles.propertyTypeTextActive
                    ]}
                  >
                    Buying
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.propertyTypeButton,
                    propertyTypes.includes('sell') && styles.propertyTypeButtonActive
                  ]}
                  onPress={() => {
                    if (propertyTypes.includes('sell')) {
                      setPropertyTypes(propertyTypes.filter(t => t !== 'sell'));
                    } else {
                      setPropertyTypes([...propertyTypes, 'sell']);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.propertyTypeText,
                      propertyTypes.includes('sell') && styles.propertyTypeTextActive
                    ]}
                  >
                    Selling
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.propertyTypeButton,
                    propertyTypes.includes('rent') && styles.propertyTypeButtonActive
                  ]}
                  onPress={() => {
                    if (propertyTypes.includes('rent')) {
                      setPropertyTypes(propertyTypes.filter(t => t !== 'rent'));
                    } else {
                      setPropertyTypes([...propertyTypes, 'rent']);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.propertyTypeText,
                      propertyTypes.includes('rent') && styles.propertyTypeTextActive
                    ]}
                  >
                    Renting
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.propertyTypeButton,
                    propertyTypes.includes('invest') && styles.propertyTypeButtonActive
                  ]}
                  onPress={() => {
                    if (propertyTypes.includes('invest')) {
                      setPropertyTypes(propertyTypes.filter(t => t !== 'invest'));
                    } else {
                      setPropertyTypes([...propertyTypes, 'invest']);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.propertyTypeText,
                      propertyTypes.includes('invest') && styles.propertyTypeTextActive
                    ]}
                  >
                    Investing
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Budget Average</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500K - 2M"
                value={budget}
                onChangeText={setBudget}
                placeholderTextColor="#B0B0B0"
              />

              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dubai, UAE"
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#B0B0B0"
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.saveButton, (isLoading || authLoading) && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={isLoading || authLoading}
              >
                {isLoading || authLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Profile</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => router.replace('/(tabs)')}
                disabled={isLoading || authLoading}
              >
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 32,
    backgroundColor: BG,
  },
  propertyTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  propertyTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  propertyTypeButtonActive: {
    backgroundColor: AXI_RED,
  },
  propertyTypeText: {
    color: '#666',
    fontWeight: '500',
  },
  propertyTypeTextActive: {
    color: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  card: {
    width: width > 400 ? 400 : width - 32,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignSelf: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    color: '#222',
  },
  error: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: AXI_RED,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9370DB',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
