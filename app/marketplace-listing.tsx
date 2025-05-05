import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { propertyService } from '@/services/property-service';
import { marketplaceService } from '@/services/marketplace-service';
import { Property } from '@/types/property';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { formatPrice } from '@/utils/format';

export default function MarketplaceListingPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30'); // Default 30 days
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const durations = ['7', '14', '30', '60', '90'];
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPaidMember, setIsPaidMember] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

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

    if (id) {
      loadProperty(id);
    } else {
      setLoading(false);
      Alert.alert('Error', 'No property ID provided.');
      router.back();
    }
  }, [id, user]);

  const loadProperty = async (propertyId: string) => {
    try {
      setLoading(true);
      const data = await propertyService.getProperty(propertyId);
      
      // Check if user owns this property
      if (data.userId !== user?.id) {
        Alert.alert('Error', 'You can only list properties that you own.');
        router.back();
        return;
      }
      
      setProperty(data);
      // Set initial price to property price
      setPrice(data.price.toString());
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Error', 'Failed to load property details. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (text: string) => {
    // Only allow numbers and decimal point
    const filtered = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = filtered.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts.length > 1 && parts[1].length > 2) {
      return;
    }
    
    setPrice(filtered);
  };

  const handleListProperty = async () => {
    if (!user || !property) return;

    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price.');
      return;
    }

    // Confirm listing
    Alert.alert(
      'Confirm Marketplace Listing',
      `Are you sure you want to list "${property.title}" in the marketplace for ${formatPrice(parseFloat(price), property.currency || 'AED')} for ${duration} days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'List Property', onPress: submitListing }
      ]
    );
  };

  const submitListing = async () => {
    try {
      setSubmitting(true);
      
      if (!user || !property || !id) return;
      
      await marketplaceService.listPropertyInMarketplace(
        user.id,
        id,
        parseFloat(price),
        parseInt(duration)
      );
      
      Alert.alert(
        'Property Listed',
        `Your property has been successfully listed in the marketplace for ${duration} days.`,
        [
          { text: 'View Marketplace', onPress: () => router.push('/marketplace') },
          { text: 'My Properties', onPress: () => router.push('/my-properties') }
        ]
      );
    } catch (error: any) {
      console.error('Error listing property:', error);
      Alert.alert('Listing Failed', error.message || 'Failed to list property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checkingSubscription) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {loading ? 'Loading property details...' : 'Checking subscription status...'}
        </Text>
      </View>
    );
  }

  if (!isPaidMember) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="lock-closed-outline" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Subscription Required</Text>
        <Text style={styles.errorText}>
          Only paid members can list properties in the marketplace. Please upgrade your subscription to access this feature.
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.backButton, styles.upgradeButton]} 
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.backButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>Property not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80';

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'List in Marketplace',
        }}
      />

      <View style={styles.content}>
        <View style={styles.propertyCard}>
          <Image source={{ uri: displayImage }} style={styles.propertyImage} />
          <View style={styles.propertyDetails}>
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <Text style={styles.propertyLocation}>{property.location}</Text>
            <Text style={styles.propertyPrice}>
              Current Value: {formatPrice(property.price, property.currency || 'AED')}
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Listing your property in the marketplace allows other users to purchase it.
            When sold, 50% of the sale price will be deducted as platform commission.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Marketplace Listing Price</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>{property.currency || 'AED'}</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={handlePriceChange}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.input.placeholder}
            />
          </View>
          
          <View style={styles.commissionContainer}>
            <Text style={styles.commissionLabel}>Platform Commission (50%):</Text>
            <Text style={styles.commissionValue}>
              {formatPrice(parseFloat(price || '0') * 0.5, property.currency || 'AED')}
            </Text>
          </View>
          
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>Your Earnings:</Text>
            <Text style={styles.earningsValue}>
              {formatPrice(parseFloat(price || '0') * 0.5, property.currency || 'AED')}
            </Text>
          </View>
          
          <Text style={[styles.label, { marginTop: 16 }]}>Listing Duration</Text>
          <TouchableOpacity
            style={styles.durationButton}
            onPress={() => setShowDurationDropdown(!showDurationDropdown)}
          >
            <Text style={styles.durationButtonText}>{duration} days</Text>
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>
          
          {showDurationDropdown && (
            <View style={styles.durationDropdown}>
              {durations.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.durationOption}
                  onPress={() => {
                    setDuration(d);
                    setShowDurationDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.durationOptionText,
                    duration === d && styles.durationOptionTextSelected
                  ]}>
                    {d} days
                  </Text>
                  {duration === d && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.listButton, (!price || submitting) && styles.disabledButton]}
          onPress={handleListProperty}
          disabled={!price || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.button.text.primary} />
          ) : (
            <>
              <Ionicons name="pricetag-outline" size={20} color={colors.button.text.primary} />
              <Text style={styles.listButtonText}>List in Marketplace</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By listing your property in the marketplace, you agree to our <Text 
            style={styles.linkText}
            onPress={() => router.push('terms')}
          >
            Terms of Service
          </Text> and Marketplace Guidelines.
          A 50% platform commission will be deducted from the sale price when your property is sold.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    width: '80%',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  upgradeButton: {
    backgroundColor: colors.success,
    marginLeft: 10,
  },
  backButtonText: {
    color: colors.button.text.primary,
    fontWeight: '600',
  },
  propertyCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  propertyDetails: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    backgroundColor: colors.input.background,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.input.text,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: colors.input.text,
    paddingVertical: 12,
  },
  commissionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  commissionLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  commissionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  earningsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  listButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: colors.button.disabled,
  },
  listButtonText: {
    color: colors.button.text.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  durationButton: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.input.background,
    marginBottom: 16,
  },
  durationButtonText: {
    fontSize: 16,
    color: colors.input.text,
  },
  durationDropdown: {
    marginTop: -12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    maxHeight: 200,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  durationOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  durationOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
