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
  Image,
  Dimensions,
  Modal // Added Modal import
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { User as UserIcon, CheckCircle, UploadCloud, Edit3 } from 'lucide-react-native';
import { User } from '@/types/user';
import * as ImagePicker from 'expo-image-picker';
import * as authService from '@/services/auth-service'; 
import { crossStorage } from '@/services/crossPlatformStorage'; // Added import

const { width } = Dimensions.get('window');

const AXI_RED = '#6200EE'; // Or your app's primary color
const CARD_BG = '#FFFFFF';
const BG = '#F8F8F8'; // Light gray background
const BORDER = '#E0E0E0';
const TEXT_COLOR = '#333';
const PLACEHOLDER_TEXT_COLOR = '#B0B0B0';
const SUCCESS_COLOR = '#22C55E';

// Placeholder for subscription packages - replace with actual data source
const subscriptionPackages = [
  { id: 'free', name: 'Free Tier', price: '$0/month', features: ['Basic Listing', 'Limited Support'] },
  { id: 'premium', name: 'Premium Agent', price: '$49/month', features: ['Enhanced Listings', 'Priority Support', 'Analytics'] },
  { id: 'pro', name: 'Pro Realtor', price: '$99/month', features: ['All Premium Features', 'Dedicated Account Manager', 'Advanced Tools'] },
];

export default function RealtorProfileSetupScreen() {
  const router = useRouter();
  const { user, updateProfile: updateAuthContextProfile, isLoading: authLoading, refreshUser } = useAuth();
  const [isSavingProfile, setIsSavingProfile] = useState(false); // More specific name
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
  const [experienceYears, setExperienceYears] = useState<string>(user?.experienceYears?.toString() || '');
  // Restoring arrays for multi-select
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(user?.specialties || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(user?.languagesSpoken || []);
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [reraLicenseNumber, setReraLicenseNumber] = useState<string>(user?.reraLicenseNumber || '');
  const [dldLicenseNumber, setDldLicenseNumber] = useState<string>(user?.dldLicenseNumber || '');
  const [admLicenseNumber, setAdmLicenseNumber] = useState<string>(user?.admLicenseNumber || '');
  const [selectedSubscription, setSelectedSubscription] = useState<string>(user?.subscription || 'free');

  // Moved these useState hooks to the top
  const [showSpecialtiesModal, setShowSpecialtiesModal] = useState(false);
  const [showLanguagesModal, setShowLanguagesModal] = useState(false);
  
  const commonSpecialties = [
    "Luxury Villas", "Luxury Apartments", "Commercial Real Estate", 
    "Residential Sales", "Residential Leasing", "Off-plan Properties", 
    "Land Sales", "Property Management"
  ];
  
  const commonLanguages = [
    "English", "Arabic", "French", "Spanish", "Russian", 
    "Hindi", "Urdu", "Chinese (Mandarin)", "German"
  ];

  
  // Log user and authLoading state changes
  useEffect(() => {
    console.log('[RealtorProfileSetupScreen] useEffect triggered. User:', user, 'AuthLoading:', authLoading);
    if (user) {
      console.log('[RealtorProfileSetupScreen] User object is available in useEffect, initializing form data.');
      // Initialize form state from user object if available
      setAvatarUri(user.avatar || null);
      setExperienceYears(user.experienceYears?.toString() || '');
      setSelectedSpecialties(user.specialties || []);
      setSelectedLanguages(user.languagesSpoken || []);
      setBio(user.bio || '');
      setReraLicenseNumber(user.reraLicenseNumber || '');
      setDldLicenseNumber(user.dldLicenseNumber || '');
      setAdmLicenseNumber(user.admLicenseNumber || '');
      setSelectedSubscription(user.subscription || 'free');
    }
  }, [user]);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    console.log('[RealtorProfileSetupScreen] Attempting to save profile. Current user:', user, 'Auth loading:', authLoading);
    if (authLoading) {
      Alert.alert("Loading", "User data is still loading. Please wait a moment and try again.");
      return;
    }
    if (!user) {
      setError('User not found. Please log in again.');
      Alert.alert("Error", "User session not found. Please try logging in again or ensure you are logged in.");
      return;
    }

    setError('');
    setIsSavingProfile(true);

    try {
      // Logic for paid subscriptions
      if (selectedSubscription === 'premium' || selectedSubscription === 'pro') {
        const selectedPackageDetails = subscriptionPackages.find(p => p.id === selectedSubscription);
        
        // Extract numeric price for payment processing. Example: "$49/month" -> 49
        const priceString = selectedPackageDetails?.price.match(/\$?(\d+(\.\d+)?)/);
        const amountForPayment = priceString ? parseFloat(priceString[1]) : 0;

        if (!selectedPackageDetails || amountForPayment <= 0) {
            Alert.alert("Error", "Selected subscription package details are invalid.");
            setIsSavingProfile(false);
            return;
        }

        const profileUpdatesForLater = {
          avatarUri, 
          experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
          specialties: selectedSpecialties,
          languagesSpoken: selectedLanguages,
          bio,
          reraLicenseNumber,
          dldLicenseNumber,
          admLicenseNumber,
          subscription: selectedSubscription, // Keep the selected subscription ID
          onboarding_completed: true, // Will be set to true after payment and profile update
        };
        
        await crossStorage.setItem('pendingRealtorProfileUpdate', JSON.stringify(profileUpdatesForLater));
        
        router.push({ 
          pathname: '/checkout', 
          params: { 
            planId: selectedSubscription, 
            planName: selectedPackageDetails.name,
            amount: amountForPayment.toString(), // Pass amount as string
            currency: 'USD', // Assuming USD, adjust as needed
            description: `Subscription to ${selectedPackageDetails.name}`,
            returnPath: '/auth/realtor-profile-completion-handler' 
          } 
        });
        setIsSavingProfile(false); // Stop loading indicator as we are navigating away
        return;
      }

      // For free tier, update profile directly
      let uploadedAvatarUrl = user.avatar;
      if (avatarUri && avatarUri !== user.avatar) {
        // Upload new avatar if changed
        const uploadedUrl = await authService.uploadProfilePicture(user.id, avatarUri);
        if (uploadedUrl) {
          uploadedAvatarUrl = uploadedUrl;
        } else {
          console.warn('Avatar upload failed, proceeding with old or no avatar.');
        }
      }

      const updates: Partial<User> & { onboarding_completed: boolean } = {
        id: user.id, // Important for updateProfile to identify the user
        avatar: uploadedAvatarUrl,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : undefined,
        // Restoring arrays for multi-select
        specialties: selectedSpecialties, 
        languagesSpoken: selectedLanguages,
        bio,
        reraLicenseNumber,
        dldLicenseNumber,
        admLicenseNumber,
        subscription: selectedSubscription,
        onboarding_completed: true, // Mark onboarding as completed
      };

      // Use the updateProfile from auth-context which internally calls authService.updateProfile
      await updateAuthContextProfile(updates);
      await refreshUser();

      setIsSuccess(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);

    } catch (err: any) {
      console.error('Error updating realtor profile (free tier):', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      Alert.alert("Error", err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Show loading indicator if auth context is loading or user is not yet available
  if (authLoading && !user) { 
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AXI_RED} />
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successContent}>
          <CheckCircle size={80} color={SUCCESS_COLOR} />
          <Text style={styles.successTitle}>Profile Updated!</Text>
          <Text style={styles.successMessage}>
            Your realtor profile is set up. Redirecting to the app...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Complete Your Realtor Profile</Text>
            <Text style={styles.headerSubtitle}>
              This information will be displayed on your public profile and help clients connect with you.
            </Text>
          </View>

          <View style={styles.card}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <UserIcon size={48} color={AXI_RED} />
                  </View>
                )}
                <View style={styles.avatarEditButton}>
                  <Edit3 size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePickAvatar} style={styles.uploadButton}>
                <UploadCloud size={20} color={AXI_RED} style={{ marginRight: 8 }} />
                <Text style={styles.uploadButtonText}>Upload Profile Picture</Text>
              </TouchableOpacity>
            </View>

            {/* Professional Profile */}
            <Text style={styles.sectionTitle}>Professional Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Years of Experience (e.g., 5)"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            />

            {/* Specialties Multi-select */}
            <Text style={styles.label}>Specialties (Select multiple)</Text>
            <TouchableOpacity style={styles.multiSelectButton} onPress={() => setShowSpecialtiesModal(true)}>
              <Text style={styles.multiSelectButtonText}>
                {selectedSpecialties.length > 0 ? selectedSpecialties.join(', ') : 'Select Specialties'}
              </Text>
            </TouchableOpacity>

            {/* Languages Multi-select */}
            <Text style={styles.label}>Languages Spoken (Select multiple)</Text>
            <TouchableOpacity style={styles.multiSelectButton} onPress={() => setShowLanguagesModal(true)}>
              <Text style={styles.multiSelectButtonText}>
                {selectedLanguages.length > 0 ? selectedLanguages.join(', ') : 'Select Languages'}
              </Text>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Short Bio (Tell us about yourself)"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            />

            {/* License Information */}
            <Text style={styles.sectionTitle}>License Information</Text>
            <TextInput
              style={styles.input}
              placeholder="RERA License Number (Optional)"
              value={reraLicenseNumber}
              onChangeText={setReraLicenseNumber}
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            />
            <TextInput
              style={styles.input}
              placeholder="DLD License Number (Optional)"
              value={dldLicenseNumber}
              onChangeText={setDldLicenseNumber}
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            />
            <TextInput
              style={styles.input}
              placeholder="ADM License Number (Optional)"
              value={admLicenseNumber}
              onChangeText={setAdmLicenseNumber}
              placeholderTextColor={PLACEHOLDER_TEXT_COLOR}
            />

            {/* Subscription Package */}
            <Text style={styles.sectionTitle}>Subscription Package</Text>
            <View style={styles.subscriptionContainer}>
              {subscriptionPackages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.subscriptionOption,
                    selectedSubscription === pkg.id && styles.subscriptionOptionSelected,
                  ]}
                  onPress={() => setSelectedSubscription(pkg.id)}
                >
                  <Text style={[
                      styles.subscriptionName,
                      selectedSubscription === pkg.id && styles.subscriptionNameSelected
                    ]}>{pkg.name}</Text>
                  <Text style={[
                    styles.subscriptionPrice,
                    selectedSubscription === pkg.id && styles.subscriptionPriceSelected
                  ]}>{pkg.price}</Text>
                  {/* <Text style={styles.subscriptionFeatures}>{pkg.features.join(', ')}</Text> */}
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.saveButton, (isSavingProfile || authLoading || !user) && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSavingProfile || authLoading || !user}
            >
              {(isSavingProfile || authLoading) ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save & Continue</Text>
              )}
            </TouchableOpacity>
             <TouchableOpacity
                style={styles.skipButton}
                onPress={() => router.replace('/(tabs)')} 
                disabled={isSavingProfile || authLoading}
              >
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Specialties Modal */}
      <Modal
        visible={showSpecialtiesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSpecialtiesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Specialties</Text>
            <ScrollView>
              {commonSpecialties.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedSpecialties(prev => 
                      prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]
                    );
                  }}
                >
                  <Text style={[styles.modalItemText, selectedSpecialties.includes(item) && styles.modalItemTextSelected]}>
                    {item}
                  </Text>
                  {selectedSpecialties.includes(item) && <CheckCircle size={20} color={AXI_RED} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSpecialtiesModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Languages Modal */}
      <Modal
        visible={showLanguagesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguagesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Languages</Text>
            <ScrollView>
              {commonLanguages.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedLanguages(prev => 
                      prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]
                    );
                  }}
                >
                  <Text style={[styles.modalItemText, selectedLanguages.includes(item) && styles.modalItemTextSelected]}>
                    {item}
                  </Text>
                  {selectedLanguages.includes(item) && <CheckCircle size={20} color={AXI_RED} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguagesModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_COLOR,
    marginBottom: 8,
    marginTop: 10,
  },
  multiSelectButton: { // Style for the multi-select touchable
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  multiSelectButtonText: {
    fontSize: 15,
    color: TEXT_COLOR, // Or PLACEHOLDER_TEXT_COLOR if nothing selected
  },
  modalContainer: { // Styles for Modals
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalItemText: {
    fontSize: 16,
    color: TEXT_COLOR,
  },
  modalItemTextSelected: {
    fontWeight: 'bold',
    color: AXI_RED,
  },
  modalCloseButton: {
    backgroundColor: AXI_RED,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24, // Reduced padding
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20, // Reduced margin
  },
  headerTitle: {
    fontSize: 26, // Slightly smaller
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15, // Slightly smaller
    color: '#555', // Darker gray
    lineHeight: 20,
  },
  card: {
    width: width > 450 ? 450 : width - 32, // Max width for larger screens
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20, // Reduced padding
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
    borderWidth: 2,
    borderColor: AXI_RED,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: AXI_RED,
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: CARD_BG,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0EFFF', // Light primary color
  },
  uploadButtonText: {
    color: AXI_RED,
    fontWeight: '500',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginTop: 16, // Increased top margin
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    color: TEXT_COLOR,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  subscriptionContainer: {
    marginBottom: 16,
  },
  subscriptionOption: {
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 10,
  },
  subscriptionOptionSelected: {
    borderColor: AXI_RED,
    backgroundColor: '#F0EFFF',
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  subscriptionNameSelected: {
    color: AXI_RED,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  subscriptionPriceSelected: {
    color: AXI_RED,
  },
  subscriptionFeatures: {
    fontSize: 12,
    color: '#777',
    marginTop: 6,
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
    backgroundColor: '#9370DB', // Lighter primary for disabled
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17, // Slightly smaller
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  skipButtonText: {
    color: '#555',
    fontSize: 15,
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
    color: TEXT_COLOR,
    marginTop: 24,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
});
