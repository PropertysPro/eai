import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, Home, Building, DollarSign, MapPin, Briefcase, ChevronLeft } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Property types
const propertyTypes = [
  { id: 'house', label: 'House', icon: Home },
  { id: 'apartment', label: 'Apartment', icon: Building },
  { id: 'condo', label: 'Condo', icon: Building },
  { id: 'townhouse', label: 'Townhouse', icon: Home },
  { id: 'land', label: 'Land', icon: MapPin },
  { id: 'commercial', label: 'Commercial', icon: Briefcase },
];

// Budget ranges
const budgetRanges = [
  { id: 'under100k', label: 'Under $100k' },
  { id: '100k-250k', label: '$100k - $250k' },
  { id: '250k-500k', label: '$250k - $500k' },
  { id: '500k-1m', label: '$500k - $1M' },
  { id: 'over1m', label: 'Over $1M' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [isInvestor, setIsInvestor] = useState(false);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const togglePropertyType = (id: string) => {
    if (selectedPropertyTypes.includes(id)) {
      setSelectedPropertyTypes(selectedPropertyTypes.filter(type => type !== id));
    } else {
      setSelectedPropertyTypes([...selectedPropertyTypes, id]);
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const handleComplete = async () => {
    // Validate at least one property type is selected
    if (selectedPropertyTypes.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one property type.');
      return;
    }
    
    // Validate budget is selected
    if (!selectedBudget) {
      Alert.alert('Missing Information', 'Please select your budget range.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Save preferences to user profile
      const preferences = {
        propertyTypes: selectedPropertyTypes,
        budget: selectedBudget,
        location: location,
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
        bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
        isInvestor,
        isFirstTimeBuyer,
      };
      
      // Save preferences to AsyncStorage
      await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
      
      // Mark onboarding as completed
      if (user) {
        await completeOnboarding();
        // The auth context will handle the redirect to home
      } else {
        // If no user (shouldn't happen), redirect manually
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleSkip = async () => {
    try {
      setIsLoading(true);
      
      // Mark onboarding as completed
      if (user) {
        await completeOnboarding();
        // The auth context will handle the redirect to home
      } else {
        // If no user (shouldn't happen), redirect manually
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Preferences</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>Help us find the perfect properties for you</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Type</Text>
            <Text style={styles.sectionSubtitle}>Select all that apply</Text>
            
            <View style={styles.propertyTypesGrid}>
              {propertyTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedPropertyTypes.includes(type.id);
                
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.propertyTypeItem,
                      isSelected && styles.propertyTypeItemSelected
                    ]}
                    onPress={() => togglePropertyType(type.id)}
                  >
                    <Icon 
                      size={24} 
                      color={isSelected ? Colors.primary : Colors.textLight} 
                    />
                    <Text 
                      style={[
                        styles.propertyTypeLabel,
                        isSelected && styles.propertyTypeLabelSelected
                      ]}
                    >
                      {type.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Check size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Range</Text>
            <Text style={styles.sectionSubtitle}>Select your price range</Text>
            
            <View style={styles.budgetContainer}>
              {budgetRanges.map((budget) => (
                <TouchableOpacity
                  key={budget.id}
                  style={[
                    styles.budgetItem,
                    selectedBudget === budget.id && styles.budgetItemSelected
                  ]}
                  onPress={() => setSelectedBudget(budget.id)}
                >
                  <Text 
                    style={[
                      styles.budgetLabel,
                      selectedBudget === budget.id && styles.budgetLabelSelected
                    ]}
                  >
                    {budget.label}
                  </Text>
                  {selectedBudget === budget.id && (
                    <DollarSign size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.sectionSubtitle}>Where are you looking to buy or rent?</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="City, State, or ZIP Code"
                placeholderTextColor={Colors.textLight}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            
            <View style={styles.rowContainer}>
              <View style={styles.halfInputContainer}>
                <Text style={styles.inputLabel}>Bedrooms</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={bedrooms}
                  onChangeText={setBedrooms}
                />
              </View>
              
              <View style={styles.halfInputContainer}>
                <Text style={styles.inputLabel}>Bathrooms</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={bathrooms}
                  onChangeText={setBathrooms}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>I'm an investor</Text>
              <Switch
                value={isInvestor}
                onValueChange={setIsInvestor}
                trackColor={{ false: '#e0e0e0', true: Colors.primary }}
                thumbColor={isInvestor ? Colors.primary : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>I'm a first-time buyer</Text>
              <Switch
                value={isFirstTimeBuyer}
                onValueChange={setIsFirstTimeBuyer}
                trackColor={{ false: '#e0e0e0', true: Colors.primary }}
                thumbColor={isFirstTimeBuyer ? Colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
          
          {/* Extra space at bottom to ensure content is scrollable past the buttons */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.completeButton, isLoading && styles.completeButtonDisabled]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>Complete</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  propertyTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  propertyTypeItem: {
    width: '48%',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  propertyTypeItemSelected: {
    backgroundColor: 'rgba(106, 13, 173, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  propertyTypeLabel: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
  },
  propertyTypeLabelSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetContainer: {
    marginTop: 8,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  budgetItemSelected: {
    backgroundColor: 'rgba(106, 13, 173, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  budgetLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  budgetLabelSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  input: {
    height: 50,
    color: Colors.text,
    fontSize: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  halfInputContainer: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  completeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});