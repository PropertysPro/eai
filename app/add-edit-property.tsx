import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  Animated,
  Dimensions,
  Keyboard,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Camera,
  Upload,
  Info,
  X,
  ImagePlus,
  Home,
  DollarSign,
  MapPin,
  Bed,
  Bath,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Tag,
  User,
  Lock,
} from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import usePropertyStore from '@/store/property-store';
import { Property, PropertyType } from '@/types/property';
import AnimatedBubble from '@/components/AnimatedBubble';
import { useAuth } from '@/context/auth-context';
import { marketplaceService } from '@/services/marketplace-service';
import { SupportedCurrency, useCurrencyStore } from '@/store/currency-store'; // Import SupportedCurrency

// Constants
const propertyTypes: PropertyType[] = [
  'apartment',
  'villa',
  'townhouse',
  'penthouse',
  'duplex',
  'studio',
  'office',
  'retail',
  'land',
  'warehouse',
];

const areaUnits = ['sqft', 'sqm'];
const MAX_IMAGES = 10;
const SCREEN_WIDTH = Dimensions.get('window').width;
const FORM_SECTIONS = ['Basic Info', 'Details', 'Features', 'Images'];

export default function AddEditPropertyScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { properties, addProperty, updateProperty, error: propertyError } = usePropertyStore();
  
  // Animation refs
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showDistressedInfo, setShowDistressedInfo] = useState(false);
  const [bubbleActive, setBubbleActive] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showAreaUnitDropdown, setShowAreaUnitDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isPaidMember, setIsPaidMember] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  
  // Find the property if editing
  const existingProperty = id
    ? properties.find((p: Property) => p.id === id)
    : null;

  // City state
  const [city, setCity] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cities = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Umm Al Quwain'];
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState('0');
  const [bathrooms, setBathrooms] = useState('0');
  const [area, setArea] = useState('');
  const [area_unit, setAreaUnit] = useState<'sqft' | 'sqm'>('sqft');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [listingType, setListingType] = useState<'sale' | 'rent'>('sale');
  const [showListingTypeDropdown, setShowListingTypeDropdown] = useState(false);
  const listingTypes: ('sale' | 'rent')[] = ['sale', 'rent'];
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [isDistressed, setIsDistressed] = useState(false);
  const [distressReason, setDistressReason] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showBedroomsDropdown, setShowBedroomsDropdown] = useState(false);
  const [showBathroomsDropdown, setShowBathroomsDropdown] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  
  // Marketplace listing state
  const [listInMarketplace, setListInMarketplace] = useState(false);
  const [marketplacePrice, setMarketplacePrice] = useState('');
  const [marketplaceDuration, setMarketplaceDuration] = useState('30'); // Default 30 days
  const [showMarketplaceDurationDropdown, setShowMarketplaceDurationDropdown] = useState(false);
  const marketplaceDurations = ['7', '14', '30', '60', '90'];
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  // Distressed property state
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low'>('high');
  const [showUrgencyDropdown, setShowUrgencyDropdown] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [potentialROI, setPotentialROI] = useState('');
  const [marketTrend, setMarketTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [showMarketTrendDropdown, setShowMarketTrendDropdown] = useState(false);
  // New state for construction and market status
  const [construction_status, setConstructionStatus] = useState<'ready' | 'off_plan'>('ready');
  const [market_status, setMarketStatus] = useState<'new_to_market' | 'resale'>('resale');
  const [showConstructionStatusDropdown, setShowConstructionStatusDropdown] = useState(false);
  const [showMarketStatusDropdown, setShowMarketStatusDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Effect to populate form when existingProperty is available
  useEffect(() => {
    if (existingProperty) {
      setTitle(existingProperty.title || '');
      setDescription(existingProperty.description || '');
      setPrice(existingProperty.price?.toString() || '');
      setLocation(existingProperty.location || '');
      setCity(existingProperty.location?.split(',')[0]?.trim() || '');
      setBedrooms(existingProperty.bedrooms?.toString() || '0');
      setBathrooms(existingProperty.bathrooms?.toString() || '0');
      setArea(existingProperty.area?.toString() || '');
      setAreaUnit(existingProperty.area_unit || 'sqft');
      setPropertyType(existingProperty.type || 'apartment');
      setListingType(existingProperty.listingType || 'sale');
      setFeatures(existingProperty.features || []);
      setIsNegotiable(existingProperty.isNegotiable || false);
      setIsDistressed(existingProperty.isDistressed || false);
      setDistressReason(existingProperty.distressReason || '');
      setOriginalPrice(existingProperty.originalPrice?.toString() || '');
      setDiscountPercentage(existingProperty.discountPercentage?.toString() || '');
      setImages(existingProperty.images || []);
      setOwnerName(existingProperty.ownerName || '');
      setListInMarketplace(existingProperty.isInMarketplace || false);
      setMarketplacePrice(existingProperty.marketplacePrice?.toString() || '');
      setMarketplaceDuration(existingProperty.marketplaceDuration?.toString() || '30');
      setUrgency(existingProperty.urgency || 'high');
      setEstimatedValue(existingProperty.estimatedValue?.toString() || '');
      setPotentialROI(existingProperty.potentialROI?.toString() || '');
      setMarketTrend(existingProperty.marketTrend || 'stable');
      // Populate new status fields
      setConstructionStatus(existingProperty.construction_status || 'ready');
      setMarketStatus(existingProperty.market_status || 'resale');
    }
  }, [existingProperty]);

  // Animation and keyboard effects
  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Check subscription status
  useEffect(() => {
    if (user) {
      const checkSubscription = async () => {
        try {
          setCheckingSubscription(true);
          const isPaid = await marketplaceService.isPaidMember(user.id);
          setIsPaidMember(isPaid);
        } catch (error) {
          console.error('Error checking subscription:', error);
        } finally {
          setCheckingSubscription(false);
        }
      };
      
      checkSubscription();
    }
  }, [user]);

  // Request permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Please grant camera and media library permissions to add images.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

  // Calculate form progress
  useEffect(() => {
    const requiredFields = ['title', 'description', 'price', 'location', 'area'];
    const totalFields = requiredFields.length + (images.length > 0 ? 1 : 0);
    
    let filledFields = 0;
    requiredFields.forEach(field => {
      // @ts-ignore
      if (eval(field) && eval(field).toString().trim() !== '') {
        filledFields++;
      }
    });
    
    if (images.length > 0) filledFields++;
    
    const progress = Math.min(Math.round((filledFields / totalFields) * 100), 100);
    setFormProgress(progress);
  }, [title, description, price, location, area, images]);

  // Field validation
  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'title':
        if (!value.trim()) error = 'Title is required';
        break;
      case 'description':
        if (!value.trim()) error = 'Description is required';
        break;
      case 'price':
        if (!value.trim() || isNaN(Number(value)) || Number(value) <= 0) {
          error = 'Valid price is required';
        }
        break;
      case 'location':
        if (!value.trim()) error = 'Location is required';
        break;
      case 'area':
        if (!value.trim() || isNaN(Number(value)) || Number(value) <= 0) {
          error = 'Valid area is required';
        }
        break;
      case 'marketplacePrice':
        if (listInMarketplace && (!value.trim() || isNaN(Number(value)) || Number(value) <= 0)) {
          error = 'Valid marketplace price is required';
        }
        break;
      case 'distressReason':
        if (isDistressed && !value.trim()) {
          error = 'Reason is required for distressed properties';
        }
        break;
      case 'originalPrice':
        if (isDistressed && (!value.trim() || isNaN(Number(value)) || Number(value) <= 0)) {
          error = 'Valid original price is required';
        }
        break;
      case 'discountPercentage':
        if (isDistressed && (!value.trim() || isNaN(Number(value)) || Number(value) <= 0 || Number(value) >= 100)) {
          error = 'Valid discount percentage is required (0-100)';
        }
        break;
    }
    
    return error;
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const fields = [
      { name: 'title', value: title },
      { name: 'description', value: description },
      { name: 'price', value: price },
      { name: 'location', value: location },
      { name: 'area', value: area },
    ];
    
    // Add marketplace price validation if listing in marketplace
    if (listInMarketplace) {
      fields.push({ name: 'marketplacePrice', value: marketplacePrice });
    }
    
    // Validate all fields
    fields.forEach(field => {
      const error = validateField(field.name, field.value);
      if (error) newErrors[field.name] = error;
    });
    
    // Additional validations
    if (!area_unit) {
      newErrors.area_unit = 'Area unit is required';
    }
    
    if (!listingType) {
      newErrors.listingType = 'Listing type is required';
    }
    
    if (isDistressed) {
      if (!distressReason.trim()) {
        newErrors.distressReason = 'Reason is required for distressed properties';
      }
      if (!originalPrice.trim() || isNaN(Number(originalPrice)) || Number(originalPrice) <= 0) {
        newErrors.originalPrice = 'Valid original price is required';
      }
      if (!discountPercentage.trim() || isNaN(Number(discountPercentage)) || Number(discountPercentage) <= 0 || Number(discountPercentage) >= 100) {
        newErrors.discountPercentage = 'Valid discount percentage is required (0-100)';
      }
    }
    
    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }
    
    setErrors(newErrors);
    setTouchedFields(fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {}));
    
    return Object.keys(newErrors).length === 0;
  };

  // Navigation between form sections
  const navigateToSection = (index: number) => {
    setActiveSection(index);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Feature management
  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      const updatedFeatures = [...features, newFeature.trim()];
      setFeatures(updatedFeatures);
      setNewFeature('');
      
      // Animate the bubble
      setBubbleActive(true);
      setTimeout(() => setBubbleActive(false), 1000);
    }
  };
  
  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Image handling
  const handleAddImage = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(
        "Maximum Images Reached",
        `You can only upload up to ${MAX_IMAGES} images per property.`
      );
      return;
    }
    
    setShowImageOptions(true);
  };

  const takePhoto = async () => {
    try {
      if (images.length >= MAX_IMAGES) {
        Alert.alert(
          "Maximum Images Reached",
          `You can only upload up to ${MAX_IMAGES} images per property.`
        );
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0].uri]);
        setBubbleActive(true);
        setTimeout(() => setBubbleActive(false), 1000);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const pickImage = async () => {
    try {
      if (images.length >= MAX_IMAGES) {
        Alert.alert(
          "Maximum Images Reached",
          `You can only upload up to ${MAX_IMAGES} images per property.`
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - images.length,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        const combinedImages = [...images, ...newImages];
        
        // Ensure we don't exceed the maximum
        if (combinedImages.length > MAX_IMAGES) {
          const allowedNewImages = newImages.slice(0, MAX_IMAGES - images.length);
          setImages([...images, ...allowedNewImages]);
          Alert.alert(
            "Maximum Images Reached",
            `Only ${allowedNewImages.length} images were added to reach the limit of ${MAX_IMAGES}.`
          );
        } else {
          setImages(combinedImages);
        }
        
        setBubbleActive(true);
        setTimeout(() => setBubbleActive(false), 1000);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images. Please try again.");
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (!user) {
        Alert.alert('Error', 'Please sign in to continue');
        return;
      }

      const propertyData = {
        title,
        description,
        price: parseFloat(price),
        location,
        city,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        area: parseFloat(area),
        area_unit,
        type: propertyType,
        listingType,
        features,
        images,
        userId: user.id,
        ownerName,
        isDistressed: isDistressed,
        distressReason: isDistressed ? distressReason : undefined,
        originalPrice: isDistressed ? parseFloat(originalPrice) : undefined,
        discountPercentage: isDistressed ? parseFloat(discountPercentage) : undefined,
        urgency: isDistressed ? urgency : undefined,
        estimatedValue: isDistressed ? parseFloat(estimatedValue) : undefined,
        potentialROI: isDistressed ? parseFloat(potentialROI) : undefined,
        marketTrend: isDistressed ? marketTrend : undefined,
        isNegotiable: isNegotiable,
        // Add new status fields to saved data
        construction_status: construction_status,
        market_status: market_status,
        currency: useCurrencyStore.getState().currentCurrency,
        status: 'available' as Property['status'],
        created_at: existingProperty?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isInMarketplace: listInMarketplace,
        marketplacePrice: listInMarketplace && marketplacePrice ? parseFloat(marketplacePrice) : undefined,
        marketplaceDuration: listInMarketplace ? parseInt(marketplaceDuration) : undefined,
        marketplaceListingDate: listInMarketplace ? new Date().toISOString() : undefined,
      };

      if (existingProperty) {
        // Update existing property
        await updateProperty(existingProperty.id, propertyData);
        if (propertyError) {
          Alert.alert('Error', propertyError || 'Failed to update property. Please try again.');
          setIsLoading(false);
          return;
        }
        Alert.alert('Success', 'Property updated successfully');
      } else {
        // Add new property
        await addProperty(propertyData);
        if (propertyError) {
          Alert.alert('Error', propertyError || 'Failed to add property. Please try again.');
          setIsLoading(false);
          return;
        }
        Alert.alert('Success', 'Property added successfully');
      }
      
      handleGoBack();
    } catch (error) {
      console.error('Error saving property:', error);
      Alert.alert('Error', 'Failed to save property. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Robust go-back handler
  const handleGoBack = () => {
    // @ts-ignore: navigation may not always have canGoBack, but in expo-router it does
    if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/'); // fallback to home or your main screen
    }
  };
  
  const handleAreaUnitChange = (unit: 'sqft' | 'sqm') => {
    setAreaUnit(unit);
    setShowAreaUnitDropdown(false);
  };

  // Close all dropdowns when clicking outside
  const closeAllDropdowns = () => {
    setShowCityDropdown(false);
    setShowTypeDropdown(false);
    setShowListingTypeDropdown(false);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowAreaUnitDropdown(false);
    setShowUrgencyDropdown(false);
    setShowMarketTrendDropdown(false);
    setShowMarketplaceDurationDropdown(false);
    setShowConstructionStatusDropdown(false); // Close new dropdowns
    setShowMarketStatusDropdown(false); // Close new dropdowns
  };
  
  // Render form sections
  const renderBasicInfoSection = () => (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Home size={18} color={Colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Basic Information</Text>
      </View>

      {/* Listing Type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Listing Type</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, errors.listingType && styles.inputError]}
          onPress={() => {
            closeAllDropdowns();
            setShowListingTypeDropdown(!showListingTypeDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>{listingType}</Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        {showListingTypeDropdown && (
          <View style={styles.dropdownMenu}> 
            {listingTypes.map((type) => (
              <TouchableOpacity 
                key={type} 
                style={styles.dropdownItem}
                onPress={() => { 
                  setListingType(type); 
                  setShowListingTypeDropdown(false); 
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  listingType === type && styles.dropdownItemTextSelected
                ]}>
                  {type}
                </Text>
                {listingType === type && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.listingType && (
          <Text style={styles.errorText}>{errors.listingType}</Text>
        )}
      </View>

      {/* Property Type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Property Type</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            closeAllDropdowns();
            setShowTypeDropdown(!showTypeDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>{propertyType}</Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        {showTypeDropdown && (
          <View style={styles.dropdownMenu}> 
            {propertyTypes.map((type) => (
              <TouchableOpacity 
                key={type} 
                style={styles.dropdownItem}
                onPress={() => { 
                  setPropertyType(type); 
                  setShowTypeDropdown(false); 
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  propertyType === type && styles.dropdownItemTextSelected
                ]}>
                  {type}
                </Text>
                {propertyType === type && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Construction Status */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Construction Status</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            closeAllDropdowns();
            setShowConstructionStatusDropdown(!showConstructionStatusDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>{construction_status === 'ready' ? 'Ready' : 'Off Plan'}</Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        {showConstructionStatusDropdown && (
          <View style={styles.dropdownMenu}>
            {(['ready', 'off_plan'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.dropdownItem}
                onPress={() => {
                  setConstructionStatus(status);
                  setShowConstructionStatusDropdown(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  construction_status === status && styles.dropdownItemTextSelected
                ]}>
                  {status === 'ready' ? 'Ready' : 'Off Plan'}
                </Text>
                {construction_status === status && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Market Status */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Market Status</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            closeAllDropdowns();
            setShowMarketStatusDropdown(!showMarketStatusDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>{market_status === 'new_to_market' ? 'New to Market' : 'Resale'}</Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        {showMarketStatusDropdown && (
          <View style={styles.dropdownMenu}>
            {(['new_to_market', 'resale'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.dropdownItem}
                onPress={() => {
                  setMarketStatus(status);
                  setShowMarketStatusDropdown(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  market_status === status && styles.dropdownItemTextSelected
                ]}>
                  {status === 'new_to_market' ? 'New to Market' : 'Resale'}
                </Text>
                {market_status === status && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Title */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={[
            styles.input, 
            errors.title && touchedFields.title && styles.inputError,
            touchedFields.title && !errors.title && styles.inputSuccess
          ]}
          value={title}
          onChangeText={setTitle}
          onBlur={() => handleFieldBlur('title', title)}
          placeholder="Enter property title"
          placeholderTextColor={Colors.textLight}
        />
        {errors.title && touchedFields.title && (
          <Text style={styles.errorText}>{errors.title}</Text>
        )}
      </View>

      {/* Description */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[
            styles.textArea, 
            errors.description && touchedFields.description && styles.inputError,
            touchedFields.description && !errors.description && styles.inputSuccess
          ]}
          value={description}
          onChangeText={setDescription}
          onBlur={() => handleFieldBlur('description', description)}
          placeholder="Describe the property"
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={4}
        />
        {errors.description && touchedFields.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
      </View>

      {/* Price */}
      <View style={styles.formGroup}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Price</Text>
        </View>
        <TextInput
          style={[
            styles.input, 
            errors.price && touchedFields.price && styles.inputError,
            touchedFields.price && !errors.price && styles.inputSuccess
          ]}
          value={price}
          onChangeText={setPrice}
          onBlur={() => handleFieldBlur('price', price)}
          placeholder="Enter price"
          placeholderTextColor={Colors.textLight}
          keyboardType="numeric"
        />
        {errors.price && touchedFields.price && (
          <Text style={styles.errorText}>{errors.price}</Text>
        )}
      </View>

      {/* Currency */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Currency</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            closeAllDropdowns();
            setShowCurrencyDropdown(!showCurrencyDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>{useCurrencyStore.getState().currentCurrency}</Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        {showCurrencyDropdown && (
          <View style={styles.dropdownMenu}>
            {(['AED', 'USD', 'EUR', 'GBP', 'INR'] as const).map((currency) => (
              <TouchableOpacity
                key={currency}
                style={styles.dropdownItem}
                onPress={() => {
                  useCurrencyStore.getState().setCurrency(currency);
                  setShowCurrencyDropdown(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  useCurrencyStore.getState().currentCurrency === currency && styles.dropdownItemTextSelected
                ]}>
                  {currency}
                </Text>
                {useCurrencyStore.getState().currentCurrency === currency && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderDetailsSection = () => (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <MapPin size={18} color={Colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Property Details</Text>
      </View>

      {/* Location */}
      <View style={styles.formGroup}>
        <View style={styles.labelContainer}>
          <MapPin size={16} color={Colors.primary} style={styles.labelIcon} />
          <Text style={styles.label}>Location</Text>
        </View>
        <TextInput
          style={[
            styles.input, 
            errors.location && touchedFields.location && styles.inputError,
            touchedFields.location && !errors.location && styles.inputSuccess
          ]}
          value={location}
          onChangeText={setLocation}
          onBlur={() => handleFieldBlur('location', location)}
          placeholder="Enter location"
          placeholderTextColor={Colors.textLight}
        />
        {errors.location && touchedFields.location && (
          <Text style={styles.errorText}>{errors.location}</Text>
        )}
      </View>

      {/* City */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>City</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            closeAllDropdowns();
            setShowCityDropdown(!showCityDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>{city || 'Select city'}</Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        {showCityDropdown && (
          <View style={styles.dropdownMenu}>
            {cities.map((cityOption) => (
              <TouchableOpacity 
                key={cityOption} 
                style={styles.dropdownItem}
                onPress={() => { 
                  setCity(cityOption); 
                  setShowCityDropdown(false); 
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  city === cityOption && styles.dropdownItemTextSelected
                ]}>
                  {cityOption}
                </Text>
                {city === cityOption && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Bedrooms */}
      <View style={styles.formGroup}>
        <View style={styles.labelContainer}>
          <Bed size={16} color={Colors.primary} style={styles.labelIcon} />
          <Text style={styles.label}>Bedrooms</Text>
        </View>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            closeAllDropdowns();
            setShowBedroomsDropdown(!showBedroomsDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>{bedrooms}</Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        {showBedroomsDropdown && (
          <View style={styles.dropdownMenu}> 
            {[...Array(8).keys()].map(i => (
              <TouchableOpacity 
                key={i} 
                style={styles.dropdownItem}
                onPress={() => { 
                  setBedrooms(i === 7 ? '7+' : i.toString()); 
                  setShowBedroomsDropdown(false); 
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  bedrooms === (i === 7 ? '7+' : i.toString()) && styles.dropdownItemTextSelected
                ]}>
                  {i === 7 ? '7+' : i}
                </Text>
                {bedrooms === (i === 7 ? '7+' : i.toString()) && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Bathrooms */}
      <View style={styles.formGroup}>
        <View style={styles.labelContainer}>
          <Bath size={16} color={Colors.primary} style={styles.labelIcon} />
          <Text style={styles.label}>Bathrooms</Text>
        </View>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            closeAllDropdowns();
            setShowBathroomsDropdown(!showBathroomsDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>{bathrooms}</Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        {showBathroomsDropdown && (
          <View style={styles.dropdownMenu}> 
            {[...Array(8).keys()].map(i => (
              <TouchableOpacity 
                key={i} 
                style={styles.dropdownItem}
                onPress={() => { 
                  setBathrooms(i === 7 ? '7+' : i.toString()); 
                  setShowBathroomsDropdown(false); 
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  bathrooms === (i === 7 ? '7+' : i.toString()) && styles.dropdownItemTextSelected
                ]}>
                  {i === 7 ? '7+' : i}
                </Text>
                {bathrooms === (i === 7 ? '7+' : i.toString()) && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderFeaturesSection = () => (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Tag size={18} color={Colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Features & Options</Text>
      </View>

      {/* Area */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Area</Text>
        <View style={styles.areaInputContainer}>
          <TextInput
            style={[
              styles.areaInput, 
              errors.area && touchedFields.area && styles.inputError,
              touchedFields.area && !errors.area && styles.inputSuccess
            ]}
            value={area}
            onChangeText={setArea}
            onBlur={() => handleFieldBlur('area', area)}
            placeholder="Enter area"
            placeholderTextColor={Colors.textLight}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.areaUnitButton}
            onPress={() => {
              closeAllDropdowns();
              setShowAreaUnitDropdown(!showAreaUnitDropdown);
            }}
          >
            <Text style={styles.areaUnitButtonText}>{area_unit}</Text>
            <ChevronDown size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
        {showAreaUnitDropdown && (
          <View style={styles.dropdownMenu}> 
            {areaUnits.map((unit) => (
              <TouchableOpacity 
                key={unit} 
                style={styles.dropdownItem}
                onPress={() => handleAreaUnitChange(unit as 'sqft' | 'sqm')}
              >
                <Text style={[
                  styles.dropdownItemText,
                  area_unit === unit && styles.dropdownItemTextSelected
                ]}>
                  {unit}
                </Text>
                {area_unit === unit && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.area && touchedFields.area && (
          <Text style={styles.errorText}>{errors.area}</Text>
        )}
      </View>

      {/* Features */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Features</Text>
        <View style={styles.featureInputContainer}>
          <TextInput
            style={styles.featureInput}
            value={newFeature}
            onChangeText={setNewFeature}
            placeholder="Add a feature"
            placeholderTextColor={Colors.textLight}
          />
          <TouchableOpacity
            style={styles.addFeatureButton}
            onPress={handleAddFeature}
          >
            <Plus size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>
        
        {features.length > 0 && (
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureText}>{feature}</Text>
                <TouchableOpacity
                  style={styles.removeFeatureButton}
                  onPress={() => handleRemoveFeature(index)}
                >
                  <X size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>


      {/* Negotiable */}
      <View style={styles.formGroup}>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Price is negotiable</Text>
          <Switch
            value={isNegotiable}
            onValueChange={setIsNegotiable}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={isNegotiable ? Colors.primary : Colors.textLight}
          />
        </View>
      </View>

      {/* Marketplace Listing */}
      <View style={styles.formGroup}>
        <View style={styles.distressedHeaderContainer}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>List in Marketplace</Text>
            <Switch
              value={listInMarketplace}
              onValueChange={(value) => {
                if (!isPaidMember && value) {
                  Alert.alert(
                    "Subscription Required",
                    "Only paid members can list properties in the marketplace. Please upgrade your subscription to access this feature.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Upgrade Now", onPress: () => router.push('/subscription') }
                    ]
                  );
                  return;
                }
                setListInMarketplace(value);
              }}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={listInMarketplace ? Colors.primary : Colors.textLight}
              disabled={!isPaidMember}
            />
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => Alert.alert(
              "Marketplace Listing",
              "Listing your property in the marketplace allows other users to purchase it. When sold, 50% of the sale price will be deducted as platform commission."
            )}
          >
            <Info size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        {!isPaidMember && (
          <View style={styles.subscriptionRequiredContainer}>
            <Lock size={16} color={Colors.error} />
            <Text style={styles.subscriptionRequiredText}>
              Subscription required to list in marketplace
            </Text>
            <TouchableOpacity onPress={() => router.push('/subscription')}>
              <Text style={styles.upgradeLink}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {listInMarketplace && (
          <View style={styles.distressedContainer}>
            {/* Marketplace Price */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Marketplace Price (AED)</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.marketplacePrice && touchedFields.marketplacePrice && styles.inputError,
                  touchedFields.marketplacePrice && !errors.marketplacePrice && styles.inputSuccess
                ]}
                value={marketplacePrice}
                onChangeText={setMarketplacePrice}
                onBlur={() => handleFieldBlur('marketplacePrice', marketplacePrice)}
                placeholder="Enter marketplace price"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
              {errors.marketplacePrice && touchedFields.marketplacePrice && (
                <Text style={styles.errorText}>{errors.marketplacePrice}</Text>
              )}
              {marketplacePrice && !errors.marketplacePrice && (
                <View style={styles.commissionContainer}>
                  <Text style={styles.commissionLabel}>Platform Commission (50%):</Text>
                  <Text style={styles.commissionValue}>
                    AED {(parseFloat(marketplacePrice || '0') * 0.5).toFixed(2)}
                  </Text>
                </View>
              )}
              {marketplacePrice && !errors.marketplacePrice && (
                <View style={styles.earningsContainer}>
                  <Text style={styles.earningsLabel}>Your Earnings:</Text>
                  <Text style={styles.earningsValue}>
                    AED {(parseFloat(marketplacePrice || '0') * 0.5).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Listing Duration */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Listing Duration (Days)</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  closeAllDropdowns();
                  setShowMarketplaceDurationDropdown(!showMarketplaceDurationDropdown);
                }}
              >
                <Text style={styles.dropdownButtonText}>{marketplaceDuration}</Text>
                <ChevronDown size={20} color={Colors.text} />
              </TouchableOpacity>
              {showMarketplaceDurationDropdown && (
                <View style={styles.dropdownMenu}> 
                  {marketplaceDurations.map((duration) => (
                    <TouchableOpacity 
                      key={duration} 
                      style={styles.dropdownItem}
                      onPress={() => { 
                        setMarketplaceDuration(duration); 
                        setShowMarketplaceDurationDropdown(false); 
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        marketplaceDuration === duration && styles.dropdownItemTextSelected
                      ]}>
                        {duration} days
                      </Text>
                      {marketplaceDuration === duration && (
                        <CheckCircle size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Distressed Property */}
      <View style={styles.formGroup}>
        <View style={styles.distressedHeaderContainer}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Distressed Property</Text>
            <Switch
              value={isDistressed}
              onValueChange={setIsDistressed}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={isDistressed ? Colors.primary : Colors.textLight}
            />
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowDistressedInfo(true)}
          >
            <Info size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        {isDistressed && (
          <View style={styles.distressedContainer}>
            {/* Distress Reason */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Reason for Distress</Text>
              <TextInput
                style={[
                  styles.textArea, 
                  errors.distressReason && touchedFields.distressReason && styles.inputError
                ]}
                value={distressReason}
                onChangeText={setDistressReason}
                onBlur={() => handleFieldBlur('distressReason', distressReason)}
                placeholder="Explain why this is a distressed property"
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
              />
              {errors.distressReason && touchedFields.distressReason && (
                <Text style={styles.errorText}>{errors.distressReason}</Text>
              )}
            </View>
            
            {/* Original Price */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Original Price (AED)</Text>
              <TextInput
                style={[
                  styles.input, 
                  errors.originalPrice && touchedFields.originalPrice && styles.inputError
                ]}
                value={originalPrice}
                onChangeText={setOriginalPrice}
                onBlur={() => handleFieldBlur('originalPrice', originalPrice)}
                placeholder="Enter original price"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
              {errors.originalPrice && touchedFields.originalPrice && (
                <Text style={styles.errorText}>{errors.originalPrice}</Text>
              )}
            </View>
            
            {/* Discount Percentage */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Discount Percentage (%)</Text>
              <TextInput
                style={[
                  styles.input, 
                  errors.discountPercentage && touchedFields.discountPercentage && styles.inputError
                ]}
                value={discountPercentage}
                onChangeText={setDiscountPercentage}
                onBlur={() => handleFieldBlur('discountPercentage', discountPercentage)}
                placeholder="Enter discount percentage"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
              {errors.discountPercentage && touchedFields.discountPercentage && (
                <Text style={styles.errorText}>{errors.discountPercentage}</Text>
              )}
            </View>
            
            {/* Urgency */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Urgency Level</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  closeAllDropdowns();
                  setShowUrgencyDropdown(!showUrgencyDropdown);
                }}
              >
                <Text style={styles.dropdownButtonText}>{urgency}</Text>
                <ChevronDown size={20} color={Colors.text} />
              </TouchableOpacity>
              {showUrgencyDropdown && (
                <View style={styles.dropdownMenu}> 
                  {['high', 'medium', 'low'].map((level) => (
                    <TouchableOpacity 
                      key={level} 
                      style={styles.dropdownItem}
                      onPress={() => { 
                        setUrgency(level as 'high' | 'medium' | 'low'); 
                        setShowUrgencyDropdown(false); 
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        urgency === level && styles.dropdownItemTextSelected
                      ]}>
                        {level}
                      </Text>
                      {urgency === level && (
                        <CheckCircle size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Estimated Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimated Market Value (AED)</Text>
              <TextInput
                style={styles.input}
                value={estimatedValue}
                onChangeText={setEstimatedValue}
                placeholder="Enter estimated value"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </View>
            
            {/* Potential ROI */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Potential ROI (%)</Text>
              <TextInput
                style={styles.input}
                value={potentialROI}
                onChangeText={setPotentialROI}
                placeholder="Enter potential ROI"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </View>
            
            {/* Market Trend */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Market Trend</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  closeAllDropdowns();
                  setShowMarketTrendDropdown(!showMarketTrendDropdown);
                }}
              >
                <Text style={styles.dropdownButtonText}>{marketTrend}</Text>
                <ChevronDown size={20} color={Colors.text} />
              </TouchableOpacity>
              {showMarketTrendDropdown && (
                <View style={styles.dropdownMenu}> 
                  {['up', 'down', 'stable'].map((trend) => (
                    <TouchableOpacity 
                      key={trend} 
                      style={styles.dropdownItem}
                      onPress={() => { 
                        setMarketTrend(trend as 'up' | 'down' | 'stable'); 
                        setShowMarketTrendDropdown(false); 
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        marketTrend === trend && styles.dropdownItemTextSelected
                      ]}>
                        {trend}
                      </Text>
                      {marketTrend === trend && (
                        <CheckCircle size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderImagesSection = () => (
    <Animated.View 
      style={[
        styles.sectionContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <ImagePlus size={18} color={Colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Property Images</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Upload Images ({images.length}/{MAX_IMAGES})</Text>
        
        {errors.images && (
          <Text style={styles.errorText}>{errors.images}</Text>
        )}
        
        <View style={styles.imagesContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.propertyImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleRemoveImage(index)}
              >
                <Trash2 size={16} color={Colors.background} />
              </TouchableOpacity>
            </View>
          ))}
          
          {images.length < MAX_IMAGES && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleAddImage}
            >
              <Plus size={24} color={Colors.primary} />
              <Text style={styles.addImageText}>Add Image</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Currency */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Currency</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            closeAllDropdowns();
            setShowCurrencyDropdown(!showCurrencyDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>{useCurrencyStore.getState().currentCurrency}</Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        {showCurrencyDropdown && (
          <View style={styles.dropdownMenu}>
            {(['AED', 'USD', 'EUR', 'GBP', 'INR'] as const).map((currency) => (
              <TouchableOpacity
                key={currency}
                style={styles.dropdownItem}
                onPress={() => {
                  useCurrencyStore.getState().setCurrency(currency);
                  setShowCurrencyDropdown(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  useCurrencyStore.getState().currentCurrency === currency && styles.dropdownItemTextSelected
                ]}>
                  {currency}
                </Text>
                {useCurrencyStore.getState().currentCurrency === currency && (
                  <CheckCircle size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingProperty ? 'Edit Property' : 'Add New Property'}
        </Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${formProgress}%` }]} />
        </View>
      </View>
      
      {/* Section Navigation */}
      <View style={styles.sectionNav}>
        {FORM_SECTIONS.map((section, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.sectionTab,
              activeSection === index && styles.activeSectionTab
            ]}
            onPress={() => navigateToSection(index)}
          >
            <Text style={[
              styles.sectionTabText,
              activeSection === index && styles.activeSectionTabText
            ]}>
              {section}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Form Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {activeSection === 0 && renderBasicInfoSection()}
          {activeSection === 1 && renderDetailsSection()}
          {activeSection === 2 && renderFeaturesSection()}
          {activeSection === 3 && renderImagesSection()}
          
          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {existingProperty ? 'Update Property' : 'Add Property'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowImageOptions(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Images</Text>
              <TouchableOpacity
                onPress={() => setShowImageOptions(false)}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowImageOptions(false);
                takePhoto();
              }}
            >
              <Camera size={24} color={Colors.primary} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowImageOptions(false);
                pickImage();
              }}
            >
              <Upload size={24} color={Colors.primary} />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      
      {/* Distressed Info Modal */}
      <Modal
        visible={showDistressedInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDistressedInfo(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDistressedInfo(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Distressed Property</Text>
              <TouchableOpacity
                onPress={() => setShowDistressedInfo(false)}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalText}>
              A distressed property is one that is under foreclosure or being sold under duress. 
              These properties are often sold below market value, presenting potential investment opportunities.
            </Text>
            
            <Text style={styles.modalSubtitle}>Why mark as distressed?</Text>
            <Text style={styles.modalText}>
              - Attracts investors looking for deals{'\n'}
              - Highlights urgency to potential buyers{'\n'}
              - Provides context for below-market pricing
            </Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowDistressedInfo(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      
      {/* Animated Bubble */}
      {bubbleActive && (
        <View style={{
          position: 'absolute',
          top: 100,
          right: 20,
          width: 60,
          height: 60,
        }}>
          <AnimatedBubble 
            isActive={bubbleActive}
            size={60}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginRight: 40, // To offset the back button and center the title
  },
  progressContainer: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sectionNav: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSectionTab: {
    borderBottomColor: Colors.primary,
  },
  sectionTabText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  activeSectionTabText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  sectionContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputSuccess: {
    borderColor: Colors.success,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginTop: 4,
  },
  dropdownButton: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.background,
    maxHeight: 200,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  areaInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  areaUnitButton: {
    height: 48,
    width: 80,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 0,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
  },
  areaUnitButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  featureInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  addFeatureButton: {
    height: 48,
    width: 48,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  removeFeatureButton: {
    padding: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distressedHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoButton: {
    padding: 4,
  },
  distressedContainer: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageContainer: {
    width: (SCREEN_WIDTH - 64) / 3,
    height: (SCREEN_WIDTH - 64) / 3,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: (SCREEN_WIDTH - 64) / 3,
    height: (SCREEN_WIDTH - 64) / 3,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  addImageText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 16,
  },
  modalText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  commissionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  commissionLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  commissionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  subscriptionRequiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  subscriptionRequiredText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    marginLeft: 8,
  },
  upgradeLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
    textDecorationLine: 'underline',
  }
});
