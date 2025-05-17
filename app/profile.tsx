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

// Use local favicon as the default avatar
const DEFAULT_AVATAR = require('@/assets/favicon-logo.png');

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
    // New realtor/seller fields
    city: '',
    experienceYears: '', // Storing as string for TextInput, convert to number on save
    specialties: [] as string[],
    languagesSpoken: [] as string[],
    bio: '',
    properties_market_status: 'not_requested' as 'not_requested' | 'pending_approval' | 'approved' | 'rejected',
    // Social media fields
    linkedin_url: '',
    youtube_url: '',
    whatsapp_number: '',
    tiktok_url: '',
    instagram_url: '',
    snapchat_username: '',
  });

  // Mock reviews for display
  const mockReviews = [
    { id: '1', reviewerName: 'Alice Smith', rating: 5, comment: 'Great to work with!', createdAt: new Date().toLocaleDateString(), reviewerAvatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { id: '2', reviewerName: 'Bob Johnson', rating: 4, comment: 'Very knowledgeable.', createdAt: new Date().toLocaleDateString(), reviewerAvatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
  ];
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPriceRangeModal, setShowPriceRangeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Function to handle image picking and uploading
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use enum for clarity
        allowsEditing: true, 
        aspect: [1, 1], 
        quality: 0.7,
        base64: true, // Request base64 data
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setIsUploadingImage(true);
        try {
          // Step 1: Upload image to storage and get URL
          // Pass both URI and base64 data (ensuring null is converted to undefined) to the service function
          const newImageUrl = await authService.uploadProfilePicture(user?.id || '', selectedImage.uri, selectedImage.base64 || undefined);
          console.log('[Profile] New image URL from uploadProfilePicture:', newImageUrl); // <-- ADD LOG
          
          if (newImageUrl) {
            // Step 2: Update the profile in the database and auth context with the new avatar URL
            // This will also trigger the useEffect to update formData.avatar if `user` object changes
            console.log('[Profile] Calling updateProfile with avatar:', newImageUrl); // <-- ADD LOG
            await updateProfile({ avatar: newImageUrl }); 
            // No need to call setFormData here directly for avatar, 
            // as useEffect listening to `user` changes will handle it.
            Alert.alert('Success', 'Profile picture updated successfully. Save changes to persist other edits.');
          } else {
            Alert.alert('Error', 'Failed to upload profile picture. The image URL was not returned.');
          }
        } catch (error: any) {
          console.error('[Profile] Error uploading profile picture or updating profile:', error);
          Alert.alert('Error', error.message || 'Failed to update profile picture.');
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
      console.log('[Profile] useEffect triggered by user change. User avatar from context:', user.avatar); // <-- ADD LOG
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
        currency: user.preferences?.currency || 'USD',
        priceRange: user.preferences?.propertyPreferences?.budget 
          ? `${user.preferences.propertyPreferences.budget.min} - ${user.preferences.propertyPreferences.budget.max}`
          : '500K AED - 2.0M AED',
        requestingPrice: user.preferences?.requestingPrice ? String(user.preferences.requestingPrice) : '',
        isNegotiable: user.preferences?.isNegotiable || false,
        pushNotifications: user.preferences?.notifications?.matches || false,
        darkMode: user.preferences?.darkMode || false,
        avatar: DEFAULT_AVATAR,
        reraLicenseNumber: user.reraLicenseNumber || '',
        dldLicenseNumber: user.dldLicenseNumber || '',
        admLicenseNumber: user.admLicenseNumber || '',
        city: user.city || '',
        experienceYears: user.experienceYears ? String(user.experienceYears) : '',
        specialties: user.specialties || [],
        languagesSpoken: user.languagesSpoken || [],
        bio: user.bio || '',
        properties_market_status: user.properties_market_status || 'not_requested',
        // Social media fields
        linkedin_url: user.linkedin_url || '',
        youtube_url: user.youtube_url || '',
        whatsapp_number: user.whatsapp_number || '',
        tiktok_url: user.tiktok_url || '',
        instagram_url: user.instagram_url || '',
        snapchat_username: user.snapchat_username || '',
      });
    }
  }, [user]);
  
  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      console.log('[Profile] Starting profile update with form data:', formData);
      let minPrice = 500000;
      let maxPrice = 2000000;
      if (formData.priceRange.includes('-')) {
        const [min, max] = formData.priceRange.split('-').map(part => {
          const numericPart = part.trim().replace(/[^0-9.]/g, '');
          let value = parseFloat(numericPart);
          if (part.includes('K')) value *= 1000;
          if (part.includes('M')) value *= 1000000;
          return value;
        });
        minPrice = min;
        maxPrice = max;
      }
      const updateData: Partial<User> = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        preferences: {
          language: formData.language,
          location: formData.location,
          currency: formData.currency,
          darkMode: user?.preferences?.darkMode,
          biometricAuth: user?.preferences?.biometricAuth,
          isNegotiable: formData.isNegotiable,
          requestingPrice: formData.requestingPrice ? Number(formData.requestingPrice) : undefined,
          notifications: {
            matches: formData.pushNotifications,
            marketUpdates: user?.preferences?.notifications?.marketUpdates,
            newListings: user?.preferences?.notifications?.newListings,
            subscriptionUpdates: user?.preferences?.notifications?.subscriptionUpdates,
          },
          propertyPreferences: {
            types: formData.propertyTypes,
            budget: { min: minPrice, max: maxPrice },
            bedrooms: user?.preferences?.propertyPreferences?.bedrooms,
            bathrooms: user?.preferences?.propertyPreferences?.bathrooms,
            locations: user?.preferences?.propertyPreferences?.locations,
          }
        }
      };
      
      if (user.role === 'realtor' || user.role === 'seller') {
        updateData.reraLicenseNumber = formData.reraLicenseNumber;
        updateData.dldLicenseNumber = formData.dldLicenseNumber;
        updateData.admLicenseNumber = formData.admLicenseNumber;
        updateData.city = formData.city;
        updateData.experienceYears = formData.experienceYears ? parseInt(formData.experienceYears, 10) : undefined;
        updateData.specialties = formData.specialties;
        updateData.languagesSpoken = formData.languagesSpoken;
        updateData.bio = formData.bio;
        // Social media fields
        updateData.linkedin_url = formData.linkedin_url;
        updateData.youtube_url = formData.youtube_url;
        updateData.whatsapp_number = formData.whatsapp_number;
        updateData.tiktok_url = formData.tiktok_url;
        updateData.instagram_url = formData.instagram_url;
        updateData.snapchat_username = formData.snapchat_username;
        // Save the current status, actual request handled separately by handleRequestVisibility
        updateData.properties_market_status = formData.properties_market_status;
      }
      console.log('[Profile] Prepared update data:', JSON.stringify(updateData, null, 2));
      const updatedUser = await updateProfile(updateData);
      console.log('[Profile] Profile updated successfully:', updatedUser);
      Alert.alert('Success', 'Profile updated successfully', [{ text: 'OK' }]);
      if (firstTime) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('[Profile] Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  const togglePropertyType = (type: string) => {
    setFormData(prev => {
      const types = [...prev.propertyTypes];
      if (types.includes(type)) {
        return { ...prev, propertyTypes: types.filter(t => t !== type) };
      } else {
        return { ...prev, propertyTypes: [...types, type] };
      }
    });
  };
  
  const renderCurrencyItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.modalItem} onPress={() => { setFormData(prev => ({ ...prev, currency: item })); setShowCurrencyModal(false); }}>
      <Text style={styles.modalItemText}>{item}</Text>
      {formData.currency === item && <Check size={20} color={Colors.primary} />}
    </TouchableOpacity>
  );
  
  const renderPriceRangeItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.modalItem} onPress={() => { setFormData(prev => ({ ...prev, priceRange: item })); setShowPriceRangeModal(false); }}>
      <Text style={styles.modalItemText}>{item}</Text>
      {formData.priceRange === item && <Check size={20} color={Colors.primary} />}
    </TouchableOpacity>
  );
  
  const renderLanguageItem = ({ item }: { item: string }) => {
    const languageNames: Record<string, string> = { en: 'English', ar: 'Arabic', fr: 'French', es: 'Spanish', hi: 'Hindi' };
    return (
      <TouchableOpacity style={styles.modalItem} onPress={() => { setFormData(prev => ({ ...prev, language: item })); setShowLanguageModal(false); }}>
        <Text style={styles.modalItemText}>{languageNames[item] || item}</Text>
        {formData.language === item && <Check size={20} color={Colors.primary} />}
      </TouchableOpacity>
    );
  };

  // Helper function to get display text for status
  const getStatusText = (status: typeof formData.properties_market_status) => {
    switch (status) {
      case 'not_requested': return 'Not Requested';
      case 'pending_approval': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  // Function to handle the request visibility action
  const handleRequestVisibility = async () => {
    if (!user || user.subscription === 'free') return;
    const currentStatus = formData.properties_market_status;
    // Optimistically update UI
    setFormData(prev => ({ ...prev, properties_market_status: 'pending_approval' }));
    try {
      // Assuming updateProfile can handle partial updates including just the status
      await updateProfile({ properties_market_status: 'pending_approval' });
      Alert.alert('Success', 'Your request to appear in the Properties Market has been submitted for approval.');
    } catch (error: any) {
       console.error('[Profile] Error requesting visibility:', error);
       Alert.alert('Error', 'Failed to submit visibility request.');
       // Revert optimistic update on error
       setFormData(prev => ({ ...prev, properties_market_status: currentStatus })); 
    }
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
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth/login')}>
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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={typeof formData.avatar === 'string' ? { uri: formData.avatar } : formData.avatar}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton} onPress={handlePickImage} disabled={isUploadingImage}>
              {isUploadingImage ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{formData.firstName} {formData.lastName}</Text>
          <Text style={styles.profileEmail}>{formData.email}</Text>
        </View>
        
        {/* Personal Info Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <UserIcon size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          {/* Fields: First Name, Last Name, Phone, Location, Language */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>First Name</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} value={formData.firstName} onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))} placeholder="Enter first name" placeholderTextColor={Colors.input.placeholder} />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Last Name</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} value={formData.lastName} onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))} placeholder="Enter last name" placeholderTextColor={Colors.input.placeholder} />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Phone</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} value={formData.phone} onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))} placeholder="Enter phone number" keyboardType="phone-pad" placeholderTextColor={Colors.input.placeholder} />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            <TouchableOpacity style={styles.inputContainer}>
              <View style={styles.inputWithIcon}>
                <Home size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput style={styles.input} value={formData.location} onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))} placeholder="Enter location" placeholderTextColor={Colors.input.placeholder} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Language</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowLanguageModal(true)}>
              <View style={styles.inputWithIcon}>
                <Globe size={20} color={Colors.textLight} style={styles.inputIcon} />
                <Text style={styles.selectText}>{formData.language === 'en' ? 'English' : formData.language === 'ar' ? 'Arabic' : formData.language}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <UserIcon size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          {/* Fields: Interested In, Currency, Price Range, Requesting Price, Negotiable, Notifications, Dark Mode */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>I'm interested in</Text>
            <View style={styles.propertyTypesContainer}>
              {['buy', 'sell', 'rent', 'invest'].map(type => (
                <TouchableOpacity key={type} style={[styles.propertyTypeButton, formData.propertyTypes.includes(type) && styles.propertyTypeButtonActive]} onPress={() => togglePropertyType(type)}>
                  <Text style={[styles.propertyTypeText, formData.propertyTypes.includes(type) && styles.propertyTypeTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Currency</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowCurrencyModal(true)}>
              <View style={styles.inputWithIcon}>
                <Text style={styles.selectText}>{formData.currency}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Price Range</Text>
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowPriceRangeModal(true)}>
              <View style={styles.inputWithIcon}>
                <Text style={styles.selectText}>{formData.priceRange}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Requesting Price</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} value={formData.requestingPrice} onChangeText={(text) => setFormData(prev => ({ ...prev, requestingPrice: text }))} placeholder="Your desired price" placeholderTextColor={Colors.input.placeholder} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Price is negotiable</Text>
            <Switch value={formData.isNegotiable} onValueChange={(value) => setFormData(prev => ({ ...prev, isNegotiable: value }))} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={formData.isNegotiable ? Colors.primary : '#f4f3f4'} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Switch value={formData.pushNotifications} onValueChange={(value) => setFormData(prev => ({ ...prev, pushNotifications: value }))} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={formData.pushNotifications ? Colors.primary : '#f4f3f4'} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Dark Mode</Text>
            <Switch value={formData.darkMode} onValueChange={(value) => setFormData(prev => ({ ...prev, darkMode: value }))} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={formData.darkMode ? Colors.primary : '#f4f3f4'} />
          </View>
        </View>
        
        {/* Realtor/Seller Professional Profile Card */}
        {(user.role === 'realtor' || user.role === 'seller') && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <UserIcon size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Professional Profile</Text>
            </View>
            {/* Fields: City, Experience, Bio, Specialties, Languages */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>City</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.city} onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))} placeholder="e.g., Dubai" placeholderTextColor={Colors.input.placeholder} />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Years of Experience</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.experienceYears} onChangeText={(text) => setFormData(prev => ({ ...prev, experienceYears: text.replace(/[^0-9]/g, '') }))} placeholder="e.g., 5" keyboardType="number-pad" placeholderTextColor={Colors.input.placeholder} />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Bio / About Me</Text>
              <View style={styles.inputContainer}>
                <TextInput style={[styles.input, styles.textArea]} value={formData.bio} onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))} placeholder="Tell us about yourself..." multiline numberOfLines={4} placeholderTextColor={Colors.input.placeholder} />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Specialties (comma-separated)</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.specialties.join(', ')} onChangeText={(text) => setFormData(prev => ({ ...prev, specialties: text.split(',').map(s => s.trim()).filter(s => s) }))} placeholder="e.g., Luxury Villas, Off-plan" placeholderTextColor={Colors.input.placeholder} />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Languages Spoken (comma-separated)</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.languagesSpoken.join(', ')} onChangeText={(text) => setFormData(prev => ({ ...prev, languagesSpoken: text.split(',').map(s => s.trim()).filter(s => s) }))} placeholder="e.g., English, Arabic" placeholderTextColor={Colors.input.placeholder} />
              </View>
            </View>

            {/* Social Media Links */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LinkedIn Profile URL</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.linkedin_url} onChangeText={(text) => setFormData(prev => ({ ...prev, linkedin_url: text }))} placeholder="Enter LinkedIn URL (optional)" placeholderTextColor={Colors.input.placeholder} textContentType="URL" keyboardType="url" />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>YouTube Channel URL</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.youtube_url} onChangeText={(text) => setFormData(prev => ({ ...prev, youtube_url: text }))} placeholder="Enter YouTube URL (optional)" placeholderTextColor={Colors.input.placeholder} textContentType="URL" keyboardType="url" />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>WhatsApp Number</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.whatsapp_number} onChangeText={(text) => setFormData(prev => ({ ...prev, whatsapp_number: text }))} placeholder="Enter WhatsApp number (optional)" placeholderTextColor={Colors.input.placeholder} keyboardType="phone-pad" />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TikTok Profile URL</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.tiktok_url} onChangeText={(text) => setFormData(prev => ({ ...prev, tiktok_url: text }))} placeholder="Enter TikTok URL (optional)" placeholderTextColor={Colors.input.placeholder} textContentType="URL" keyboardType="url" />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Instagram Profile URL</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.instagram_url} onChangeText={(text) => setFormData(prev => ({ ...prev, instagram_url: text }))} placeholder="Enter Instagram URL (optional)" placeholderTextColor={Colors.input.placeholder} textContentType="URL" keyboardType="url" />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Snapchat Username</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.snapchat_username} onChangeText={(text) => setFormData(prev => ({ ...prev, snapchat_username: text }))} placeholder="Enter Snapchat username (optional)" placeholderTextColor={Colors.input.placeholder} />
              </View>
            </View>

            {/* Properties Market Visibility Status/Request */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Properties Market Visibility</Text>
              {user?.subscription === 'free' ? (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>Requires a paid subscription to appear in the Properties Market.</Text>
                  <TouchableOpacity onPress={() => router.push('/subscription')} style={styles.upgradeButton}>
                    <Text style={styles.upgradeButtonText}>Upgrade Subscription</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>
                    Status: <Text style={styles.statusValue}>{getStatusText(formData.properties_market_status)}</Text>
                  </Text>
                  {(formData.properties_market_status === 'not_requested' || formData.properties_market_status === 'rejected') && (
                    <TouchableOpacity onPress={handleRequestVisibility} style={styles.requestButton}>
                      <Text style={styles.requestButtonText}>Request Visibility</Text>
                    </TouchableOpacity>
                  )}
                  {formData.properties_market_status === 'pending_approval' && (
                     <Text style={styles.statusSubText}>Your request is pending admin approval.</Text>
                  )}
                   {formData.properties_market_status === 'approved' && (
                     <Text style={styles.statusSubText}>You are visible in the Properties Market.</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* License Info Card */}
        {(user.role === 'realtor' || user.role === 'seller') && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>License Information</Text>
            </View>
            {/* Fields: RERA, DLD, ADM */}
             <View style={styles.section}>
              <Text style={styles.sectionLabel}>RERA License Number</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.reraLicenseNumber} onChangeText={(text) => setFormData(prev => ({ ...prev, reraLicenseNumber: text }))} placeholder="Enter RERA license (optional)" placeholderTextColor={Colors.input.placeholder} />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DLD License Number</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.dldLicenseNumber} onChangeText={(text) => setFormData(prev => ({ ...prev, dldLicenseNumber: text }))} placeholder="Enter DLD license (optional)" placeholderTextColor={Colors.input.placeholder} />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ADM License Number</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={formData.admLicenseNumber} onChangeText={(text) => setFormData(prev => ({ ...prev, admLicenseNumber: text }))} placeholder="Enter ADM license (optional)" placeholderTextColor={Colors.input.placeholder} />
              </View>
            </View>
          </View>
        )}

        {/* Reviews Card */}
        {(user.role === 'realtor' || user.role === 'seller') && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
            </View>
            <View style={styles.ratingSummary}>
              <Text style={styles.averageRatingText}>Average Rating: {user.averageRating?.toFixed(1) || 'N/A'} ({user.reviewCount || 0} reviews)</Text>
            </View>
            {(user.reviews && user.reviews.length > 0 ? user.reviews : mockReviews).map((review, index) => (
              <View key={review.id || index} style={styles.reviewItem}>
                <Image 
                  source={review.reviewerAvatar ? { uri: review.reviewerAvatar } : DEFAULT_AVATAR} 
                  style={styles.reviewerAvatar} 
                />
                <View style={styles.reviewContent}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                    <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.reviewRating}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
                  {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                </View>
              </View>
            ))}
            {(user.reviews?.length === 0 || !user.reviews) && mockReviews.length === 0 && (
              <Text style={styles.noReviewsText}>No reviews yet.</Text>
            )}
          </View>
        )}
        
        {/* Security Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <TouchableOpacity style={styles.securityItem}>
            <View style={styles.securityIconContainer}><Lock size={18} color="#fff" /></View>
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityText}>Change Password</Text>
              <Text style={styles.securitySubtext}>Last changed 30 days ago</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.securityItem}>
            <View style={[styles.securityIconContainer, {backgroundColor: Colors.info}]}><Shield size={18} color="#fff" /></View>
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityText}>Two-Factor Authentication</Text>
              <Text style={styles.securitySubtext}>Enhance security</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.securityItem, {borderBottomWidth: 0}]}>
            <View style={[styles.securityIconContainer, {backgroundColor: Colors.success}]}><Eye size={18} color="#fff" /></View>
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityText}>Privacy Settings</Text>
              <Text style={styles.securitySubtext}>Manage your data</Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={isSaving}>
        {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <><Save size={20} color="#fff" /><Text style={styles.saveButtonText}>Save Changes</Text></>}
      </TouchableOpacity>
      
      {/* Modals */}
      <Modal visible={showCurrencyModal} transparent={true} animationType="slide" onRequestClose={() => setShowCurrencyModal(false)}>
        <View style={styles.modalContainer}><View style={styles.modalContent}><Text style={styles.modalTitle}>Select Currency</Text><FlatList data={SUPPORTED_CURRENCIES} renderItem={renderCurrencyItem} keyExtractor={(item) => item} ItemSeparatorComponent={() => <View style={styles.separator} />} /><TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCurrencyModal(false)}><Text style={styles.modalCloseButtonText}>Cancel</Text></TouchableOpacity></View></View>
      </Modal>
      <Modal visible={showPriceRangeModal} transparent={true} animationType="slide" onRequestClose={() => setShowPriceRangeModal(false)}>
         <View style={styles.modalContainer}><View style={styles.modalContent}><Text style={styles.modalTitle}>Select Price Range</Text><FlatList data={['500K AED - 2.0M AED', '500K - 1M', '1M - 2M', '2M - 5M', '5M+']} renderItem={renderPriceRangeItem} keyExtractor={(item) => item} ItemSeparatorComponent={() => <View style={styles.separator} />} /><TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowPriceRangeModal(false)}><Text style={styles.modalCloseButtonText}>Cancel</Text></TouchableOpacity></View></View>
      </Modal>
      <Modal visible={showLanguageModal} transparent={true} animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
         <View style={styles.modalContainer}><View style={styles.modalContent}><Text style={styles.modalTitle}>Select Language</Text><FlatList data={SUPPORTED_LANGUAGES} renderItem={renderLanguageItem} keyExtractor={(item) => item} ItemSeparatorComponent={() => <View style={styles.separator} />} /><TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowLanguageModal(false)}><Text style={styles.modalCloseButtonText}>Cancel</Text></TouchableOpacity></View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.primary },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.background },
  profileName: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: Colors.textLight },
  card: { backgroundColor: Colors.background, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  headerRight: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  sectionLabel: { fontSize: 16, color: Colors.text, marginBottom: 8 },
  inputContainer: { backgroundColor: Colors.input.background, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.input.text },
  textArea: { height: 100, textAlignVertical: 'top' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  inputIcon: { marginRight: 12 },
  selectText: { fontSize: 16, color: Colors.input.text, flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switchLabel: { fontSize: 16, color: Colors.text },
  switchSubLabel: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  propertyTypesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  propertyTypeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.button.secondary, marginRight: 8, marginBottom: 8 },
  propertyTypeButtonActive: { backgroundColor: Colors.button.primary },
  propertyTypeText: { color: Colors.button.text.secondary, fontWeight: '500' },
  propertyTypeTextActive: { color: Colors.button.text.primary },
  securityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  securityIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  securityIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.textLight },
  securityTextContainer: { flex: 1 },
  securityText: { fontSize: 16, color: Colors.text },
  securitySubtext: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { fontSize: 16, color: Colors.text, marginTop: 16 },
  errorText: { fontSize: 16, color: Colors.error, marginBottom: 16 },
  loginButton: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  saveButton: { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 16, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  modalItemText: { fontSize: 16, color: Colors.text },
  separator: { height: 1, backgroundColor: Colors.border },
  modalCloseButton: { marginTop: 16, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border },
  modalCloseButtonText: { fontSize: 16, color: Colors.primary, fontWeight: '500' },
  ratingSummary: { marginBottom: 16, alignItems: 'center' },
  averageRatingText: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  reviewItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewContent: { flex: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewerName: { fontWeight: 'bold', color: Colors.text },
  reviewDate: { fontSize: 12, color: Colors.textLight },
  reviewRating: { fontSize: 14, color: Colors.warning, marginBottom: 4 },
  reviewComment: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  noReviewsText: { textAlign: 'center', color: Colors.textLight, paddingVertical: 10 },
  statusContainer: { padding: 10, backgroundColor: Colors.input.background, borderRadius: 8, alignItems: 'center' },
  statusText: { fontSize: 15, color: Colors.text, marginBottom: 8 },
  statusValue: { fontWeight: 'bold' },
  statusSubText: { fontSize: 13, color: Colors.textLight, fontStyle: 'italic', textAlign: 'center' },
  upgradeButton: { marginTop: 8, backgroundColor: Colors.warning, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  upgradeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  requestButton: { marginTop: 8, backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  requestButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
