import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Share,
  Linking,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, 
  User as UserIcon, 
  Briefcase, 
  MessageSquare, 
  Share2, 
  MapPin,
  Globe,
  Phone,
  Linkedin,
  Youtube,
  Instagram,
  Twitter, // Assuming Twitter/X might be used
  Disc, // Placeholder for TikTok/Snapchat or other social
  Star,
  Award // For Specialties
} from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { User } from '@/types/user'; // Assuming User type is comprehensive
import { Property } from '@/types/property'; // Assuming Property type exists
import * as authService from '@/services/auth-service'; // For fetching user data
import { propertyService } from '@/services/property-service'; // For fetching properties
import PropertyCard from '@/components/PropertyCard'; // Assuming a PropertyCard component exists

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg'; // Fallback avatar

// StarRating Component
interface StarRatingProps {
  rating: number;
  maxRating?: number;
  starSize?: number;
  starColor?: string;
  emptyStarColor?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  starSize = 18,
  starColor = Colors.warning ?? '#FFC107',
  emptyStarColor = Colors.border ?? '#E0E0E0',
}) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5; // Or use a more precise half-star logic if needed
  const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={starSize} color={starColor} fill={starColor} style={{ marginRight: 2 }} />
      ))}
      {/* Add half-star rendering here if desired */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={starSize} color={emptyStarColor} fill={emptyStarColor} style={{ marginRight: 2 }} />
      ))}
    </View>
  );
};

export default function PublicProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('User ID is missing.');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userDetails = await authService.getUserById(userId); 
        if (!userDetails) {
          setError('User not found.');
          setProfileUser(null);
        } else {
          setProfileUser(userDetails);
          if (userDetails.role === 'realtor' || userDetails.role === 'seller') {
            const userProperties = await propertyService.getPropertiesByUserId(userId);
            setProperties(userProperties || []);
          }
        }
      } catch (e: any) {
        console.error('[PublicProfile] Error fetching data:', e);
        setError(e.message || 'Failed to load profile data.');
        setProfileUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleShareProfile = async () => {
    if (!profileUser) return;
    try {
      const message = `Check out ${profileUser.name}'s profile on OurApp.`;
      // The URL field can cause issues on web if not a valid http/https URL or if deep linking isn't perfectly set up.
      // For web, message is often enough. For native, a deep link is better.
      const shareOptions: { message: string; title?: string; url?: string } = {
        message,
        title: `${profileUser.name}'s Profile`,
      };

      if (Platform.OS !== 'web') {
        // Only include the URL for non-web platforms if a proper deep link is configured.
        // For now, to avoid the "Invalid URL" error, we can make it conditional or use a placeholder.
        // A more robust solution would be to have a configurable public web URL for profiles.
        // const profileUrl = `yourapp://public-profile/${userId}`; // This needs to be a valid, registered deep link.
        // shareOptions.url = profileUrl; 
      }
      
      // If a URL is absolutely required by Share API even for web (unlikely for just message), 
      // a fallback to a generic project URL could be used, but it's better to omit if it causes errors.
      // Example: shareOptions.url = 'https://yourapp.com'; // A generic placeholder if needed

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing profile:', error);
      Alert.alert('Error', 'Could not share profile.');
    }
  };

  const handleStartChat = () => {
    if (!profileUser) return;
    router.push({ pathname: '/chat', params: { recipientId: profileUser.id, recipientName: profileUser.name } });
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)'); // Fallback to home if cannot go back
    }
  };
  
  const openLink = (url: string | undefined) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonOnError}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButtonOnError}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Profile not available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text ?? '#121212'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profileUser.name}'s Profile</Text>
        <TouchableOpacity onPress={handleShareProfile} style={styles.iconButton}>
          <Share2 size={22} color={Colors.text ?? '#121212'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileHeader}>
          <Image source={{ uri: profileUser.avatar || DEFAULT_AVATAR }} style={styles.avatar} />
          {profileUser.averageRating !== undefined && profileUser.averageRating > 0 && (
            <View style={styles.ratingContainer}>
              <StarRating rating={profileUser.averageRating} starSize={20} />
              <Text style={styles.ratingText}>
                {profileUser.averageRating.toFixed(1)} ({profileUser.reviewCount || 0} review{profileUser.reviewCount === 1 ? '' : 's'})
              </Text>
            </View>
          )}
          <Text style={styles.profileName}>{profileUser.name}</Text>
          {profileUser.role && <Text style={styles.profileRole}>{profileUser.role.charAt(0).toUpperCase() + profileUser.role.slice(1)}</Text>}
          
          {profileUser.city && (
            <Text style={styles.profileLocation}>
              <MapPin size={16} color={Colors.textLight ?? '#666666'} style={{marginRight: 6}} /> {profileUser.city}
            </Text>
          )}
          {profileUser.specialties && profileUser.specialties.length > 0 && (
            <Text style={styles.specialtiesText}>
              {/* Specialties removed from here */}
            </Text>
          )}
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleStartChat}>
            <MessageSquare size={20} color={Colors.button.text.primary ?? '#FFFFFF'} />
            <Text style={styles.actionButtonText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {profileUser.bio && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <UserIcon size={22} color={Colors.primary ?? '#6200EE'} />
              <Text style={styles.sectionTitle}>About Me</Text>
            </View>
            <Text style={styles.bioText}>{profileUser.bio}</Text>
          </View>
        )}

        {/* Specialties Card */}
        {profileUser.specialties && profileUser.specialties.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Award size={22} color={Colors.primary ?? '#6200EE'} />
              <Text style={styles.sectionTitle}>Specialties</Text>
            </View>
            <View style={styles.specialtiesContainer}>
              {profileUser.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyItem}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(profileUser.linkedin_url || profileUser.youtube_url || profileUser.whatsapp_number || profileUser.tiktok_url || profileUser.instagram_url || profileUser.snapchat_username) && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Globe size={22} color={Colors.primary ?? '#6200EE'} />
              <Text style={styles.sectionTitle}>Connect</Text>
            </View>
            <View style={styles.socialLinksContainer}>
              {profileUser.whatsapp_number && (
                <TouchableOpacity style={styles.socialLinkItem} onPress={() => openLink(`https://wa.me/${profileUser.whatsapp_number?.replace(/\D/g, '')}`)}>
                  <View style={styles.socialLinkIconContainer}>
                    <Phone size={24} color={Colors.success} />
                  </View>
                  <Text style={styles.socialLinkText}>WhatsApp</Text>
                </TouchableOpacity>
              )}
              {profileUser.linkedin_url && (
                <TouchableOpacity style={styles.socialLinkItem} onPress={() => openLink(profileUser.linkedin_url)}>
                   <View style={styles.socialLinkIconContainer}>
                    <Linkedin size={24} color={Colors.social.facebook ?? "#0077B5"} />{/* Assuming LinkedIn blue */}
                  </View>
                  <Text style={styles.socialLinkText}>LinkedIn</Text>
                </TouchableOpacity>
              )}
              {profileUser.instagram_url && (
                <TouchableOpacity style={styles.socialLinkItem} onPress={() => openLink(profileUser.instagram_url)}>
                   <View style={styles.socialLinkIconContainer}>
                    <Instagram size={24} color={"#E4405F"} />
                  </View>
                  <Text style={styles.socialLinkText}>Instagram</Text>
                </TouchableOpacity>
              )}
              {profileUser.youtube_url && (
                <TouchableOpacity style={styles.socialLinkItem} onPress={() => openLink(profileUser.youtube_url)}>
                  <View style={styles.socialLinkIconContainer}>
                    <Youtube size={24} color={"#FF0000"} />
                  </View>
                  <Text style={styles.socialLinkText}>YouTube</Text>
                </TouchableOpacity>
              )}
              {profileUser.tiktok_url && (
                <TouchableOpacity style={styles.socialLinkItem} onPress={() => openLink(profileUser.tiktok_url)}>
                  <View style={styles.socialLinkIconContainer}>
                    <Disc size={24} color={"#000000"} /> 
                  </View>
                  <Text style={styles.socialLinkText}>TikTok</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {(profileUser.role === 'realtor' || profileUser.role === 'seller') && properties.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Briefcase size={22} color={Colors.primary ?? '#6200EE'} />
              <Text style={styles.sectionTitle}>Properties Listed ({properties.length})</Text>
            </View>
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} onPress={() => router.push(`/property-details/${property.id}`)} />
            ))}
          </View>
        )}
         {(profileUser.role === 'realtor' || profileUser.role === 'seller') && properties.length === 0 && !isLoading && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Briefcase size={22} color={Colors.primary ?? '#6200EE'} />
              <Text style={styles.sectionTitle}>Properties Listed</Text>
            </View>
            <Text style={styles.noPropertiesText}>This user has not listed any properties yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background ?? '#F8F9FA' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: Platform.OS === 'ios' ? 12 : 16, 
    backgroundColor: Colors.card.background, // Changed to card background for a distinct header
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border ?? '#E0E0E0'
  },
  backButton: { 
    padding: 8, 
  },
  backButtonOnError: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 20, 
    left: 16, 
    zIndex: 1, 
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: Colors.text ?? '#121212', 
    textAlign: 'center', 
    flex: 1,
    marginHorizontal: 10, 
  },
  iconButton: { 
    padding: 8,
  },
  content: { 
    flex: 1 
  },
  contentContainer: { 
    paddingHorizontal: 16, // Adjusted for slightly less side padding
    paddingVertical: 20,
    paddingBottom: 40 
  },
  profileHeader: { 
    alignItems: 'center', 
    marginBottom: 28, // Adjusted margin
    paddingVertical: 24, // Increased padding
    backgroundColor: Colors.card.background, 
    borderRadius: 16, // More pronounced rounding
    shadowColor: Colors.shadow ?? '#000',
    shadowOffset: { width: 0, height: 4 }, // Slightly more shadow
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, 
  },
  avatar: { 
    width: 120, // Slightly smaller avatar for balance
    height: 120, 
    borderRadius: 60, 
    borderWidth: 3, // Thinner border
    borderColor: Colors.primary ?? '#6200EE', 
    marginBottom: 16 
  },
  profileName: { 
    fontSize: 24, // Slightly smaller name
    fontWeight: '700', 
    color: Colors.text ?? '#121212', 
    marginBottom: 4 // Reduced margin
  },
  profileRole: { 
    fontSize: 16, // Slightly smaller role
    color: Colors.primary ?? '#6200EE', 
    marginBottom: 6, // Adjusted margin
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  profileLocation: { 
    fontSize: 14, // Slightly smaller location
    color: Colors.textLight ?? '#666666', 
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 28 // Adjusted margin
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, // Slightly less vertical padding
    paddingHorizontal: 28, // Adjusted horizontal padding
    borderRadius: 25, // Maintained rounding
    minWidth: 140, // Adjusted min width
    justifyContent: 'center',
    backgroundColor: Colors.primary ?? '#6200EE',
    shadowColor: Colors.shadow ?? '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, // Increased opacity for button shadow
    shadowRadius: 5,
    elevation: 4, // Increased elevation for button
  },
  actionButtonText: { 
    color: Colors.button.text.primary ?? '#FFFFFF', 
    fontSize: 16, // Slightly smaller text
    fontWeight: '600', 
    marginLeft: 8 // Reduced margin
  },
  card: { 
    backgroundColor: Colors.card.background ?? '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, // Reduced padding for a tighter look
    marginBottom: 16, // Reduced margin
    shadowColor: Colors.shadow ?? '#000000', 
    shadowOffset: { width: 0, height: 2 }, // Softer shadow for cards
    shadowOpacity: 0.07, 
    shadowRadius: 8, 
    elevation: 2 // Softer elevation for cards
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, // Reduced margin
    paddingBottom: 8, 
    borderBottomWidth: 1,
    borderBottomColor: Colors.border ?? '#E5E5E5', 
  },
  sectionTitle: { 
    fontSize: 18, // Slightly smaller section title
    fontWeight: '600', 
    color: Colors.text ?? '#121212', 
    marginLeft: 10 // Adjusted margin
  },
  bioText: { 
    fontSize: 15, // Slightly smaller bio text
    color: Colors.textLight ?? '#666666', 
    lineHeight: 22, // Adjusted line height
    textAlign: 'left', 
    marginTop: 4, // Added top margin for spacing
  },
  socialLinksContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-around', 
    paddingTop: 12 // Added padding top
  },
  socialLinkItem: { 
    flexDirection: 'column', 
    alignItems: 'center', 
    minWidth: 75, 
    marginBottom: 16, 
    paddingHorizontal: 5 
  },
  socialLinkIconContainer: { 
    width: 48, 
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight ?? '#EDE7F6', 
    marginBottom: 6, // Reduced margin
    // Removed shadow from individual icons for a flatter card content look
  },
  socialLinkText: { 
    fontSize: 12, // Smaller text for social links
    color: Colors.textLight ?? '#666666', 
    marginTop: 2 // Reduced margin
  },
  noPropertiesText: { 
    textAlign: 'center', 
    color: Colors.textLight ?? '#666666', 
    paddingVertical: 20, 
    fontSize: 15, // Slightly smaller
    fontStyle: 'italic',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: Colors.background ?? '#F8F9FA', 
    paddingHorizontal: 20 
  },
  loadingText: { 
    fontSize: 16, // Standardized loading text
    color: Colors.text ?? '#121212', 
    marginTop: 16 
  },
  errorText: { 
    fontSize: 16, // Standardized error text
    color: Colors.error ?? '#D32F2F', 
    textAlign: 'center',
    lineHeight: 22, // Adjusted line height
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textLight ?? '#666666',
    marginLeft: 8,
  },
  specialtiesText: {
    fontSize: 14,
    color: Colors.textLight ?? '#666666',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16, // Ensure it doesn't overflow too much
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  specialtyItem: {
    backgroundColor: Colors.primaryLight ?? '#EDE7F6',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: Colors.primary ?? '#6200EE',
    fontSize: 14,
    fontWeight: '500',
  }
});
