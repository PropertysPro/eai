import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput, FlatList, Modal } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router'; // Import useFocusEffect
import { ChevronDown, X } from 'lucide-react-native'; // For dropdown arrow and close icon
import { useAuth } from '@/hooks/use-auth';
// import { propertyService } from '@/services/property-service'; // Assuming a similar service
import { Property } from '@/types/property';
import { User } from '@/types/user'; // Import User type
import PropertyCard from '@/components/PropertyCard'; // Re-use existing component if suitable
import { PropertyImage } from '@/components/PropertyImage'; // Import PropertyImage as named import
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { COUNTRIES_AND_CITIES, Country, City } from '@/constants/locations'; // Import real location data

// Mock data for now
const mockRealtor: User = {
  id: 'realtor1',
  email: 'john.doe@example.com',
  name: 'John Doe',
  avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  role: 'realtor',
  city: 'Dubai',
  experienceYears: 7,
  specialties: ['Luxury Villas', 'Waterfront Properties'],
  languagesSpoken: ['English', 'Arabic'],
  bio: 'Experienced realtor specializing in high-end properties in Dubai. Helping clients find their dream homes for over 7 years.',
  averageRating: 4.8,
  reviewCount: 120,
  properties_market_status: 'approved',
  // Mocked other required fields from User type
  preferences: {
    language: 'en',
    darkMode: false,
    biometricAuth: false,
    notifications: {
      matches: true,
      marketUpdates: true,
      newListings: true,
      subscriptionUpdates: true,
    },
    propertyPreferences: {
      types: ['villa', 'apartment'],
      budget: { min: 1000000, max: 5000000 },
      bedrooms: 3,
      bathrooms: 2,
      locations: ['Dubai Marina', 'Downtown Dubai'],
    },
    location: 'Dubai',
    currency: 'AED',
    isNegotiable: true,
  },
  subscription: 'premium',
  message_count: 0,
  message_limit: 100,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  onboarding_completed: true,
  email_verified: true,
};

const mockProperty: Property = {
  id: '1',
  title: 'Luxury Villa in Dubai Marina',
  address: 'Dubai Marina, Dubai',
  price: 5000000,
  bedrooms: 5,
  bathrooms: 6,
  area: 450,
  images: ['https://placehold.co/300x200.png?text=Property+1'], // Changed placeholder service
  type: 'villa', // Changed from 'sale' to a valid PropertyType
  listingType: 'sale', // Added listingType
  status: 'available',
  description: 'A beautiful villa with stunning views.',
  created_at: new Date().toISOString(),
  userId: 'user1', // Corrected from user_id
  // latitude: 25.0779, // Removed, not in Property type
  // longitude: 55.1399, // Removed, not in Property type
  features: ['pool', 'gym', 'parking'], // Corrected from amenities
  // is_featured: true, // Removed, not in Property type
  isDistressed: false, // Corrected from is_distressed
  urgency: 'high', // Corrected from is_urgent and changed to valid type
  // Mocked additional required fields from Property type
  location: 'Dubai Marina',
  area_unit: 'sqm',
  updated_at: new Date().toISOString(),
};

export default function PropertiesMarketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search Filter States
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);
  const [isCityPickerVisible, setIsCityPickerVisible] = useState(false);
  const [searchBudgetMin, setSearchBudgetMin] = useState('');
  const [searchBudgetMax, setSearchBudgetMax] = useState('');
  // Add more filter states as needed: agent, bedrooms etc.

  useEffect(() => {
    if (selectedCountry) {
      setAvailableCities(selectedCountry.cities);
      setSelectedCity(null); // Reset city when country changes
    } else {
      setAvailableCities([]);
    }
  }, [selectedCountry]);

  // Picker visibility handlers
  const toggleCountryPicker = () => setIsCountryPickerVisible(!isCountryPickerVisible);
  const toggleCityPicker = () => {
    if (!selectedCountry) {
      Alert.alert("Notice", "Please select a country first.");
      return;
    }
    setIsCityPickerVisible(!isCityPickerVisible);
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setSelectedCity(null); // Reset city when country changes
    setIsCountryPickerVisible(false);
  };

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setIsCityPickerVisible(false);
  };

  const handleApplyFilters = () => {
    const filters = {
      country: selectedCountry ? selectedCountry.name : null,
      city: selectedCity ? selectedCity.name : null,
      budgetMin: searchBudgetMin,
      budgetMax: searchBudgetMax,
      // agent: selectedAgent, // TODO: Add agent filter state
    };
    console.log('Applying filters:', filters);
    Alert.alert(
      "Search Initiated",
      `Searching with filters:
      Country: ${filters.country || 'Any'}
      City: ${filters.city || 'Any'}
      Budget: ${filters.budgetMin || 'Any'} - ${filters.budgetMax || 'Any'}
      (TODO: Implement actual search logic & update property lists)`,
      [{ text: "OK" }]
    );
    // Here you would typically call a service to fetch filtered properties
    // and update the property state variables (distressedDeals, lastListedProperties, etc.)
    // For now, we just show an alert.
  };

  const handleResetFilters = () => {
    setSelectedCountry(null);
    setSelectedCity(null);
    setAvailableCities([]);
    setSearchBudgetMin('');
    setSearchBudgetMax('');
    // Reset other filters like agent if they are added
    Alert.alert("Filters Reset", "All search filters have been cleared.");
    // Optionally, you might want to reload all properties or default lists here
  };

  // States for different sections
  const [realtors, setRealtors] = useState<User[]>([mockRealtor]); // Use User[] type
  const [distressedDeals, setDistressedDeals] = useState<Property[]>([mockProperty]); // Placeholder
  const [lastListedProperties, setLastListedProperties] = useState<Property[]>([mockProperty]); // Placeholder
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([mockProperty]); // Placeholder
  const [urgentSaleRentProperties, setUrgentSaleRentProperties] = useState<Property[]>([mockProperty]); // Placeholder

  const loadPageData = useCallback(async (refresh = false) => { // Wrap loadPageData in useCallback
    console.log('[PropertiesMarketPage] loadPageData called. Refresh:', refresh);
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      // TODO: Fetch actual data from services
      // For now, using mock data with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('[PropertiesMarketPage] About to set mock data states.');
      setRealtors([mockRealtor]);
      setDistressedDeals([mockProperty]);
      setLastListedProperties([mockProperty, { ...mockProperty, id: '2', title: 'Another Villa' }]);
      setFeaturedProperties([{ ...mockProperty, id: '3', title: 'Featured Condo' }]);
      setUrgentSaleRentProperties([{ ...mockProperty, id: '4', title: 'Urgent Apartment' }]);
      console.log('[PropertiesMarketPage] Mock data states set.');
    } catch (error) {
      console.error('Error loading properties market data:', error);
      Alert.alert('Error', 'Could not load properties market data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Empty dependency array for useCallback as loadPageData itself doesn't depend on props/state from this scope

  useFocusEffect(
    useCallback(() => {
      console.log('[PropertiesMarketPage] Screen focused, calling loadPageData.');
      loadPageData(); // Call loadPageData unconditionally on focus

      // Optional: Cleanup function when screen goes out of focus
      // return () => {
      //   console.log('[PropertiesMarketPage] Screen unfocused. Potential cleanup.');
      // };
    }, [loadPageData]) // loadPageData is stable due to its own useCallback([])
  );

  const handleRefresh = () => {
    loadPageData(true);
  };

  const handlePropertyPress = (property: Property) => {
    router.push(`/property-details/${property.id}`); // Assuming a similar route
  };

  const renderPropertySection = (title: string, properties: Property[]) => {
    console.log(`[PropertiesMarketPage] renderPropertySection: "${title}", Properties count: ${properties.length}`, properties);
    return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {properties.length === 0 && !loading ? (
        <Text style={styles.emptySectionText}>No properties found in this section.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
          {properties.map(prop => (
            <View key={prop.id} style={styles.propertyCardWrapper}>
              <PropertyCard property={prop} onPress={() => handlePropertyPress(prop)} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}; // Added missing closing brace for renderPropertySection

  const renderRealtorCard = (realtor: User) => (
    <TouchableOpacity style={[styles.realtorCard, styles.realtorCardHorizontal]} onPress={() => router.push({ pathname: '/public-profile', params: { userId: realtor.id } })}>
      {/* Enhanced Realtor Card */}
      {realtor.avatar ? (
        <PropertyImage uri={realtor.avatar} style={styles.realtorAvatar} />
      ) : (
        <Ionicons name="person-circle-outline" size={50} color={colors.primary} style={styles.realtorAvatarPlaceholder} />
      )}
      <View style={styles.realtorInfo}>
        <Text style={styles.realtorName}>{realtor.name}</Text>
        {realtor.city && <Text style={styles.realtorDetailText}>City: {realtor.city}</Text>}
        {realtor.experienceYears !== undefined && <Text style={styles.realtorDetailText}>Experience: {realtor.experienceYears} years</Text>}
        {realtor.specialties && realtor.specialties.length > 0 && (
          <Text style={styles.realtorDetailText} numberOfLines={1}>Specialties: {realtor.specialties.join(', ')}</Text>
        )}
        {realtor.averageRating !== undefined && (
          <Text style={styles.realtorDetailText}>Rating: {realtor.averageRating.toFixed(1)} ★ ({realtor.reviewCount} reviews)</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
    </TouchableOpacity>
  );


  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading Properties Market...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <Stack.Screen options={{ title: 'Properties Market' }} /> REMOVED - Title should be set in Tab Navigator Layout */}
      <ScrollView
        style={{ flex: 1 }} // Ensure ScrollView fills the container
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {/* Search Filters Section */}
        <View style={styles.searchFilterContainer}>
          <Text style={styles.searchFilterTitle}>Find Your Perfect Property</Text>

          {/* Country Picker */}
          <View style={styles.filterInputContainer}>
            <TouchableOpacity style={styles.pickerButton} onPress={toggleCountryPicker}>
              <Text style={[styles.pickerButtonText, !selectedCountry && styles.pickerPlaceholder]}>
                {selectedCountry ? selectedCountry.name : 'Select Country'}
              </Text>
              <ChevronDown size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* City Picker */}
          <View style={styles.filterInputContainer}>
            <TouchableOpacity 
              style={[styles.pickerButton, !selectedCountry && styles.disabledPickerButton]} 
              onPress={toggleCityPicker}
              disabled={!selectedCountry}
            >
              <Text style={[styles.pickerButtonText, !selectedCity && styles.pickerPlaceholder]}>
                {selectedCity ? selectedCity.name : 'Select City'}
              </Text>
              <ChevronDown size={20} color={!selectedCountry ? colors.border : colors.textLight} />
            </TouchableOpacity>
          </View>
          
          {/* Country Picker Modal */}
          <Modal
            transparent={true}
            visible={isCountryPickerVisible}
            onRequestClose={toggleCountryPicker}
            animationType="fade"
          >
            <TouchableOpacity style={styles.pickerModalOverlay} onPress={toggleCountryPicker} activeOpacity={1}>
              <View style={styles.pickerModalContent} onStartShouldSetResponder={() => true}>
                <View style={styles.pickerModalHeader}>
                  <Text style={styles.pickerModalTitle}>Select Country</Text>
                  <TouchableOpacity onPress={toggleCountryPicker}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={COUNTRIES_AND_CITIES}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.pickerItem} onPress={() => handleSelectCountry(item)}>
                      <Text style={styles.pickerItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* City Picker Modal */}
          <Modal
            transparent={true}
            visible={isCityPickerVisible}
            onRequestClose={toggleCityPicker}
            animationType="fade"
          >
            <TouchableOpacity style={styles.pickerModalOverlay} onPress={toggleCityPicker} activeOpacity={1}>
              <View style={styles.pickerModalContent} onStartShouldSetResponder={() => true}>
                <View style={styles.pickerModalHeader}>
                  <Text style={styles.pickerModalTitle}>Select City</Text>
                  <TouchableOpacity onPress={toggleCityPicker}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={availableCities}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.pickerItem} onPress={() => handleSelectCity(item)}>
                      <Text style={styles.pickerItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={styles.emptySectionText}>No cities available for selected country.</Text>}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          <Text style={styles.filterSubTitle}>Budget (AED)</Text>
          <View style={styles.budgetFilterRow}>
            <TextInput
              style={[styles.filterInput, styles.budgetInput]}
              placeholder="Min Price"
              value={searchBudgetMin}
              onChangeText={setSearchBudgetMin}
              keyboardType="numeric"
              placeholderTextColor={colors.textLight}
            />
            <TextInput
              style={[styles.filterInput, styles.budgetInput]}
              placeholder="Max Price"
              value={searchBudgetMax}
              onChangeText={setSearchBudgetMax}
              keyboardType="numeric"
              placeholderTextColor={colors.textLight}
            />
          </View>
          {/* Placeholder for Agent filter - can be a TextInput or a Picker later */}
          <View style={styles.filterInputContainer}>
             <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Agent filter pressed (TODO: Implement Picker)")}>
              <Text style={styles.filterButtonText}>Agent</Text>
            </TouchableOpacity>
          </View>
          {/* TODO: Add more filters like bedrooms, property type etc. */}
          <View style={styles.filterActionsRow}>
            <TouchableOpacity style={[styles.filterActionButton, styles.resetFilterButton]} onPress={handleResetFilters}>
              <Text style={[styles.filterActionButtonText, styles.resetFilterButtonText]}>Reset Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterActionButton, styles.applyFilterButton]} onPress={handleApplyFilters}>
              <Text style={[styles.filterActionButtonText, styles.applyFilterButtonText]}>Search Properties</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Realtor Profiles Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Realtors</Text>
          {realtors.length === 0 && !loading ? (
            <Text style={styles.emptySectionText}>No realtors found.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
              {realtors.map(realtor => (
                <View key={realtor.id} style={styles.realtorCardWrapper}>
                  {renderRealtorCard(realtor)}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {renderPropertySection("Distressed Deals", distressedDeals)}
        {renderPropertySection("Last Properties Listed", lastListedProperties)}
        {renderPropertySection("Featured Properties", featuredProperties)}
        {renderPropertySection("Urgent Sale & Rent", urgentSaleRentProperties)}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 8, // Add some horizontal padding to the main scroll view
  },
  horizontalScrollContent: {
    paddingLeft: 16, // Start first card with padding
    paddingRight: 8, // Less padding at the end if cards have their own margin
    paddingVertical: 12, // Increased vertical padding for better spacing
  },
  propertyCardWrapper: {
    marginRight: 12, // Slightly reduced space between property cards
    width: 280, // Slightly reduced width for property cards for a tighter look
    borderRadius: 12, // Add border radius to the wrapper for consistency if cards have it
    overflow: 'hidden', // Ensure content respects border radius
    // Shadow for the wrapper itself can be subtle or rely on card's shadow
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 4,
    // elevation: 3,
  },
  realtorCardWrapper: {
    marginRight: 12, // Consistent spacing
    // borderRadius: 12, // If realtor cards should also have rounded wrapper
    // overflow: 'hidden',
  },
  searchFilterContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.card.background,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  searchFilterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    minWidth: '45%',
    alignItems: 'center',
  },
  filterButtonText: {
    color: colors.button.text.primary,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24, // Increased bottom margin for more separation
  },
  sectionTitle: {
    fontSize: 22, // Slightly larger section titles
    fontWeight: '700', // Bolder section titles
    color: colors.text,
    marginBottom: 16, // Increased margin below title
    paddingHorizontal: 16, // Add horizontal padding to section titles if main scroll has less
  },
  filterInputContainer: {
    marginBottom: 12,
    position: 'relative', // For absolute positioning of dropdown list if not using Modal
  },
  filterInput: {
    backgroundColor: colors.background === '#000000' || colors.background === '#121212' ? '#2C2C2E' : '#FFFFFF', // Darker input for dark themes, white for light
    borderColor: colors.border ?? '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background === '#000000' || colors.background === '#121212' ? '#2C2C2E' : '#FFFFFF',
    borderColor: colors.border ?? '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14, // Adjusted padding for picker button
  },
  disabledPickerButton: {
    backgroundColor: colors.background === '#000000' || colors.background === '#121212' ? '#1C1C1E' : '#F0F0F0', // Slightly different disabled background
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.textLight,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContent: {
    backgroundColor: colors.card.background,
    borderRadius: 8,
    width: '80%',
    maxHeight: '70%',
    padding: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.text,
  },
  budgetFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetInput: {
    width: '48%', // Adjust width for two inputs in a row
  },
  filterSubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight, // Use existing textLight
    marginBottom: 8,
    marginTop: 4,
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  filterActionButton: {
    flex: 1, // Each button takes half the space
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4, // Add some space between buttons
  },
  applyFilterButton: {
    backgroundColor: colors.primary,
  },
  applyFilterButtonText: {
    color: colors.button.text.primary,
  },
  resetFilterButton: {
    backgroundColor: colors.card.background, // Or a light grey or secondary color
    borderColor: colors.primary,
    borderWidth: 1,
  },
  resetFilterButtonText: {
    color: colors.primary,
  },
  filterActionButtonText: { // Common text style for action buttons
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySectionText: {
    textAlign: 'center',
    color: colors.textLight,
    marginTop: 10,
  },
  realtorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card.background,
    padding: 12, // Slightly increased padding
    borderRadius: 10, // Slightly more rounded corners
    // marginBottom: 10, // Removed, as margin is handled by wrapper
    shadowColor: colors.shadow ?? '#000', // Use theme shadow color
    shadowOffset: { width: 0, height: 2 }, // Standardized shadow
    shadowOpacity: 0.1, // Subtle shadow
    shadowRadius: 3,
    elevation: 3, // Standardized elevation
  },
  realtorCardHorizontal: {
    width: 270, // Slightly adjusted width for realtor cards
  },
  realtorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  realtorAvatarPlaceholder: {
    marginRight: 10,
  },
  realtorInfo: {
    flex: 1, // Allow text to take available space and wrap if needed
    marginRight: 10, // Space before chevron
  },
  realtorName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  realtorDetailText: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 1,
  },
  // Add other styles as needed from marketplace.tsx or new ones
});
