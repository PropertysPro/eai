import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  Image,
  Alert,
  ImageStyle,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Filter, MapPin, Bed, Bath, Square, Heart, HeartOff, Zap, DollarSign, AlertTriangle, MessageSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors as Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import usePropertyStore from '@/store/property-store';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types/property';
import { formatPrice } from '@/utils/format';
import { usePagination } from '@/hooks/usePagination';

export default function DiscoverScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const propertyStore = usePropertyStore();
  const { user } = useAuth();
  const {
    properties,
    featuredProperties,
    matches,
    currencyPreference,
    setCurrencyPreference,
    distressedDeals,
    loading,
    error,
    fetchProperties,
    fetchFeaturedProperties,
    fetchMatches,
    pagination,
    updateFilters,
  } = propertyStore;
  
  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
  } = usePagination({
    initialPage: 1,
    pageSize: 10,
    totalItems: pagination.totalItems,
  });

  // Reference to track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  // Load properties only once when component mounts or when page changes
  useEffect(() => {
    const loadProperties = async () => {
      try {
        // Create filters based on user preferences
        if (user && user.preferences) {
          const userFilters: any = {};
          
          // Add price range from user preferences
          if (user.preferences.propertyPreferences?.budget) {
            userFilters.minPrice = user.preferences.propertyPreferences.budget.min;
            userFilters.maxPrice = user.preferences.propertyPreferences.budget.max;
          }
          
          // Add location/city from user preferences
          if (user.preferences.location) {
            // Extract city from location (assuming format like "Dubai, UAE")
            const locationParts = user.preferences.location.split(',');
            if (locationParts.length > 0) {
              userFilters.city = locationParts[0].trim();
            }
          }
          
          // Add property types from user preferences
          if (user.preferences.propertyPreferences?.types && user.preferences.propertyPreferences.types.length > 0) {
            // Map user property type preferences to listing types
            const propertyTypes = user.preferences.propertyPreferences.types;
            
            // If user is interested in buying or investing, show properties for sale
            if (propertyTypes.includes('buy') || propertyTypes.includes('invest')) {
              userFilters.listingType = 'sale';
            }
            // If user is interested in renting, show rental properties
            else if (propertyTypes.includes('rent')) {
              userFilters.listingType = 'rent';
            }
          }
          
          // Update the filters in the store
          updateFilters(userFilters);
          
          // Fetch properties with the user's filters
          await fetchProperties(userFilters, currentPage);
        } else {
          // If no user or preferences, fetch without filters
          await fetchProperties({}, currentPage);
        }
        
        // Fetch featured properties
        await fetchFeaturedProperties();
        
        // Try to fetch matches, but don't wait for it to complete
        // This prevents the 404 error from blocking the UI
        fetchMatches().catch(err => {
          console.error('Error fetching matches (non-blocking):', err);
          // Silently fail - this won't block the UI from rendering
        });
        
        // Mark initial data as loaded
        setInitialDataLoaded(true);
      } catch (error) {
        console.error('Error loading properties:', error);
        // Even if there's an error, mark data as loaded to prevent UI from being stuck
        setInitialDataLoaded(true);
      }
    };
    
    loadProperties();
  }, [currentPage]);
  
  // Only update filters when user changes and initial data is already loaded
  useEffect(() => {
    // Skip this effect on initial render or if data hasn't been loaded yet
    if (!initialDataLoaded || !user) return;
    
    const updateUserFilters = async () => {
      try {
        if (user.preferences) {
          const userFilters: any = {};
          
          if (user.preferences.propertyPreferences?.budget) {
            userFilters.minPrice = user.preferences.propertyPreferences.budget.min;
            userFilters.maxPrice = user.preferences.propertyPreferences.budget.max;
          }
          
          if (user.preferences.location) {
            const locationParts = user.preferences.location.split(',');
            if (locationParts.length > 0) {
              userFilters.city = locationParts[0].trim();
            }
          }
          
          if (user.preferences.propertyPreferences?.types && user.preferences.propertyPreferences.types.length > 0) {
            const propertyTypes = user.preferences.propertyPreferences.types;
            
            if (propertyTypes.includes('buy') || propertyTypes.includes('invest')) {
              userFilters.listingType = 'sale';
            } else if (propertyTypes.includes('rent')) {
              userFilters.listingType = 'rent';
            }
          }
          
          // Only update filters, don't fetch properties again
          updateFilters(userFilters);
        }
      } catch (error) {
        console.error('Error updating user filters:', error);
      }
    };
    
    updateUserFilters();
  }, [user, initialDataLoaded]);
  
  // Filter hot properties
  const hotProperties = matches.filter(property => property.isDistressed);
  
  const handlePropertyPress = (property: Property) => {
    router.push({
      pathname: '/property-details',
      params: { id: property.id },
    });
  };
  
  const handleCurrencyToggle = () => {
    const newCurrency = currencyPreference === 'AED' ? 'USD' : 'AED';
    setCurrencyPreference(newCurrency);
  };
  
  const renderHotProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.hotPropertyCard}
      onPress={() => handlePropertyPress(item)}
    >
      <Image
        source={{ uri: item.images[0] }}
        style={styles.hotPropertyImage}
      />
      <View style={styles.hotPropertyInfo}>
        <Text style={styles.hotPropertyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.hotPropertyPrice}>
          {formatPrice(item.price, 'AED')}
        </Text>
        <Text style={styles.hotPropertyLocation} numberOfLines={1}>
          {item.location}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderDistressedDeal = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.distressedDealCard}
      onPress={() => handlePropertyPress(item)}
    >
      <Image
        source={{ uri: item.images[0] }}
        style={styles.distressedDealImage}
      />
      <View style={styles.distressedDealInfo}>
        <Text style={styles.distressedDealTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.distressedDealPrice}>
          {formatPrice(item.price, 'AED')}
        </Text>
        <Text style={styles.distressedDealLocation} numberOfLines={1}>
          {item.location}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  const handleError = (error: Error) => {
    console.error('Error:', error);
    Alert.alert('Error', error.message || 'An unexpected error occurred');
  };
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      {/* Fixed header outside of ScrollView */}
      <View style={styles.fixedHeader}>
        <Text style={styles.headerTitle}>Discover Matched Properties</Text>
        <TouchableOpacity 
          style={styles.currencyToggle}
          onPress={handleCurrencyToggle}
        >
          <DollarSign size={16} color={Colors.primary} />
          <Text style={styles.currencyText}>
            {currencyPreference || 'AED'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        
        {user && user.preferences && (
          <View style={styles.matchInfoContainer}>
            <Text style={styles.matchInfoText}>
              Properties matched to your preferences
            </Text>
          </View>
        )}
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by location, property type..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textLight}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {
              // Show filter modal or navigate to filter screen
              Alert.alert(
                "Filters",
                "Filter options will be displayed here",
                [
                  {
                    text: "Apply Filters",
                    onPress: () => console.log("Filters applied")
                  },
                  {
                    text: "Cancel",
                    style: "cancel"
                  }
                ]
              );
            }}
          >
            <Filter size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Distressed Deals Banner */}
        {distressedDeals && distressedDeals.length > 0 && (
          <TouchableOpacity 
            style={styles.distressedDealsBanner}
            onPress={() => router.push('/distressed-deals')}
          >
            <Image 
              source={{ uri: distressedDeals[0].images[0] }} 
              style={styles.distressedDealsImage as ImageStyle} 
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.distressedDealsGradient}
            >
              <View style={styles.distressedDealsContent}>
                <View style={styles.distressedBadge}>
                  <AlertTriangle size={12} color="white" />
                  <Text style={styles.distressedBadgeText}>DISTRESSED DEAL</Text>
                </View>
                <Text style={styles.distressedDealsTitle}>
                  {distressedDeals.length} Distressed Properties Available
                </Text>
                <Text style={styles.distressedDealsPrice}>
                  Up to 30% Below Market Value
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        {/* Hot Properties Section */}
        {hotProperties.length > 0 && (
          <View style={styles.hotPropertiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hot Properties</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={hotProperties}
              renderItem={renderHotProperty}
              keyExtractor={item => `hot-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hotPropertiesList}
            />
          </View>
        )}
        
        {/* Featured Properties Section */}
        {featuredProperties.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Properties</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredProperties}
              renderItem={renderHotProperty}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}
        
        {/* All Properties Section */}
        <View style={styles.allPropertiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Properties</Text>
          </View>
          
          {properties.length > 0 ? (
            <View style={styles.propertiesList}>
              {properties.map((property: Property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onPress={() => handlePropertyPress(property)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No matching properties found</Text>
              
              <View style={styles.noResultsActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    // Clear filters and fetch all properties
                    updateFilters({});
                    fetchProperties({}, 1);
                  }}
                >
                  <Search size={18} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Search All Properties</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/(tabs)/chat')}
                >
                  <MessageSquare size={18} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Ask EAI Assistant</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Pagination Controls */}
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, !hasPreviousPage && styles.paginationButtonDisabled]}
              onPress={previousPage}
              disabled={!hasPreviousPage}
            >
              <Text style={[styles.paginationButtonText, !hasPreviousPage && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <Text style={styles.paginationText}>
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.paginationButton, !hasNextPage && styles.paginationButtonDisabled]}
              onPress={nextPage}
              disabled={!hasNextPage}
            >
              <Text style={[styles.paginationButtonText, !hasNextPage && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Ask EAI Assistant Button */}
          <View style={styles.askEAIContainer}>
            <TouchableOpacity 
              style={styles.askEAIButton}
              onPress={() => router.push('/(tabs)/chat')}
            >
              <MessageSquare size={18} color="white" />
              <Text style={styles.askEAIButtonText}>Ask EAI Assistant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currencyText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    backgroundColor: Colors.primaryLight,
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distressedDealsBanner: {
    marginHorizontal: 20,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  distressedDealsImage: {
    width: '100%',
    height: '100%',
  },
  distressedDealsGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
  },
  distressedDealsContent: {
    padding: 16,
  },
  distressedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  distressedBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  distressedDealsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  distressedDealsPrice: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  hotPropertiesSection: {
    marginBottom: 24,
  },
  hotPropertiesList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  hotPropertyCard: {
    width: 240,
    backgroundColor: Colors.card.background,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  hotPropertyImage: {
    width: '100%',
    height: 140,
  },
  hotPropertyInfo: {
    padding: 12,
  },
  hotPropertyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  hotPropertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  hotPropertyLocation: {
    fontSize: 12,
    color: Colors.textLight,
  },
  allPropertiesSection: {
    paddingBottom: 20,
  },
  propertiesList: {
    paddingHorizontal: 20,
  },
  distressedDealCard: {
    backgroundColor: Colors.card.background,
    borderRadius: 12,
    marginRight: 16,
    width: 200,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  distressedDealImage: {
    width: '100%',
    height: 140,
  },
  distressedDealInfo: {
    padding: 12,
  },
  distressedDealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  distressedDealPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  distressedDealLocation: {
    fontSize: 12,
    color: Colors.textLight,
  },
  section: {
    marginBottom: 24,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    margin: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  paginationButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: Colors.border,
  },
  paginationButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  paginationButtonTextDisabled: {
    color: Colors.textLight,
  },
  paginationText: {
    color: Colors.text,
    fontWeight: '500',
  },
  matchInfoContainer: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchInfoText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card.background,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  noResultsActions: {
    flexDirection: 'column',
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  askEAIContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  askEAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  askEAIButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
});
