import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors as Colors } from '@/constants/colors';
import { getRealtorProfiles, getUserProfile } from '@/services/supabase-service';

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
    is_visible: boolean;
  }[];
}

const RealtorList = ({ sortBy }: { sortBy?: string }) => {
  const router = useRouter();
  const [realtors, setRealtors] = useState<RealtorProfile[]>([]);

  useEffect(() => {
    const fetchRealtors = async () => {
      try {
        const realtorProfilesData = await getRealtorProfiles(undefined, sortBy);
        const realtorProfiles = await Promise.all(
          realtorProfilesData.map(async (realtor) => {
            const profileData = await getUserProfile(realtor.user_id);
            return {
              id: realtor.user_id,
              user_id: realtor.user_id,
              is_subscribed: realtor.is_subscribed,
              profiles: [{
                id: profileData?.id || '',
                name: profileData?.name || '',
                agency: profileData?.agency || '',
                avatar_url: profileData?.avatar || '',
                specialization: profileData?.specialties || [],
                experience_years: profileData?.experience_years || 0,
                is_visible: profileData?.is_visible || false,
              }],
            };
          })
        );
        // Filter realtors based on is_visible status
        const visibleRealtors = realtorProfiles.filter(realtor => realtor.profiles[0].is_visible);
        setRealtors(visibleRealtors as RealtorProfile[]);
      } catch (error) {
        console.error('Error fetching realtor profiles:', error);
      }
    };

    fetchRealtors();
  }, [sortBy]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Realtors</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContainer}
      >
        {realtors && realtors.length > 0 ? (
          realtors.map((realtor) => (
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
                <Text style={styles.realtorDetail}>Visible: {realtor.profiles[0]?.is_visible ? 'Yes' : 'No'}</Text>
              </View>
              <TouchableOpacity style={styles.chatButton} onPress={() => router.push(`/chat?userId=${realtor.id}`)}>
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No realtors found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
  chatButton: {
    backgroundColor: Colors.primary || '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  chatButtonText: {
    color: Colors.card.background || '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RealtorList;
