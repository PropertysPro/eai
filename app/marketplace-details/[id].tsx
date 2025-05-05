import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { marketplaceService } from '@/services/marketplace-service';
import { walletService } from '@/services/wallet-service';
import { Property } from '@/types/property';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { formatPrice } from '@/utils/format';

export default function MarketplaceDetailsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isPaidMember, setIsPaidMember] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadMarketplaceListing(id);
    }
    if (user) {
      checkWalletBalance();
      checkMembershipStatus();
    }
  }, [id, user]);

  const checkWalletBalance = async () => {
    try {
      if (!user) return;
      const wallet = await walletService.getWallet(user.id);
      setWalletBalance(wallet.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const checkMembershipStatus = async () => {
    try {
      if (!user) return;
      const isPaid = await marketplaceService.isPaidMember(user.id);
      setIsPaidMember(isPaid);
    } catch (error) {
      console.error('Error checking membership status:', error);
    }
  };

  const loadMarketplaceListing = async (listingId: string) => {
    try {
      setLoading(true);
      const data = await marketplaceService.getMarketplaceListing(listingId);
      setProperty(data);
    } catch (error) {
      console.error('Error loading marketplace listing:', error);
      Alert.alert('Error', 'Failed to load listing details. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to purchase this listing.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/login') }
      ]);
      return;
    }

    if (!isPaidMember) {
      Alert.alert('Membership Required', 'Only paid members can purchase listings. Would you like to upgrade your membership?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/subscription') }
      ]);
      return;
    }

    if (!property) return;

    if (property.marketplacePrice && walletBalance < property.marketplacePrice) {
      Alert.alert('Insufficient Balance', 'Your wallet balance is insufficient to purchase this listing. Would you like to add funds?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Funds', onPress: () => router.push('/wallet/deposit') }
      ]);
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Are you sure you want to purchase this listing for ${formatPrice(property.marketplacePrice || 0, property.currency || 'AED')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Purchase', onPress: confirmPurchase }
      ]
    );
  };

  const confirmPurchase = async () => {
    if (!property || !user) return;

    try {
      setPurchaseLoading(true);
      const transactionId = await marketplaceService.purchaseMarketplaceListing(user.id, property.id);
      
      // Refresh wallet balance
      await checkWalletBalance();
      
      Alert.alert(
        'Purchase Successful',
        'You have successfully purchased this listing. It has been added to your properties.',
        [
          { text: 'View Transaction', onPress: () => router.push(`/marketplace-transaction/${transactionId}`) },
          { text: 'My Properties', onPress: () => router.push('/my-properties') }
        ]
      );
    } catch (error: any) {
      console.error('Error purchasing listing:', error);
      Alert.alert('Purchase Failed', error.message || 'Failed to purchase listing. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const nextImage = () => {
    if (property?.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading listing details...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>Listing not found or no longer available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImage = property.images && property.images.length > 0 
    ? property.images[currentImageIndex] 
    : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80';

  const isOwner = user && user.id === property.userId;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Marketplace Listing',
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.walletButton}
                onPress={() => router.push('/wallet')}
              >
                <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                <Text style={styles.walletBalance}>${walletBalance.toFixed(2)}</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: displayImage }} style={styles.image} />
          
          {property.images && property.images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.imageNavButton, styles.prevButton]}
                onPress={prevImage}
              >
                <Text style={styles.imageNavText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageNavButton, styles.nextButton]}
                onPress={nextImage}
              >
                <Text style={styles.imageNavText}>→</Text>
              </TouchableOpacity>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1}/{property.images.length}
                </Text>
              </View>
            </>
          )}
          
          <View style={styles.marketplaceBadge}>
            <Text style={styles.marketplaceText}>Marketplace</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{property.title}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {formatPrice(property.marketplacePrice || property.price, property.currency || 'AED')}
            </Text>
            {property.marketplacePrice !== property.price && property.price && (
              <Text style={styles.originalPrice}>
                Original: {formatPrice(property.price, property.currency || 'AED')}
              </Text>
            )}
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoText}>{property.location}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="home-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoText}>{property.type}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            {property.bedrooms !== undefined && (
              <View style={styles.infoItem}>
                <Ionicons name="bed-outline" size={18} color={colors.textLight} />
                <Text style={styles.infoText}>{property.bedrooms} Beds</Text>
              </View>
            )}
            {property.bathrooms !== undefined && (
              <View style={styles.infoItem}>
                <Ionicons name="water-outline" size={18} color={colors.textLight} />
                <Text style={styles.infoText}>{property.bathrooms} Baths</Text>
              </View>
            )}
            {property.area !== undefined && (
              <View style={styles.infoItem}>
                <Ionicons name="resize-outline" size={18} color={colors.textLight} />
                <Text style={styles.infoText}>
                  {property.area} {property.area_unit || 'sqft'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{property.description}</Text>
          
          {property.features && property.features.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.featuresContainer}>
                {property.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerInfo}>
            <Ionicons name="person-circle-outline" size={40} color={colors.textLight} />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{property.ownerName || 'Anonymous Seller'}</Text>
              <Text style={styles.sellerType}>Property Owner</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {!isOwner && (
        <View style={styles.actionContainer}>
          {user && !isPaidMember && (
            <View style={styles.membershipBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.button.text.primary} />
              <Text style={styles.membershipText}>
                Only paid members can purchase listings
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push('/subscription')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (isOwner || !user || !isPaidMember || purchaseLoading) && styles.disabledButton
            ]}
            onPress={handlePurchase}
            disabled={isOwner || !user || !isPaidMember || purchaseLoading}
          >
            {purchaseLoading ? (
              <ActivityIndicator size="small" color={colors.button.text.primary} />
            ) : (
              <>
                <Ionicons name="cart-outline" size={20} color={colors.button.text.primary} />
                <Text style={styles.purchaseButtonText}>
                  {isOwner ? 'You Own This Listing' : 'Purchase Listing'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  walletBalance: {
    marginLeft: 5,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    paddingBottom: 100,
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
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.button.text.primary,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 10,
  },
  nextButton: {
    right: 10,
  },
  imageNavText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 12,
  },
  marketplaceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  marketplaceText: {
    color: colors.button.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textLight,
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.input.background,
    borderRadius: 8,
  },
  sellerDetails: {
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sellerType: {
    fontSize: 14,
    color: colors.textLight,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  membershipBanner: {
    backgroundColor: colors.warning,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  membershipText: {
    flex: 1,
    color: colors.button.text.primary,
    fontSize: 12,
    marginHorizontal: 8,
  },
  upgradeButton: {
    backgroundColor: colors.background,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  upgradeButtonText: {
    color: colors.warning,
    fontWeight: '600',
    fontSize: 12,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.button.disabled,
  },
  purchaseButtonText: {
    color: colors.button.text.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
