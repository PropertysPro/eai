import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Image,
  Dimensions,
  Button,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/auth-context';
import { colors as Colors } from '@/constants/colors';
import { ChevronLeft } from 'lucide-react-native';
import { Building, MessageSquare, Eye, Edit, Trash2, Plus } from 'lucide-react-native';
import usePropertyStore from '@/store/property-store';
import { supabase } from '@/config/supabase';
import PropertyCard from '@/components/PropertyCard';
import { Property, PropertyType } from '@/types/property';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '@/utils/format';

export default function MyPropertiesScreen() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action?: string }>();
  const { user } = useAuth();
  const { 
    properties, 
    loading, 
    error: storeError,
    getUserProperties,
    updateProperty
  } = usePropertyStore();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [sellModeActive, setSellModeActive] = useState(false);

  const loadUserProperties = useCallback(async () => {
    if (!user) return;
    try {
      const properties = await getUserProperties();
      setUserProperties(properties);
    } catch (err) {
      console.error('Error loading user properties:', err);
      setError('Failed to load properties');
    }
  }, [user, getUserProperties]);

  useEffect(() => {
    loadUserProperties();
    
    // Check if we're in sell mode from the URL parameter
    if (action === 'sell') {
      setSellModeActive(true);
    }
  }, [loadUserProperties, action]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserProperties();
    setRefreshing(false);
  }, [loadUserProperties]);

  const handleDeleteProperty = async (propertyId: string) => {
    if (!propertyId) return;
    
    try {
      setIsDeleting(true);
      await updateProperty(propertyId, { status: 'inactive' });
      await loadUserProperties();
      setDeleteModalVisible(false);
      setSelectedPropertyId(null);
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      try {
        setError(null);
        
        // Subscribe to property changes
        const channel = supabase
          .channel('property_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'properties',
            },
            (payload) => {
              console.log('Property change received:', payload);
              loadUserProperties();
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
          });

        return () => {
          if (channel) {
            channel.unsubscribe();
          }
        };
      } catch (err) {
        console.error('Error in fetchAndSubscribe:', err);
        setError('Failed to load properties');
      }
    };

    fetchAndSubscribe();
  }, [loadUserProperties]);

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadUserProperties}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleEditProperty = (propertyId: string) => {
    console.log("Editing property with ID:", propertyId);
    // Navigate to edit property page with the property ID
    router.push({
      pathname: '/add-edit-property',
      params: { id: propertyId, mode: 'edit' }
    });
  };
  
  const confirmDeleteProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setDeleteModalVisible(true);
  };
  
  const handleAddNewProperty = () => {
    console.log("Adding new property");
    // Navigate to add property page
    router.push({
      pathname: '/add-edit-property',
      params: { mode: 'add' }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: sellModeActive ? 'Select Property to Sell' : 'My Properties',
          headerTitleStyle: { color: Colors.text },
          headerStyle: { backgroundColor: Colors.background },
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (sellModeActive) {
                  setSellModeActive(false);
                  router.setParams({ action: undefined });
                } else {
                  router.back();
                }
              }}
            >
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {sellModeActive && (
        <View style={styles.sellModeHeader}>
          <Text style={styles.sellModeText}>
            Select a property to list in the marketplace
          </Text>
        </View>
      )}
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {userProperties.reduce((sum, prop) => sum + (prop.inquiries?.length ?? 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Inquiries</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {userProperties.reduce((sum, prop) => sum + (prop.views ?? 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {userProperties.length}
          </Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <FlatList
          data={userProperties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (sellModeActive) {
                  // Navigate to marketplace listing page with this property
                  router.push({
                    pathname: '/marketplace-listing',
                    params: { id: item.id }
                  });
                } else {
                  router.push({
                    pathname: '/property-details',
                    params: { id: item.id }
                  });
                }
              }}
            >
              <PropertyCard
                property={item}
                showMarketplaceStatus={true}
              />
              {sellModeActive && item.isInMarketplace && (
                <View style={styles.alreadyListedBadge}>
                  <Text style={styles.alreadyListedText}>Already in Marketplace</Text>
                </View>
              )}
              {sellModeActive && !item.isInMarketplace && (
                <View style={styles.sellActionContainer}>
                  <Text style={styles.tapToSellText}>Tap to list in marketplace</Text>
                  <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No properties found</Text>
              <Text style={styles.emptySubText}>
                Add your first property by clicking the button below
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      </ScrollView>
      
      {!sellModeActive && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNewProperty}
        >
          <View style={styles.addButtonContent}>
            <View style={styles.addButtonIconContainer}>
              <Ionicons name="add" size={24} color="white" />
            </View>
            <Text style={styles.addButtonText}>Add New Property</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Property</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this property? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={() => {
                  if (selectedPropertyId) {
                    handleDeleteProperty(selectedPropertyId);
                  }
                }}
              >
                <Text style={styles.deleteModalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sellModeHeader: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellModeText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  alreadyListedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  alreadyListedText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  sellActionContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapToSellText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card.background,
    margin: 16,
    borderRadius: 12,
    padding: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for the FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background,
    padding: 24,
    borderRadius: 16,
    margin: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: Colors.primaryLight,
    marginRight: 8,
  },
  deleteModalButton: {
    backgroundColor: Colors.error,
    marginLeft: 8,
  },
  cancelModalButtonText: {
    color: Colors.primary,
  },
  deleteModalButtonText: {
    color: Colors.background,
  },
  textSecondary: {
    color: Colors.textLight,
    fontSize: 14,
  },
});
