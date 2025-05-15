import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PropertyCard } from '@/components/PropertyCard';
import { Property, PropertyType } from '@/types/property';
import { colors as Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { countries } from '@/constants/locations';
import { Picker } from '@react-native-picker/picker';
import { getRealtorProfiles } from '@/services/supabase-service';
import { PropertyConstructionStatus } from '@/types/property';

interface RealtorProfile {
  id: string;
  user_id: string;
  is_subscribed: boolean;
  profiles: {
    id: string;
    name: string;
    agency: string;
    avatar_url: string;
    specialization: string[];
    experience_years: number;
  }[];
}

const realtorIds = [
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
  'c3d4e5f6-a7b8-9012-3456-7890abcdef01',
];

const commonPropertyFields = {
  description: 'A beautiful property with stunning views and modern amenities.',
  location: 'Dubai, UAE',
  address: 'Specific Address, Dubai, UAE',
  area_unit: 'sqft' as 'sqft',
  images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80'],
  features: ['Swimming Pool', 'Gym', 'Parking', 'Security'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  userId: 'user-placeholder-id',
  currency: 'AED' as 'AED',
};

const distressedDeals: Property[] = [
  { ...commonPropertyFields, id: 'dd1', title: 'Urgent Sale: 2BR Apt, Marina View', price: 1200000, type: 'apartment' as PropertyType, status: 'available' as 'available', bedrooms: 2, bathrooms: 2, area: 1250, location: 'Dubai Marina', isDistressed: true, distressReason: 'Owner relocating', originalPrice: 1500000, listingType: 'sale' as 'sale' },
  { ...commonPropertyFields, id: 'dd2', title: 'Quick Sale: Villa, Prime Location', price: 3800000, type: 'villa' as PropertyType, status: 'available' as 'available', bedrooms: 4, bathrooms: 5, area: 3500, location: 'Jumeirah Islands', isDistressed: true, reason: 'Financial urgency', listingType: 'sale' as 'sale' },
  { ...commonPropertyFields, id: 'dd3', title: 'Below Market: Studio, Business Bay', price: 750000, type: 'studio' as PropertyType, status: 'available' as 'available', bedrooms: 0, bathrooms: 1, area: 550, location: 'Business Bay', isDistressed: true, reason: 'Bank Foreclosure', originalPrice: 900000, listingType: 'sale' as 'sale' },
];

const propertiesForSale = [
  { ...commonPropertyFields, id: 's1', title: 'Luxury Penthouse, Downtown', price: 7500000, type: 'penthouse' as PropertyType, status: 'available' as 'available', bedrooms: 3, bathrooms: 4, area: 3000, location: 'Downtown Dubai', listingType: 'sale' as 'sale' },
  { ...commonPropertyFields, id: 's2', title: 'Spacious Townhouse, Community Living', price: 2800000, type: 'townhouse' as PropertyType, status: 'available' as 'available', bedrooms: 3, bathrooms: 3, area: 2200, location: 'Arabian Ranches', listingType: 'sale' as 'sale' },
  { ...commonPropertyFields, id: 's3', title: 'Modern Apartment, City Walk', price: 2100000, type: 'apartment' as PropertyType, status: 'available' as 'available', bedrooms: 1, bathrooms: 2, area: 900, location: 'City Walk', listingType: 'sale' as 'sale' },
  { ...commonPropertyFields, id: 's4', title: 'Beachfront Villa, Palm Jumeirah', price: 15000000, type: 'villa' as PropertyType, status: 'available' as 'available', bedrooms: 5, bathrooms: 6, area: 5500, location: 'Palm Jumeirah', listingType: 'sale' as 'sale' },
];

const propertiesForRent = [
  { ...commonPropertyFields, id: 'r1', title: 'Chic 1BR Apt for Rent, DIFC', price: 85000, type: 'apartment' as PropertyType, status: 'available' as 'available', bedrooms: 1, bathrooms: 1, area: 800, location: 'DIFC', listingType: 'rent' as 'rent' },
  { ...commonPropertyFields, id: 'r2', title: 'Family Villa with Garden, Mirdif', price: 220000, type: 'townhouse' as PropertyType, status: 'available' as 'available', bedrooms: 4, bathrooms: 4, area: 3200, location: 'Mirdif', listingType: 'rent' as 'rent' },
  { ...commonPropertyFields, id: 'r3', title: 'Furnished Studio for Rent, JLT', price: 55000, type: 'apartment' as PropertyType, status: 'available' as 'available', bedrooms: 0, bathrooms: 1, area: 500, location: 'JLT', listingType: 'rent' as 'rent' },
];

const offPlanProperties = [
  { ...commonPropertyFields, id: 'op1', title: 'Off-Plan: Tower X - 2BR Unit', price: 1800000, type: 'apartment' as PropertyType, status: 'available' as 'available', bedrooms: 2, bathrooms: 2, area: 1100, location: 'Emaar Beachfront', construction_status: "off_plan" as PropertyConstructionStatus, market_status: 'new_to_market' as 'new_to_market', listingType: 'sale' as 'sale' },
  { ...commonPropertyFields, id: 'op2', title: 'Off-Plan: Waterfront Villas Phase II', price: 5500000, type: 'villa' as PropertyType, status: 'available' as 'available', bedrooms: 5, bathrooms: 6, area: 4500, location: 'Dubai Creek Harbour', construction_status: "off_plan" as PropertyConstructionStatus, market_status: 'new_to_market' as 'new_to_market', listingType: 'sale' as 'sale' },
  { ...commonPropertyFields, id: 'op3', title: 'Off-Plan: Luxury Apt, Dubai Hills', price: 2500000, type: 'apartment' as PropertyType, status: 'available' as 'available', bedrooms: 3, bathrooms: 3, area: 1800, location: 'Dubai Hills Estate', construction_status: "off_plan" as PropertyConstructionStatus, market_status: 'new_to_market' as 'new_to_market', listingType: 'sale' as 'sale' },
];

const PropertiesHubScreen = () => {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [realtors, setRealtors] = useState<RealtorProfile[]>([]);

  useEffect(() => {
    const fetchRealtors = async () => {
      try {
        const realtorProfilesData = await getRealtorProfiles();
        const realtorProfiles = realtorProfilesData.map((realtor) => ({
          id: realtor.user_id,
          user_id: realtor.user_id,
          is_subscribed: realtor.is_subscribed,
          profile: {
            name: realtor.profile?.name || '',
            agency: realtor.profile?.agency || '',
            avatar_url: realtor.profile?.avatar_url || '',
            specialization: realtor.profile?.specialization || [],
            experienceYears: realtor.profile?.experienceYears || 0,
          },
        }));
        setRealtors(realtorProfiles as RealtorProfile[]);
      } catch (error) {
        console.error('Error fetching realtor profiles:', error);
      }
    };

    fetchRealtors();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedCountry}
          style={styles.picker}
          onValueChange={(itemValue: string) => {
            setSelectedCountry(itemValue);
            setSelectedCity('');
          }}
        >
          <Picker.Item label="Select Country" value="" />
          {countries.map((country) => (
            <Picker.Item key={country.name} label={country.name} value={country.name} />
          ))}
        </Picker>

        <Picker
          selectedValue={selectedCity}
          style={styles.picker}
          enabled={cityOptions.length > 0}
          onValueChange={(itemValue: string) => setSelectedCity(itemValue)}
        >
          <Picker.Item label="Select City" value="" />
          {cityOptions.map((city) => (
            <Picker.Item key={city} label={city} value={city} />
          ))}
        </Picker>

        <TextInput
          style={styles.input}
          placeholder="Budget"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.header}>Explore Top Realtors & Properties</Text>

        {/* Realtors Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Realtors</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            {realtors && realtors.length > 0 ? (
              realtors.map((realtor) => {
                if (!realtor?.profile) {
                  return null;
                }

                return (
                  <TouchableOpacity
                    key={realtor.id}
                    style={styles.realtorCard}
                    onPress={() => router.push(`/public-profile?userId=${realtor.id}`)}
                  >
                    <Image source={{ uri: realtor.profiles[0].avatar_url || '' }} style={styles.realtorImage} />
                    <View style={styles.realtorInfo}>
                      <Text style={styles.realtorName} numberOfLines={1}>{realtor.profiles[0]?.name || ''}</Text>
                      <Text style={styles.realtorAgency} numberOfLines={1}>{realtor.profiles[0]?.agency || ''}</Text>
                      <Text style={styles.realtorDetail}>Exp: {realtor.profiles[0]?.experience_years} yrs</Text>
                      <Text style={styles.realtorDetail}>Specializes in: {realtor.profiles[0]?.specialization?.join(', ') || ''}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }).filter(Boolean)
            ) : (
              <Text>No realtors found.</Text>
            )}
          </ScrollView>
        </View>

        {/* Distressed Deals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distressed Deals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
            {distressedDeals.map((deal) => (
              <PropertyCard key={deal.id} property={deal} />
            ))}
          </ScrollView>
        </View>

        {/* Properties For Sale Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Properties For Sale</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
            {propertiesForSale.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </ScrollView>
        </View>

        {/* Properties For Rent Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Properties For Rent</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
            {propertiesForRent.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </ScrollView>
        </View>

        {/* Off Plan Properties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Off Plan Properties</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
            {offPlanProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 24,
    textAlign: 'center',
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: Colors.textLight,
  },
  horizontalScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  realtorCard: {
    backgroundColor: Colors.card.background,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: Dimensions.get('window').width * 0.6,
    height: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  realtorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  realtorInfo: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  realtorName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text || '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  realtorAgency: {
    fontSize: 14,
    color: Colors.subscription.premium || '#007AFF', // Use premium color
    textAlign: 'center',
    marginBottom: 8,
  },
  realtorDetail: {
    fontSize: 13,
    color: Colors.textLight || '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.card.background,
  },
  picker: {
    width: 150,
    height: 40,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 5,
  },
  input: {
    width: 100,
    height: 40,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  }
});

export default PropertiesHubScreen;
