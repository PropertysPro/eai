import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Check, 
  Home, 
  Globe, 
  DollarSign, 
  Save, 
  User as UserIcon, 
  Camera, 
  Lock, 
  Shield, 
  Eye,
  Bell,
  Moon,
  ChevronRight
} from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import usePropertyStore from '@/store/property-store';
import { SUPPORTED_LANGUAGES } from '@/config/env';
import { useLocalSearchParams } from 'expo-router';
import { User } from '@/types/user';
import * as authService from '@/services/auth-service';

// Define supported currencies
const SUPPORTED_CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'INR'];

// Sample avatar URL - replace with actual user avatar when available
const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading } = useAuth();
  const { currencyPreference, setCurrencyPreference } = usePropertyStore();
  const params = useLocalSearchParams();
  const firstTime = params?.firstTime === 'true';
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    language: '',
    location: '',
    propertyTypes: [] as string[],
    currency: '',
    priceRange: '',
    requestingPrice: '',
    isNegotiable: false,
    pushNotifications: false,
    darkMode: false,
    avatar: DEFAULT_AVATAR,
    reraLicenseNumber: '',
    dldLicenseNumber: '',
    admLicenseNumber: '',
  });
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPriceRangeModal, setShowPriceRangeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Function to handle image picking and uploading
  const handlePickImage = async () => {
    try {
      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos to update your profile picture.');
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Show loading indicator
        setIsUploadingImage(true);
        
        try {
          // Upload the image to Supabase storage
          const imageUrl = await authService.uploadProfilePicture(user?.id || '', selectedImage.uri);
          
          if (imageUrl) {
            // Update the form data with the new avatar URL
            setFormData(prev => ({ ...prev, avatar: imageUrl }));
            
            // Show success message
            Alert.alert('Success', 'Profile picture updated successfully');
          }
        } catch (error: any) {
          console.error('[Profile] Error uploading profile picture:', error);
          Alert.alert('Error', error.message || 'Failed to upload profile picture');
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error: any) {
      console.error('[Profile] Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  // Initialize form data from user object
  useEffect(() => {
    if (user) {
      // Split name into first and last name
      let firstName = '';
      let lastName = '';
      
      if (user.name) {
        const nameParts = user.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      setFormData({
        firstName: firstName,
        lastName: lastName,
        email: user.email || '',
        phone: user.phone || '',
        language: user.preferences?.language || 'en',
        location: user.preferences?.location || 'Dubai, UAE',
        propertyTypes: user.preferences?.propertyPreferences?.types || [],
        currency: user.preferences?.currency || 'AED',
        priceRange: user.preferences?.propertyPreferences?.budget 
          ? `${user.preferences.propertyPreferences.budget.min} - ${user.preferences.propertyPreferences.budget.max}`
          : '500K AED - 2.0M AED',
        requestingPrice: user.preferences?.requestingPrice ? String(user.preferences.requestingPrice) : '',
        isNegotiable: user.preferences?.isNegotiable || false,
        pushNotifications: user.preferences?.notifications?.matches || false,
        darkMode: user.preferences?.darkMode || false,
        avatar: user.avatar || DEFAULT_AVATAR,
        reraLicenseNumber: user.reraLicenseNumber || '',
        dldLicenseNumber: user.dldLicenseNumber || '',
        admLicenseNumber: user.admLicenseNumber || '',
      });
    }
  }, [user]);
  
  const handleSaveChanges = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      console.log('[Profile] Starting profile update with form data:', formData);
      
      // Parse price range
      let minPrice = 500000;
      let maxPrice = 2000000;
      
      if (formData.priceRange.includes('-')) {
        const [min, max] = formData.priceRange.split('-').map(part => {
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
      
      // Prepare update data
      const updateData: Partial<User> = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        avatar: formData.avatar,
        preferences: {
          language: formData.language,
          location: formData.location,
          currency: formData.currency,
          darkMode: formData.darkMode,
          biometricAuth: user?.preferences?.biometricAuth || false,
          isNegotiable: formData.isNegotiable,
          requestingPrice: formData.requestingPrice ? Number(formData.requestingPrice) : undefined,
          notifications: {
            matches: formData.pushNotifications,
            marketUpdates: user?.preferences?.notifications?.marketUpdates || false,
            newListings: user?.preferences?.notifications?.newListings || false,
            subscriptionUpdates: user?.preferences?.notifications?.subscriptionUpdates || false,
          },
          propertyPreferences: {
            types: formData.propertyTypes,
            budget: {
              min: minPrice,
              max: maxPrice,
            },
            bedrooms: user?.preferences?.propertyPreferences?.bedrooms || 0,
            bathrooms: user?.preferences?.propertyPreferences?.bathrooms || 0,
            locations: user?.preferences?.propertyPreferences?.locations || [],
          }
        }
      };
      
      // Add realtor license information if user is a realtor
      if (user.role === 'realtor') {
        updateData.reraLicenseNumber = formData.reraLicenseNumber;
        updateData.dldLicenseNumber = formData.dldLicenseNumber;
        updateData.admLicenseNumber = formData.admLicenseNumber;
      }

      console.log('[Profile] Prepared update data:', JSON.stringify(updateData, null, 2));
      
      // Update profile
      const updatedUser = await updateProfile(updateData);
      console.log('[Profile] Profile updated successfully:', updatedUser);
      
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK' }]
      );
      
      if (firstTime) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('[Profile] Error updating profile:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update profile'
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  const togglePropertyType = (type: string) => {
    setFormData(prev => {
      const types = [...prev.propertyTypes];
      
      if (types.includes(type)) {
        return {
          ...prev,
          propertyTypes: types.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          propertyTypes: [...types, type]
        };
      }
    });
  };
  
  const renderCurrencyItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setFormData(prev => ({ ...prev, currency: item }));
        setShowCurrencyModal(false);
      }}
    >
      <Text style={styles.modalItemText}>{item}</Text>
      {formData.currency === item && (
        <Check size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );
  
  const renderPriceRangeItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setFormData(prev => ({ ...prev, priceRange: item }));
        setShowPriceRangeModal(false);
      }}
    >
      <Text style={styles.modalItemText}>{item}</Text>
      {formData.priceRange === item && (
        <Check size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );
  
  const renderLanguageItem = ({ item }: { item: string }) => {
    const languageNames: Record<string, string> = {
      en: 'English',
      ar: 'Arabic',
      fr: 'French',
      es: 'Spanish',
      hi: 'Hindi'
    };
    
    return (
      <TouchableOpacity
        style={styles.modalItem}
        onPress={() => {
          setFormData(prev => ({ ...prev, language: item }));
          setShowLanguageModal(false);
        }}
      >
        <Text style={styles.modalItemText}>{languageNames[item] || item}</Text>
        {formData.language === item && (
          <Check size={20} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }
  
  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Please log in to view your profile</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <View style={styles.header}>
<TouchableOpacity onPress={() => router.push('/(tabs)/account')} style={styles.backButton}>
  <ChevronLeft size={24} color={Colors.text} />
</TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Profile Header with Avatar */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: formData.avatar }} 
              style={styles.avatar} 
            />
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={handlePickImage}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>
            {formData.firstName} {formData.lastName}
          </Text>
          <Text style={styles.profileEmail}>{formData.email}</Text>
        </View>
        
        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <UserIcon size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          
          {/* First Name */}
          <View style={styles.section}>
          <Text style={styles.sectionLabel}>First Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
              placeholder="Enter your first name"
              placeholderTextColor={Colors.input.placeholder}
              id="profile-first-name"
              autoComplete="name-given"
            />
          </View>
        </View>
        
        {/* Last Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Last Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
              placeholder="Enter your last name"
              placeholderTextColor={Colors.input.placeholder}
              id="profile-last-name"
              autoComplete="name-family"
            />
          </View>
        </View>
        
        {/* Phone */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Phone</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.input.placeholder}
              keyboardType="phone-pad"
              id="profile-phone"
              autoComplete="tel"
            />
          </View>
        </View>
        
        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location</Text>
          <TouchableOpacity style={styles.inputContainer}>
            <View style={styles.inputWithIcon}>
              <Home size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Enter your location"
                placeholderTextColor={Colors.input.placeholder}
                id="profile-location"
                autoComplete="address-line2"
              />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Language</Text>
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.inputWithIcon}>
              <Globe size={20} color={Colors.textLight} style={styles.inputIcon} />
              <Text style={styles.selectText}>
                {formData.language === 'en' ? 'English' : 
                 formData.language === 'ar' ? 'Arabic' : 
                 formData.language === 'fr' ? 'French' : 
                 formData.language === 'es' ? 'Spanish' : 
                 formData.language === 'hi' ? 'Hindi' : 
                 formData.language}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Text style={styles.sectionLabel}>I'm interested in</Text>
          <View style={styles.propertyTypesContainer}>
            <TouchableOpacity
              style={[
                styles.propertyTypeButton,
                formData.propertyTypes.includes('buy') && styles.propertyTypeButtonActive
              ]}
              onPress={() => togglePropertyType('buy')}
            >
              <Text
                style={[
                  styles.propertyTypeText,
                  formData.propertyTypes.includes('buy') && styles.propertyTypeTextActive
                ]}
              >
                Buying
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.propertyTypeButton,
                formData.propertyTypes.includes('sell') && styles.propertyTypeButtonActive
              ]}
              onPress={() => togglePropertyType('sell')}
            >
              <Text
                style={[
                  styles.propertyTypeText,
                  formData.propertyTypes.includes('sell') && styles.propertyTypeTextActive
                ]}
              >
                Selling
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.propertyTypeButton,
                formData.propertyTypes.includes('rent') && styles.propertyTypeButtonActive
              ]}
              onPress={() => togglePropertyType('rent')}
            >
              <Text
                style={[
                  styles.propertyTypeText,
                  formData.propertyTypes.includes('rent') && styles.propertyTypeTextActive
                ]}
              >
                Renting
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.propertyTypeButton,
                formData.propertyTypes.includes('invest') && styles.propertyTypeButtonActive
              ]}
              onPress={() => togglePropertyType('invest')}
            >
              <Text
                style={[
                  styles.propertyTypeText,
                  formData.propertyTypes.includes('invest') && styles.propertyTypeTextActive
                ]}
              >
                Investing
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionLabel}>Currency</Text>
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => setShowCurrencyModal(true)}
          >
            <View style={styles.inputWithIcon}>
              <DollarSign size={20} color={Colors.textLight} style={styles.inputIcon} />
              <Text style={styles.selectText}>
                {formData.currency === 'AED' ? 'AED (UAE Dirham)' : 
                 formData.currency === 'USD' ? 'USD (US Dollar)' : 
                 formData.currency}
              </Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.sectionLabel}>Price Range</Text>
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => setShowPriceRangeModal(true)}
          >
            <View style={styles.inputWithIcon}>
              <DollarSign size={20} color={Colors.textLight} style={styles.inputIcon} />
              <Text style={styles.selectText}>{formData.priceRange}</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.sectionLabel}>Requesting Price</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={formData.requestingPrice}
              onChangeText={(text) => setFormData(prev => ({ ...prev, requestingPrice: text }))}
              placeholder="Your desired price"
              placeholderTextColor={Colors.input.placeholder}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Price is negotiable</Text>
            <Switch
              value={formData.isNegotiable}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isNegotiable: value }))}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={formData.isNegotiable ? Colors.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Switch
              value={formData.pushNotifications}
              onValueChange={(value) => setFormData(prev => ({ ...prev, pushNotifications: value }))}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={formData.pushNotifications ? Colors.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Dark Mode</Text>
            <Switch
              value={formData.darkMode}
              onValueChange={(value) => setFormData(prev => ({ ...prev, darkMode: value }))}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={formData.darkMode ? Colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
        
        </View>
        
        {/* Realtor License Information - Only shown if user is a realtor */}
        {user.role === 'realtor' && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Realtor License Information</Text>
            </View>
            
            {/* RERA License Number */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>RERA License Number</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.reraLicenseNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, reraLicenseNumber: text }))}
                  placeholder="Enter your RERA license number (optional)"
                  placeholderTextColor={Colors.input.placeholder}
                />
              </View>
            </View>
            
            {/* DLD License Number */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DLD License Number</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.dldLicenseNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, dldLicenseNumber: text }))}
                  placeholder="Enter your DLD license number (optional)"
                  placeholderTextColor={Colors.input.placeholder}
                />
              </View>
            </View>
            
            {/* ADM License Number */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ADM License Number</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.admLicenseNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, admLicenseNumber: text }))}
                  placeholder="Enter your ADM license number (optional)"
                  placeholderTextColor={Colors.input.placeholder}
                />
              </View>
            </View>
          </View>
        )}
        
        {/* Security Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          
          <TouchableOpacity style={styles.securityItem}>
            <View style={styles.securityIconContainer}>
              <Lock size={18} color="#fff" />
            </View>
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityText}>Change Password</Text>
              <Text style={styles.securitySubtext}>Last changed 30 days ago</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.securityItem}>
            <View style={[styles.securityIconContainer, {backgroundColor: Colors.info}]}>
              <Shield size={18} color="#fff" />
            </View>
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityText}>Two-Factor Authentication</Text>
              <Text style={styles.securitySubtext}>Enhance your account security</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.securityItem, {borderBottomWidth: 0}]}>
            <View style={[styles.securityIconContainer, {backgroundColor: Colors.success}]}>
              <Eye size={18} color="#fff" />
            </View>
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityText}>Privacy Settings</Text>
              <Text style={styles.securitySubtext}>Manage your data and privacy</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSaveChanges}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Save size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
      
      {/* Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <FlatList
              data={SUPPORTED_CURRENCIES}
              renderItem={renderCurrencyItem}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCurrencyModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Price Range Modal */}
      <Modal
        visible={showPriceRangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPriceRangeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Price Range</Text>
            <FlatList
              data={[
                '500K AED - 2.0M AED',
                '500K - 1M',
                '1M - 2M',
                '2M - 5M',
                '5M+'
              ]}
              renderItem={renderPriceRangeItem}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPriceRangeModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <FlatList
              data={SUPPORTED_LANGUAGES}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Slightly off-white background for better contrast with cards
  },
  
  // Profile Header Styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textLight,
  },
  
  // Card Styles
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: Colors.input.background,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.input.text,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  selectText: {
    fontSize: 16,
    color: Colors.input.text,
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.text,
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
    backgroundColor: Colors.button.secondary,
    marginRight: 8,
    marginBottom: 8,
  },
  propertyTypeButtonActive: {
    backgroundColor: Colors.button.primary,
  },
  propertyTypeText: {
    color: Colors.button.text.secondary,
    fontWeight: '500',
  },
  propertyTypeTextActive: {
    color: Colors.button.text.primary,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  securityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  securityIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textLight,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityText: {
    fontSize: 16,
    color: Colors.text,
  },
  securitySubtext: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
});
