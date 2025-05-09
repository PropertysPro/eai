import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
// import { propertyService } from '@/services/property-service'; // Assuming a similar service
import { Property } from '@/types/property';
import PropertyCard from '@/components/PropertyCard'; // Re-use existing component if suitable
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

// Mock data for now
const mockRealtor = {
  name: 'John Doe',
  avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
  propertiesListed: 15,
  stars: 4.5,
};

const mockProperty: Property = {
  id: '1',
  title: 'Luxury Villa in Dubai Marina',
  address: 'Dubai Marina, Dubai',
  price: 5000000,
  bedrooms: 5,
  bathrooms: 6,
  area: 450,
  images: ['https://via.placeholder.com/300x200.png?text=Property+1'], // Corrected from image_urls
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

  // States for different sections
  const [realtors, setRealtors] = useState([mockRealtor]); // Placeholder
  const [distressedDeals, setDistressedDeals] = useState<Property[]>([mockProperty]); // Placeholder
  const [lastListedProperties, setLastListedProperties] = useState<Property[]>([mockProperty]); // Placeholder
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([mockProperty]); // Placeholder
  const [urgentSaleRentProperties, setUrgentSaleRentProperties] = useState<Property[]>([mockProperty]); // Placeholder

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async (refresh = false) => {
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
  };

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
        properties.map(prop => (
          <PropertyCard key={prop.id} property={prop} onPress={() => handlePropertyPress(prop)} />
        ))
      )}
    </View>
  );
}; // Added missing closing brace for renderPropertySection

  const renderRealtorCard = (realtor: typeof mockRealtor) => (
    <View style={styles.realtorCard}>
      {/* Basic Realtor Card - to be enhanced */}
      <Ionicons name="person-circle-outline" size={50} color={colors.primary} />
      <View style={styles.realtorInfo}>
        <Text style={styles.realtorName}>{realtor.name}</Text>
        <Text>Properties: {realtor.propertiesListed}</Text>
        <Text>Rating: {realtor.stars} ★</Text>
      </View>
    </View>
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
      <Stack.Screen options={{ title: 'Properties Market' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'red', textAlign: 'center', marginVertical: 20 }}>
          DEBUG: MAIN CONTENT AREA RENDERING
        </Text>

        {/* Search Filters Section */}
        <View style={styles.searchFilterContainer}>
          <Text style={styles.searchFilterTitle}>Find Your Perfect Property</Text>
          {/* TODO: Implement search inputs: country, city, budget, agent, bedrooms, locations etc. */}
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Country filter pressed")}>
              <Text style={styles.filterButtonText}>Country</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "City filter pressed")}>
              <Text style={styles.filterButtonText}>City</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Budget filter pressed")}>
              <Text style={styles.filterButtonText}>Budget</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Agent filter pressed")}>
              <Text style={styles.filterButtonText}>Agent</Text>
            </TouchableOpacity>
          </View>
          {/* Add more filters as needed */}
        </View>

        {/* Realtor Profiles Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Realtors</Text>
          {realtors.map(renderRealtorCard)}
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
    padding: 16,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
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
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 2,
  },
  realtorInfo: {
    marginLeft: 10,
  },
  realtorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  // Add other styles as needed from marketplace.tsx or new ones
});
