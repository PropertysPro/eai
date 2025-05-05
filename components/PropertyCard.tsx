import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Bed, Bath, ArrowUpRight } from 'lucide-react-native';
import { Property } from '@/types/property';
import { colors as Colors } from '@/constants/colors';
import { formatPrice } from '@/utils/format';
import { PropertyImage } from './PropertyImage';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.85;

interface PropertyCardProps {
  property: Property;
  onSave?: (propertyId: string) => void;
  savedProperties?: string[];
  showDetails?: boolean;
  isMatch?: boolean;
  currencyPreference?: string;
  onPress?: () => void;
  showMarketplacePrice?: boolean;
  showMarketplaceStatus?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSave,
  savedProperties = [],
  showDetails = true,
  isMatch = false,
  currencyPreference = 'AED',
  onPress,
  showMarketplacePrice = false,
  showMarketplaceStatus = false,
}) => {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isSaved = savedProperties && savedProperties.includes(property.id);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/property-details',
        params: { id: property.id }
      });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(property.id);
    }
  };

  const nextImage = () => {
    if (property.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const displayImage = property.images && property.images.length > 0 
    ? property.images[currentImageIndex] 
    : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80';

  return (
    <TouchableOpacity
      style={[styles.card, isMatch && styles.matchCard]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <PropertyImage
          uri={displayImage}
          style={styles.image}
        />
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
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.price}>
              {showMarketplacePrice && property.marketplacePrice 
                ? formatPrice(property.marketplacePrice, property.currency || currencyPreference)
                : formatPrice(property.price, property.currency || currencyPreference)}
              {property.status === 'rented' && '/month'}
            </Text>
            {(showMarketplacePrice || showMarketplaceStatus) && property.isInMarketplace && (
              <View style={styles.marketplaceBadge}>
                <Text style={styles.marketplaceText}>Marketplace</Text>
              </View>
            )}
          </View>
          {property.type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{property.type}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>
        
        <View style={styles.locationRow}>
          <MapPin size={14} color="#666" />
          <Text style={styles.location} numberOfLines={1}>
            {property.location || property.address || 'Location not specified'}
          </Text>
        </View>
        
        {showDetails && (
          <View style={styles.detailsRow}>
            {property.bedrooms !== undefined && (
              <View style={styles.detailItem}>
                <Bed size={14} color="#666" />
                <Text style={styles.detailText}>{property.bedrooms} Beds</Text>
              </View>
            )}
            
            {property.bathrooms !== undefined && (
              <View style={styles.detailItem}>
                <Bath size={14} color="#666" />
                <Text style={styles.detailText}>{property.bathrooms} Baths</Text>
              </View>
            )}
            
            {property.area !== undefined && (
              <View style={styles.detailItem}>
                <ArrowUpRight size={14} color="#666" />
                <Text style={styles.detailText}>
                  {property.area} {property.area_unit || 'sqft'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  marketplaceBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  marketplaceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  card: {
    width: cardWidth,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
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
  contentContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  typeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 4,
  },
});

export default PropertyCard;
