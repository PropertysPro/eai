import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { marketplaceService } from '@/services/marketplace-service';
import { walletService } from '@/services/wallet-service';
import { Property } from '@/types/property';
import PropertyCard from '@/components/PropertyCard';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isPaidMember, setIsPaidMember] = useState(false);

  useEffect(() => {
    loadMarketplaceListings();
    if (user) {
      checkWalletBalance();
      checkMembershipStatus();
    }
  }, [user]);

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

  const loadMarketplaceListings = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
        pageNum = 1;
      } else if (pageNum === 1) {
        setLoading(true);
      }

      // Only attempt to load more if we have more pages or it's the first page
      if (pageNum === 1 || hasMore) {
        const response = await marketplaceService.getMarketplaceListings(pageNum);
        
        if (refresh || pageNum === 1) {
          setProperties(response.data);
        } else {
          setProperties(prev => [...prev, ...response.data]);
        }
        
        // Check if there are more pages to load
        setHasMore(response.data.length > 0 && response.total > pageNum * 10);
      }
    } catch (error) {
      console.error('Error loading marketplace listings:', error);
      // Show a more user-friendly error message
      Alert.alert(
        'Error Loading Listings',
        'We encountered a problem loading marketplace listings. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadMarketplaceListings(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      try {
        const nextPage = page + 1;
        setPage(nextPage);
        loadMarketplaceListings(nextPage);
      } catch (error) {
        console.error('Error in handleLoadMore:', error);
        // Don't show an alert here to avoid multiple alerts if loadMarketplaceListings fails
      }
    }
  };

  const handlePropertyPress = (property: Property) => {
    router.push(`/marketplace-details/${property.id}`);
  };

  const renderItem = ({ item }: { item: Property }) => (
    <PropertyCard
      property={item}
      onPress={() => handlePropertyPress(item)}
      showMarketplacePrice
    />
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color={colors.textLight} />
        <Text style={styles.emptyText}>No listings available in the marketplace</Text>
        <Text style={styles.emptySubtext}>Check back later for new listings</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Marketplace',
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

      {user && !isPaidMember && (
        <View style={styles.membershipBanner}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.button.text.primary} />
          <Text style={styles.membershipText}>
            Only paid members can purchase listings. Upgrade your membership to buy listings.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={properties}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />

      {user && (
        <TouchableOpacity
          style={styles.sellButton}
          onPress={() => router.push('/my-properties?action=sell')}
        >
          <Ionicons name="add" size={24} color={colors.button.text.primary} />
          <Text style={styles.sellButtonText}>Sell a Listing</Text>
        </TouchableOpacity>
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  sellButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sellButtonText: {
    color: colors.button.text.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  membershipBanner: {
    backgroundColor: colors.warning,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membershipText: {
    color: colors.button.text.primary,
    flex: 1,
    marginHorizontal: 8,
    fontSize: 13,
  },
  upgradeButton: {
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  upgradeButtonText: {
    color: colors.warning,
    fontWeight: '600',
    fontSize: 12,
  },
});
