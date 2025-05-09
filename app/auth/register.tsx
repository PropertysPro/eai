import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check, ChevronDown, User as UserIconLucide } from 'lucide-react-native';
import * as authService from '@/services/auth-service';
import { useAuth } from '@/context/auth-context';
import { User } from '@/types/user'; // Import User type
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const PRIMARY_COLOR = '#6200EE';
const SECONDARY_COLOR = '#9370DB';
const CARD_BG = '#FFFFFF';
const BG = '#F8F8F8';
const BORDER = '#E0E0E0';
const LIGHT_GRAY = '#F5F5F5';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuth(); // Get setUser from AuthContext

  // Country codes for phone numbers
  const countryCodes = [
    { code: '+971', country: 'UAE' },
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+965', country: 'Kuwait' },
    { code: '+974', country: 'Qatar' },
    { code: '+973', country: 'Bahrain' },
    { code: '+968', country: 'Oman' },
  ];

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+971');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('United Arab Emirates'); // Default country
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false); // For country selection

  // List of countries for the dropdown
  const countries = [
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'India', code: 'IN' },
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'Kuwait', code: 'KW' },
    { name: 'Qatar', code: 'QA' },
    { name: 'Bahrain', code: 'BH' },
    { name: 'Oman', code: 'OM' },
    { name: 'Canada', code: 'CA' },
    { name: 'Australia', code: 'AU' },
    { name: 'Germany', code: 'DE' },
    { name: 'France', code: 'FR' },
  ];
  
  // User roles
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Error state (for demo, not full validation)
  const [error, setError] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    try {
      // Validate form
      if (!email || !password || !confirmPassword || !firstName || !lastName) {
        setError('Please fill in all required fields.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (!acceptTerms || !acceptPrivacy) {
        setError('Please accept the terms and privacy policy.');
        return;
      }

      // Validate at least one role is selected
      if (!selectedRole) {
        setError('Please select a role.');
        return;
      }

      setIsLoading(true);
      setError('');

      // Create full name from first and last name
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Combine phone code and number
      const phone = phoneNumber ? `${phoneCode}${phoneNumber}` : '';

      // Call Supabase registration
      // Pass phone, roles, and country as additional data to the auth service
      console.log('[RegisterScreen] Calling authService.register with selectedRole:', selectedRole);
      const registrationResult = await authService.register(email, password, fullName, phone, selectedRole ? [selectedRole] : [], country);

      if (registrationResult.profileData) {
        // Explicitly set the user in AuthContext
        // Note: authService.register returns profileData which might not be the full User type
        // from types/user.ts if it's directly from Supabase 'profiles' table without transformation.
        // However, authService.createUserProfile *does* return the full profile object.
        // Let's assume registrationResult.profileData is compatible or transform if needed.
        // For now, assuming it's the correct structure for the User context.
        setUser(registrationResult.profileData as User); 
        console.log('[RegisterScreen] User set in AuthContext:', registrationResult.profileData);
      } else {
        console.warn('[RegisterScreen] registrationResult.profileData is null or undefined after registration.');
        // Handle case where profile data might not be available, perhaps show an error or default differently
      }

      // Always navigate to registration-success and pass the role
      const userRole = registrationResult.profileData?.role || 'user'; // Default to 'user' if role not found
      console.log('[RegisterScreen] registrationResult.profileData?.role:', registrationResult.profileData?.role, 'Derived userRole for navigation:', userRole);
      router.replace(`/auth/registration-success?role=${userRole}`);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          try {
            // Try to go back, but if it fails (no screen to go back to),
            // navigate to splash screen instead
            router.canGoBack() ? router.back() : router.replace('/splash');
          } catch (error) {
            // Fallback if router.canGoBack() is not available or fails
            router.replace('/splash');
          }
        }}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <X size={32} color="#222" /> 
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Form */}
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#B0B0B0"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#B0B0B0"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#B0B0B0"
              />
              <TextInput
                style={styles.input}
                placeholder="First name"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#B0B0B0"
              />
              <TextInput
                style={styles.input}
                placeholder="Last name"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#B0B0B0"
              />
              <View style={styles.phoneContainer}>
                <TouchableOpacity
                  style={styles.phoneCodePickerContainer}
                  onPress={() => setShowCountryCodeModal(true)}
                >
                  <Text style={styles.phoneCodePickerText}>{phoneCode}</Text>
                  <ChevronDown size={16} color="#666" />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholderTextColor="#B0B0B0"
                />
              </View>
              <TouchableOpacity
                style={styles.inputButton}
                onPress={() => setShowCountryModal(true)}
              >
                <Text style={styles.inputButtonText}>
                  {country || 'Select Country of Residence'}
                </Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
              
              {/* User Role Selection */}
              <View style={styles.sectionTitle}>
                <Text style={styles.sectionTitleText}>I am a: (Select one)</Text>
              </View>
              
              <View style={styles.rolesContainer}>
                {/* Buyer/Investor Role */}
                <TouchableOpacity
                  style={styles.checkboxRow} // Re-using checkboxRow style for layout
                  onPress={() => setSelectedRole('buyer')}
                >
                  <View style={[styles.radioOuter, selectedRole === 'buyer' && styles.radioOuterSelected]}>
                    {selectedRole === 'buyer' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Buyer/Investor</Text>
                </TouchableOpacity>

                {/* Landlord/Owner Role */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setSelectedRole('owner')}
                >
                  <View style={[styles.radioOuter, selectedRole === 'owner' && styles.radioOuterSelected]}>
                    {selectedRole === 'owner' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Landlord/Owner</Text>
                </TouchableOpacity>

                {/* Agent/Realtor Role */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setSelectedRole('realtor')}
                >
                  <View style={[styles.radioOuter, selectedRole === 'realtor' && styles.radioOuterSelected]}>
                    {selectedRole === 'realtor' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Agent/Realtor</Text>
                </TouchableOpacity>
              </View>
              {/* Checkboxes */}
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                >
                  {acceptTerms && <View style={styles.checkboxInner} />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>
                  I have read and accept the{' '}
                  <Text style={styles.linkText} onPress={() => router.push('/legal/terms')}>
                    terms & conditions
                  </Text>
                </Text>
              </View>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={[styles.checkbox, acceptPrivacy && styles.checkboxChecked]}
                  onPress={() => setAcceptPrivacy(!acceptPrivacy)}
                >
                  {acceptPrivacy && <View style={styles.checkboxInner} />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>
                  I have read and accept the{' '}
                  <Text style={styles.linkText} onPress={() => router.push('/legal/privacy')}>
                    privacy policy
                  </Text>
                </Text>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.registerButtonText}>
                  {isLoading ? 'Registering...' : 'Register'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Code Modal */}
      <Modal
        visible={showCountryCodeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryCodeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            <FlatList
              data={countryCodes}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryCodeItem}
                  onPress={() => {
                    setPhoneCode(item.code);
                    setShowCountryCodeModal(false);
                  }}
                >
                  <Text style={styles.countryCodeText}>
                    {item.code} ({item.country})
                  </Text>
                  {phoneCode === item.code && (
                    <Check size={20} color="#6200EE" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.code}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCountryCodeModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country of Residence</Text>
            <FlatList
              data={countries}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryCodeItem} // Can reuse style or create a new one
                  onPress={() => {
                    setCountry(item.name);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={styles.countryCodeText}>{item.name}</Text>
                  {country === item.name && (
                    <Check size={20} color={PRIMARY_COLOR} />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.code}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCountryModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  registerButtonDisabled: {
    backgroundColor: '#9370DB',
    opacity: 0.7,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rolesContainer: {
    marginBottom: 16,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    padding: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: BG,
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
    alignItems: 'center',
  },
  logoBox: {
    backgroundColor: '#ECE9DF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    letterSpacing: -2,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#222',
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  phoneCodePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10, 
    paddingVertical: 12,   
    marginRight: 8,
    // Removed fixed width, relying on content and padding
  },
  phoneCodePickerText: {
    fontSize: 16,
    color: '#222',
    marginRight: 6, // Space between text and chevron
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222',
  },
  inputButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  inputButtonText: {
    fontSize: 16,
    color: '#222', // Or a placeholder color if country is not selected
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  countryCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  modalCloseButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#6200EE',
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  checkboxInner: { // Can be reused for radio button's inner dot if needed, or make specific
    width: 12,
    height: 12,
    backgroundColor: '#fff', // For selected radio, this will be inside the colored outer
    borderRadius: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10, // Make it circular
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioOuterSelected: {
    borderColor: PRIMARY_COLOR, // Keep border color same
  },
  radioInner: {
    width: 10, // Smaller inner circle
    height: 10,
    borderRadius: 5, // Circular
    backgroundColor: PRIMARY_COLOR, // Color for selected state
  },
  checkboxLabel: {
    color: '#222',
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  linkText: {
    color: PRIMARY_COLOR,
    textDecorationLine: 'underline',
  },
  error: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
