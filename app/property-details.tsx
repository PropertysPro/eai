import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, ViewStyle, TextStyle, ImageStyle, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Heart, Share2, MessageCircle, Phone, Mail, MapPin, Bed, Bath, Square, Calendar, Home, Info, ChevronLeft, ChevronRight, Edit } from 'lucide-react-native';
import usePropertyStore from '@/store/property-store';
import { useChatStore } from '@/store/chat-store';
import { Property } from '@/types/property';
import { colors as Colors } from '@/constants/colors';
import { formatPrice } from '@/utils/helpers';
import { useAuth } from '@/context/auth-context';
import { useCurrencyStore } from '@/store/currency-store';

const PropertyDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { fetchProperty, favorites, addToFavorites, removeFromFavorites, getPropertyById } = usePropertyStore();
  const { createSessionWithProperty } = useChatStore();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  useEffect(() => {
    const loadProperty = async () => {
      try {
        if (!id) {
          setError('Property ID is missing');
          setLoading(false);
          return;
        }
        
        const propertyData = await getPropertyById(id);
        
        if (!propertyData) {
          setError('Property not found');
          setLoading(false);
          return;
        }
        
        setProperty(propertyData);
      } catch (err) {
        console.error('Error loading property:', err);
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };
    
    loadProperty();
  }, [id, getPropertyById]);
  
  const handleChatWithAgent = async () => {
    if (!property) return;
    
    try {
      // Pass the property object to create a chat session
      const sessionId = await createSessionWithProperty(property);
      router.push({
        pathname: '/chat',
        params: { sessionId }
      });
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };
  
  const handleCallAgent = () => {
    // In a real app, this would use Linking to make a phone call
    console.log('Calling agent:', property?.ownerContact);
  };
  
  const handleEmailAgent = () => {
    // In a real app, this would use Linking to open email
    console.log('Emailing agent:', property?.ownerContact);
  };
  
  const handleShare = async () => {
    try {
      const shareMessage = `Check out this property: ${property?.title}\n${property?.location}\nPrice: ${formatPrice(property?.price || 0, property?.currency || 'USD')}\n\nView more details in the app!`;
      
      // Use React Native's Share API
      const { Share } = require('react-native');
      await Share.share({
        message: shareMessage,
        title: 'Share Property',
      });
    } catch (error) {
      console.error('Error sharing property:', error);
    }
  };
  
  const handleToggleFavorite = () => {
    if (property) {
      if (favorites.some(fav => fav.id === property.id)) {
        removeFromFavorites(property.id);
      } else {
        addToFavorites(property.id);
      }
    }
  };
  
  const nextImage = () => {
    if (!property) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevImage = () => {
    if (!property) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
    );
  };
  
  const handleEditProperty = () => {
    if (!property) return;
    router.push({
      pathname: '/add-edit-property',
      params: { id: property.id, mode: 'edit' }
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }
  
  if (error || !property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Property not found'}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/discover')}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const isFavorite = favorites.some(fav => fav.id === property.id);
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Property Details',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: Colors.text,
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backHeaderButton}
              onPress={() => router.push('/(tabs)/discover')}
            >
              <ChevronLeft size={24} color={Colors.primary} />
              <Text style={styles.backHeaderText}>Back</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              {property.userId === user?.id && (
                <TouchableOpacity onPress={handleEditProperty} style={styles.headerButton}>
                  <Edit size={20} color={Colors.text} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleShare} style={[styles.headerButton, styles.shareButton]}>
                <Share2 size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: property.images[currentImageIndex] }} 
            style={styles.image}
            resizeMode="cover"
          />
          
          <TouchableOpacity 
            style={styles.fullImageOverlay}
            activeOpacity={0.9}
            onPress={() => setImageModalVisible(true)}
          >
            <View style={styles.viewFullImageButton}>
              <Text style={styles.viewFullImageText}>View Full Image</Text>
            </View>
          </TouchableOpacity>
          
          {property.images.length > 1 && (
            <>
              <TouchableOpacity 
                style={[styles.imageNavButton, styles.prevButton]} 
                onPress={prevImage}
              >
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageNavButton, styles.nextButton]} 
                onPress={nextImage}
              >
                <ChevronRight size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.imageIndicator}>
                <Text style={styles.imageIndicatorText}>
                  {currentImageIndex + 1} / {property.images.length}
                </Text>
              </View>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={handleToggleFavorite}
          >
            <Heart 
              size={24} 
              color={isFavorite ? Colors.error : 'white'} 
              fill={isFavorite ? Colors.error : 'transparent'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Property Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.price}>
            {formatPrice(property.price, property.currency || useCurrencyStore.getState().currentCurrency).replace(/[^0-9.,]+/g, '')}
          </Text>
          
          <Text style={styles.title}>{property.title}</Text>
          
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={styles.location}>{property.location}</Text>
          </View>
          
          {/* Key Features */}
          <View style={styles.featuresContainer}>
            {property.bedrooms !== undefined && (
              <View style={styles.featureItem}>
                <Bed size={20} color={Colors.primary} />
                <Text style={styles.featureValue}>{property.bedrooms}</Text>
                <Text style={styles.featureLabel}>Bedrooms</Text>
              </View>
            )}
            
            {property.bathrooms !== undefined && (
              <View style={styles.featureItem}>
                <Bath size={20} color={Colors.primary} />
                <Text style={styles.featureValue}>{property.bathrooms}</Text>
                <Text style={styles.featureLabel}>Bathrooms</Text>
              </View>
            )}
            
            <View style={styles.featureItem}>
              <Square size={20} color={Colors.primary} />
              <Text style={styles.featureValue}>{property.area}</Text>
              <Text style={styles.featureLabel}>{property.area_unit}</Text>
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
          
          {/* Property Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.propertyDetailsContainer}>
              <View style={styles.propertyDetailItem}>
                <Text style={styles.propertyDetailLabel}>Type</Text>
                <Text style={styles.propertyDetailValue}>{property.type}</Text>
              </View>
              
              <View style={styles.propertyDetailItem}>
                <Text style={styles.propertyDetailLabel}>Status</Text>
                <Text style={styles.propertyDetailValue}>{property.status}</Text>
              </View>
              
              <View style={styles.propertyDetailItem}>
                <Text style={styles.propertyDetailLabel}>Area</Text>
                <Text style={styles.propertyDetailValue}>{property.area} {property.area_unit}</Text>
              </View>

              {property.isDistressed && (
                <>
                  <View style={styles.propertyDetailItem}>
                    <Text style={styles.propertyDetailLabel}>Original Price</Text>
                    <Text style={styles.propertyDetailValue}>
                      {formatPrice(property.originalPrice || 0, property.currency)}
                    </Text>
                  </View>
                  
                  <View style={styles.propertyDetailItem}>
                    <Text style={styles.propertyDetailLabel}>Discount</Text>
                    <Text style={styles.propertyDetailValue}>{property.discountPercentage}%</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Contact Button */}
          <View style={styles.contactContainer}>
            <TouchableOpacity 
              style={[styles.contactButton, styles.chatButton, styles.singleButton]}
              onPress={handleChatWithAgent}
            >
              <MessageCircle size={20} color="white" />
              <Text style={styles.contactButtonText}>Chat with Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setImageModalVisible(false)}
          >
            <ChevronLeft size={30} color="white" />
          </TouchableOpacity>
          
          <Image 
            source={{ uri: property.images[currentImageIndex] }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          
          {property.images.length > 1 && (
            <View style={styles.modalNavigation}>
              <TouchableOpacity 
                style={styles.modalNavButton}
                onPress={() => {
                  prevImage();
                }}
              >
                <ChevronLeft size={30} color="white" />
              </TouchableOpacity>
              
              <Text style={styles.modalImageCounter}>
                {currentImageIndex + 1} / {property.images.length}
              </Text>
              
              <TouchableOpacity 
                style={styles.modalNavButton}
                onPress={() => {
                  nextImage();
                }}
              >
                <ChevronRight size={30} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  } as ViewStyle,
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  } as TextStyle,
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  } as ViewStyle,
  errorText: {
    fontSize: 16,
    color: Colors.error,
    marginBottom: 20,
    textAlign: 'center',
  } as TextStyle,
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  } as ViewStyle,
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  } as TextStyle,
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  headerButton: {
    padding: 8,
    marginLeft: 8,
  } as ViewStyle,
  shareButton: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    borderRadius: 20,
  } as ViewStyle,
  imageContainer: {
    position: 'relative',
    height: 350, // Increased height
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: Colors.background,
  } as ViewStyle,
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 0, // Clean edges
  } as ImageStyle,
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    padding: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  } as ViewStyle,
  prevButton: {
    left: 20,
  } as ViewStyle,
  nextButton: {
    right: 20,
  } as ViewStyle,
  imageIndicator: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  } as ViewStyle,
  imageIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  } as TextStyle,
  favoriteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    padding: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  } as ViewStyle,
  detailsContainer: {
    padding: 24,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  } as ViewStyle,
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    letterSpacing: 0.5,
  } as TextStyle,
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
    letterSpacing: 0.3,
  } as TextStyle,
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 10,
    borderRadius: 8,
  } as ViewStyle,
  location: {
    fontSize: 15,
    color: Colors.textLight,
    marginLeft: 8,
    flex: 1,
  } as TextStyle,
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  featureItem: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  featureValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  } as TextStyle,
  featureLabel: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  } as TextStyle,
  section: {
    marginBottom: 28,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: 0.3,
  } as TextStyle,
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    letterSpacing: 0.2,
  } as TextStyle,
  propertyDetailsContainer: {
    backgroundColor: Colors.card.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  propertyDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  } as ViewStyle,
  propertyDetailLabel: {
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: '500',
  } as TextStyle,
  propertyDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  } as TextStyle,
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  } as ViewStyle,
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  } as ViewStyle,
  chatButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
  } as ViewStyle,
  callButton: {
    backgroundColor: Colors.success,
  } as ViewStyle,
  emailButton: {
    backgroundColor: Colors.secondary,
  } as ViewStyle,
  contactButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
    letterSpacing: 0.5,
  } as TextStyle,
  singleButton: {
    flex: 0.8, // Make it 80% of the width
    marginHorizontal: 0,
  } as ViewStyle,
  backHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  } as ViewStyle,
  backHeaderText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  } as TextStyle,
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  closeModalButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    padding: 10,
  } as ViewStyle,
  fullScreenImage: {
    width: '100%',
    height: '80%',
  } as ImageStyle,
  modalNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 50,
  } as ViewStyle,
  modalNavButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    padding: 10,
  } as ViewStyle,
  modalImageCounter: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  } as TextStyle,
  fullImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  viewFullImageButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  } as ViewStyle,
  viewFullImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
});

export default PropertyDetails;
