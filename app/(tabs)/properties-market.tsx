import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native'; 
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { Property } from '@/types/property';
import { User as RealtorProfileType, Review } from '@/types/user';
import PropertyCard from '@/components/PropertyCard'; 
import { MapPin, Briefcase, Star, Languages } from 'lucide-react-native'; 
import { Ionicons } from '@expo/vector-icons'; 
import { colors } from '@/constants/colors';

// --- Mock Data ---
const mockReview: Review = { id: 'review1', reviewerId: 'user2', reviewerName: 'Jane Smith', reviewerAvatar: 'https://randomuser.me/api/portraits/women/2.jpg', rating: 5, comment: 'Excellent service!', createdAt: new Date().toISOString() };
const mockRealtor1: RealtorProfileType & { propertiesListed: number } = { id: 'realtor1', name: 'John Doe', email: 'john.doe@example.com', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', propertiesListed: 15, role: 'realtor', city: 'Dubai', experienceYears: 7, specialties: ['Luxury Villas'], languagesSpoken: ['English', 'Arabic'], bio: 'Bio', averageRating: 4.8, reviewCount: 25, reviews: [mockReview], preferences: {} as any, subscription: 'premium', message_count: 0, message_limit: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), onboarding_completed: true, email_verified: true, properties_market_status: 'approved' };
const mockRealtor2: RealtorProfileType & { propertiesListed: number } = { ...mockRealtor1, id: 'realtor2', name: 'Fatima Ahmed', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', propertiesListed: 8, city: 'Abu Dhabi', experienceYears: 4, specialties: ['Apartments'], languagesSpoken: ['Arabic', 'English', 'French'], averageRating: 4.5, reviewCount: 12 };
const mockRealtor3: RealtorProfileType & { propertiesListed: number } = { ...mockRealtor1, id: 'realtor3', name: 'Raj Patel', avatar: 'https://randomuser.me/api/portraits/men/10.jpg', propertiesListed: 22, city: 'Sharjah', experienceYears: 10, specialties: ['Commercial'], languagesSpoken: ['English', 'Hindi'], averageRating: 4.9, reviewCount: 35 };
const mockPropertyBase: Omit<Property, 'id' | 'title'> = { description: 'Desc', price: 1000000, location: 'Loc', address: 'Addr', type: 'apartment', status: 'available', bedrooms: 2, bathrooms: 1, area: 100, area_unit: 'sqm', images: ['https://via.placeholder.com/300x200.png?text=Default+Property'], features: ['feat'], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), userId: 'user1', listingType: 'sale', currency: 'AED', isDistressed: false, urgency: 'low', construction_status: 'ready', market_status: 'resale' };
const mockProperties: Property[] = [ 
    { ...mockPropertyBase, id: 'prop1', title: 'Distressed Deal: Downtown Apt', images: ['https://via.placeholder.com/300x200.png?text=Distressed+1'], isDistressed: true, price: 1500000, originalPrice: 2000000, listingType: 'sale', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), market_status: 'resale', construction_status: 'ready' },
    { ...mockPropertyBase, id: 'prop2', title: 'Urgent Sale: Marina View', images: ['https://via.placeholder.com/300x200.png?text=Distressed+2'], isDistressed: true, price: 3000000, originalPrice: 3500000, type: 'penthouse', listingType: 'sale', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), market_status: 'resale', construction_status: 'ready' },
    { ...mockPropertyBase, id: 'prop3', title: 'New Listing: Family Villa', images: ['https://via.placeholder.com/300x200.png?text=New+1'], type: 'villa', price: 4500000, bedrooms: 5, bathrooms: 4, area: 350, listingType: 'sale', created_at: new Date(Date.now() - 3600000 * 1).toISOString(), market_status: 'resale', construction_status: 'ready' }, 
    { ...mockPropertyBase, id: 'prop4', title: 'Just In: Studio Apartment', images: ['https://via.placeholder.com/300x200.png?text=New+2'], type: 'studio', price: 800000, bedrooms: 1, bathrooms: 1, area: 50, listingType: 'rent', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), market_status: 'resale', construction_status: 'ready' }, 
    { ...mockPropertyBase, id: 'prop5', title: 'Featured: Luxury Penthouse', images: ['https://via.placeholder.com/300x200.png?text=Featured+1'], type: 'penthouse', price: 7000000, bedrooms: 4, area: 400, listingType: 'sale', created_at: new Date(Date.now() - 86400000 * 10).toISOString(), market_status: 'resale', construction_status: 'ready' },
    { ...mockPropertyBase, id: 'prop6', title: 'Featured: Beachfront Villa', images: ['https://via.placeholder.com/300x200.png?text=Featured+2'], type: 'villa', price: 9500000, bedrooms: 6, area: 550, listingType: 'sale', created_at: new Date(Date.now() - 86400000 * 15).toISOString(), market_status: 'resale', construction_status: 'ready' },
    { ...mockPropertyBase, id: 'prop7', title: 'Urgent Rent: 2BR Apt', images: ['https://via.placeholder.com/300x200.png?text=Urgent+1'], urgency: 'high', listingType: 'rent', price: 120000, created_at: new Date(Date.now() - 86400000 * 1).toISOString(), market_status: 'resale', construction_status: 'ready' },
    { ...mockPropertyBase, id: 'prop8', title: 'Urgent Sale: Townhouse', images: ['https://via.placeholder.com/300x200.png?text=Urgent+2'], urgency: 'high', type: 'townhouse', price: 2800000, listingType: 'sale', created_at: new Date(Date.now() - 86400000 * 4).toISOString(), market_status: 'resale', construction_status: 'ready' },
    { ...mockPropertyBase, id: 'prop9', title: 'Off Plan: Tower Residence', images: ['https://via.placeholder.com/300x200.png?text=OffPlan+1'], construction_status: 'off_plan', price: 1200000, type: 'apartment', bedrooms: 1, created_at: new Date(Date.now() - 86400000 * 20).toISOString(), market_status: 'new_to_market' },
    { ...mockPropertyBase, id: 'prop10', title: 'Off Plan: Community Villa', images: ['https://via.placeholder.com/300x200.png?text=OffPlan+2'], construction_status: 'off_plan', price: 5500000, type: 'villa', bedrooms: 4, created_at: new Date(Date.now() - 86400000 * 30).toISOString(), market_status: 'new_to_market' },
    { ...mockPropertyBase, id: 'prop11', title: 'New Project: Lakeview Apts', images: ['https://via.placeholder.com/300x200.png?text=NewMarket+1'], market_status: 'new_to_market', price: 950000, type: 'apartment', bedrooms: 1, created_at: new Date(Date.now() - 86400000 * 1).toISOString(), construction_status: 'ready' },
    { ...mockPropertyBase, id: 'prop12', title: 'First Listing: Modern Townhouse', images: ['https://via.placeholder.com/300x200.png?text=NewMarket+2'], market_status: 'new_to_market', price: 3200000, type: 'townhouse', bedrooms: 3, created_at: new Date(Date.now() - 86400000 * 5).toISOString(), construction_status: 'ready' },
];
// --- End Mock Data ---

export default function PropertiesMarketPage() {
  const router = useRouter();
  const { user } = useAuth(); 
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);
  const [realtors, setRealtors] = useState<Array<RealtorProfileType & { propertiesListed: number }>>([]);
  const [distressedDeals, setDistressedDeals] = useState<Property[]>([]);
  const [newlyListedProperties, setNewlyListedProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [urgentSaleRentProperties, setUrgentSaleRentProperties] = useState<Property[]>([]);
  const [offPlanProperties, setOffPlanProperties] = useState<Property[]>([]);
  const [newToMarketProperties, setNewToMarketProperties] = useState<Property[]>([]);

  useEffect(() => {
    loadPageData(); 
  }, []);

  // Load mock data synchronously
  const loadPageData = (refresh = false) => {
    console.log("loadPageData called");
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      setRealtors([mockRealtor1, mockRealtor2, mockRealtor3]);
      setDistressedDeals(mockProperties.filter(p => p.isDistressed));
      setNewlyListedProperties(mockProperties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4));
      setFeaturedProperties(mockProperties.filter(p => ['prop5', 'prop6'].includes(p.id))); 
      setUrgentSaleRentProperties(mockProperties.filter(p => p.urgency === 'high'));
      setOffPlanProperties(mockProperties.filter(p => p.construction_status === 'off_plan'));
      setNewToMarketProperties(mockProperties.filter(p => p.market_status === 'new_to_market'));
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) { 
      console.error('Error loading properties market data:', error); 
      Alert.alert('Error', 'Could not load properties market data.'); 
      setLoading(false); 
      setRefreshing(false);
    } 
  };

  const handleRefresh = () => {
    loadPageData(true); 
  };

  const handlePropertyPress = (property: Property) => {
    router.push(`/property-details/${property.id}`); 
  };

  const handleRealtorPress = (realtorId: string) => {
    router.push(`/user-profile/${realtorId}`); 
  };

  // Restore renderPropertySection with PropertyCard
  const renderPropertySection = (title: string, properties: Property[]) => (
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

  // Restore renderRealtorCard with full JSX
  const renderRealtorCard = (realtor: RealtorProfileType & { propertiesListed: number }) => (
    <TouchableOpacity key={realtor.id} style={styles.realtorCard} onPress={() => handleRealtorPress(realtor.id)}> 
      <Image source={{ uri: realtor.avatar }} style={styles.realtorAvatar} />
      <View style={styles.realtorInfo}>
        <Text style={styles.realtorName}>{realtor.name}</Text>
        <View style={styles.realtorRow}>
          <MapPin size={14} color={colors.textLight} />
          <Text style={styles.realtorDetailText}>{realtor.city || 'N/A'}</Text>
        </View>
        <View style={styles.realtorRow}>
          <Briefcase size={14} color={colors.textLight} />
          <Text style={styles.realtorDetailText}>{realtor.experienceYears || 0} years experience</Text>
        </View>
        <View style={styles.realtorRow}>
          <Ionicons name="home-outline" size={14} color={colors.textLight} />
          <Text style={styles.realtorDetailText}>{realtor.propertiesListed} properties listed</Text>
        </View>
        <View style={styles.realtorRow}>
          <Star size={14} color={colors.warning} />
          <Text style={styles.realtorDetailText}>
            {realtor.averageRating?.toFixed(1) || 'N/A'} ({realtor.reviewCount || 0} reviews)
          </Text>
        </View>
        {realtor.specialties && realtor.specialties.length > 0 && (
          <Text style={styles.realtorSubDetailText} numberOfLines={1}>
            Specialties: {realtor.specialties.join(', ')}
          </Text>
        )}
        {realtor.languagesSpoken && realtor.languagesSpoken.length > 0 && (
          <View style={styles.realtorRow}>
            <Languages size={14} color={colors.textLight} />
            <Text style={styles.realtorDetailText}>{realtor.languagesSpoken.join(', ')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Properties Market' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <ActivityIndicator animating={refreshing} color={colors.primary} />
        }
      >
        {/* Search Filters Section */}
        <View style={styles.searchFilterContainer}>
          <Text style={styles.searchFilterTitle}>Find Your Perfect Property</Text>
          <View style={styles.filterRow}>
             <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Country")}>
               <Text style={styles.filterButtonText}>Country</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "City")}>
               <Text style={styles.filterButtonText}>City</Text>
             </TouchableOpacity>
          </View>
           <View style={styles.filterRow}>
             <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Budget")}>
               <Text style={styles.filterButtonText}>Budget</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Agent")}>
               <Text style={styles.filterButtonText}>Agent</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* Realtor Profiles Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Realtors</Text>
          {realtors.map(realtor => renderRealtorCard(realtor))}
        </View>

        {/* Property Sections */}
        {renderPropertySection("Newly Listed", newlyListedProperties)}
        {renderPropertySection("Distressed Deals", distressedDeals)}
        {renderPropertySection("Off Plan", offPlanProperties)}
        {renderPropertySection("New to Market", newToMarketProperties)}
        {renderPropertySection("Featured Properties", featuredProperties)}
        {renderPropertySection("Urgent Sale & Rent", urgentSaleRentProperties)}

      </ScrollView>
    </View>
  );
}

// Restore full styles
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
    fontStyle: 'italic',
  },
   realtorCard: { 
    flexDirection: 'row',
    backgroundColor: colors.card.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'flex-start', 
  },
  realtorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  realtorInfo: {
    flex: 1, 
  },
  realtorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  realtorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  realtorDetailText: {
    fontSize: 13,
    color: colors.textLight,
    marginLeft: 6,
  },
  realtorSubDetailText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  }
});
