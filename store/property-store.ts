import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Property, PropertyFilters, PropertyFormData } from '@/types/property';
import { supabase } from '@/config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { propertyService } from '@/services/property-service';

interface PropertyState {
  properties: Property[];
  featuredProperties: Property[];
  recentlyViewed: Property[];
  matches: Property[];
  currentProperty: Property | null;
  favorites: Property[];
  loading: boolean;
  error: string | null;
  currencyPreference: string;
  distressedDeals: Property[];
  filters: PropertyFilters;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  fetchProperties: (filters?: PropertyFilters, page?: number) => Promise<void>;
  fetchFeaturedProperties: () => Promise<void>;
  fetchDistressedDeals: (page?: number, city?: string | null) => Promise<void>; // Add city parameter
  fetchFavorites: () => Promise<void>;
  fetchMatches: () => Promise<void>;
  fetchProperty: (id: string) => Promise<void>;
  getPropertyById: (id: string) => Promise<Property | null>;
  addToFavorites: (propertyId: string) => Promise<void>;
  removeFromFavorites: (propertyId: string) => Promise<void>;
  addToRecentlyViewed: (property: Property) => Promise<void>;
  clearRecentlyViewed: () => void;
  setCurrentProperty: (property: Property | null) => void;
  setCurrencyPreference: (currency: string) => void;
  clearFilters: () => void;
  updateFilters: (filters: Partial<PropertyFilters>) => void;
  addProperty: (propertyData: PropertyFormData) => Promise<Property>;
  updateProperty: (id: string, propertyData: Partial<Property>) => Promise<void>;
  getUserProperties: () => Promise<Property[]>;
}

const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: [],
      featuredProperties: [],
      recentlyViewed: [],
      matches: [],
      currentProperty: null,
      favorites: [],
      loading: false,
      error: null,
      currencyPreference: 'USD',
      distressedDeals: [],
      filters: {},
      pagination: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      },

      fetchProperties: async (filters?: PropertyFilters, page: number = 1) => {
        try {
          set({ loading: true, error: null });
          try {
            const { data, total, pageSize } = await propertyService.getProperties(filters, page);
            set({
              properties: data,
              pagination: {
                currentPage: page,
                pageSize,
                totalItems: total,
                totalPages: Math.ceil(total / pageSize),
              },
              loading: false,
            });
          } catch (innerError) {
            console.error('Error in fetchProperties:', innerError);
            set({ 
              properties: [], 
              pagination: {
                currentPage: 1,
                pageSize: 10,
                totalItems: 0,
                totalPages: 0,
              },
              loading: false,
              error: 'Failed to fetch properties'
            });
          }
        } catch (error) {
          console.error('Failed to fetch properties:', error);
          set({ 
            properties: [], 
            pagination: {
              currentPage: 1,
              pageSize: 10,
              totalItems: 0,
              totalPages: 0,
            },
            loading: false,
            error: 'Failed to fetch properties'
          });
        }
      },

      fetchFeaturedProperties: async () => {
        try {
          set({ loading: true, error: null });
          try {
            const { data } = await propertyService.getProperties({ status: 'available' });
            const featured = data.filter(p => p.isHot || p.isNew);
            set({ featuredProperties: featured, loading: false });
          } catch (innerError) {
            console.error('Error in fetchFeaturedProperties:', innerError);
            set({ featuredProperties: [], loading: false });
          }
        } catch (error) {
          console.error('Failed to fetch featured properties:', error);
          set({ featuredProperties: [], error: 'Failed to fetch featured properties', loading: false });
        }
      },

      fetchDistressedDeals: async (page: number = 1, city?: string | null) => {
        try {
          set({ loading: true, error: null });
          try {
            // Pass city to the service layer
            const { data, total, pageSize } = await propertyService.getDistressedDeals(page, city);
            set({
              distressedDeals: data,
              pagination: {
                currentPage: page,
                pageSize,
                totalItems: total,
                totalPages: Math.ceil(total / pageSize),
              },
              loading: false,
            });
          } catch (innerError) {
            console.error('Error in fetchDistressedDeals:', innerError);
            set({ 
              distressedDeals: [], 
              loading: false 
            });
          }
        } catch (error) {
          console.error('Failed to fetch distressed deals:', error);
          set({ 
            distressedDeals: [], 
            error: 'Failed to fetch distressed deals', 
            loading: false 
          });
        }
      },

      fetchFavorites: async () => {
        try {
          set({ loading: true, error: null });
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            // If no user, just set empty favorites and return
            set({ favorites: [], loading: false });
            return;
          }

          try {
            // First check if the favorites table exists by trying to query it
            const { data: favorites, error } = await supabase
              .from('favorites')
              .select('property_id')
              .eq('user_id', user.id);

            if (error) {
              // If there's an error (like table not found), just set empty favorites
              console.warn('Favorites table may not exist:', error.message);
              set({ favorites: [], loading: false });
              return;
            }

            // If we got here, the table exists and we have favorites
            if (favorites && favorites.length > 0) {
              const propertyIds = favorites.map(f => f.property_id);
              const { data: properties } = await supabase
                .from('properties')
                .select('*')
                .in('id', propertyIds);

              set({ favorites: properties || [], loading: false });
            } else {
              // No favorites found for this user
              set({ favorites: [], loading: false });
            }
          } catch (innerError) {
            // Handle any other errors
            console.error('Error in fetchFavorites:', innerError);
            set({ favorites: [], loading: false });
          }
        } catch (error) {
          // Handle outer errors (like auth errors)
          console.error('Failed to fetch favorites:', error);
          set({ favorites: [], loading: false });
        }
      },

      fetchMatches: async () => {
        try {
          set({ loading: true, error: null });
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            // If no user, just set empty matches and return
            set({ matches: [], loading: false });
            return;
          }

          try {
            // First check if the matches table exists by trying to query it
            const { data: matches, error } = await supabase
              .from('matches')
              .select('property_id')
              .eq('user_id', user.id);

            if (error) {
              // If there's an error (like table not found), just set empty matches
              console.warn('Matches table may not exist:', error.message);
              set({ matches: [], loading: false });
              return;
            }

            // If we got here, the table exists and we have matches
            if (matches && matches.length > 0) {
              const propertyIds = matches.map(m => m.property_id);
              const { data: properties } = await supabase
                .from('properties')
                .select('*')
                .in('id', propertyIds);

              set({ matches: properties || [], loading: false });
            } else {
              // No matches found for this user
              set({ matches: [], loading: false });
            }
          } catch (innerError) {
            // Handle any other errors
            console.error('Error in fetchMatches:', innerError);
            set({ matches: [], loading: false });
          }
        } catch (error) {
          // Handle outer errors (like auth errors)
          console.error('Failed to fetch matches:', error);
          set({ matches: [], loading: false });
        }
      },

      fetchProperty: async (id: string) => {
        try {
          if (!id) {
            console.warn('fetchProperty called with empty id');
            set({ currentProperty: null, loading: false });
            return;
          }
          
          set({ loading: true, error: null });
          try {
            const property = await propertyService.getPropertyById(id);
            set({ currentProperty: property, loading: false });
          } catch (innerError) {
            console.error(`Error fetching property with id ${id}:`, innerError);
            set({ currentProperty: null, loading: false });
          }
        } catch (error) {
          console.error('Failed to fetch property:', error);
          set({ error: 'Failed to fetch property', currentProperty: null, loading: false });
        }
      },

      getPropertyById: async (id: string): Promise<Property | null> => {
        try {
          if (!id) {
            console.warn('getPropertyById called with empty id');
            return null;
          }
          
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            console.warn(`Error fetching property with id ${id}:`, error.message);
            return null;
          }
          
          return data;
        } catch (error) {
          console.error('Error fetching property:', error);
          return null;
        }
      },

      addToFavorites: async (propertyId: string) => {
        try {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.warn('Cannot add to favorites: User not authenticated');
            return;
          }

          // First check if the property is already in favorites
          const { data: existingFavorite, error: checkError } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('property_id', propertyId)
            .maybeSingle();

          if (checkError) {
            // If the error is because the table doesn't exist, we'll handle it in the insert
            if (checkError.code !== '42P01') { // 42P01 is "relation does not exist"
              console.error('Error checking favorites:', checkError);
            }
          } else if (existingFavorite) {
            // Already in favorites, just update local state
            console.log('Property already in favorites');
            // No need to update local state as fetchFavorites will be called
            return;
          }

          // Add to favorites table in Supabase
          const { error } = await supabase
            .from('favorites')
            .insert({
              user_id: user.id,
              property_id: propertyId
            });

          if (error) {
            // If it's a duplicate error (already in favorites), ignore it
            if (error.code === '23505') { // Unique constraint violation
              console.log('Property already in favorites');
            } else if (error.code === '42P01') { // Table doesn't exist
              console.warn('Favorites table does not exist. Please run the migration script.');
            } else {
              console.error('Error adding to favorites in database:', error);
              throw error;
            }
          }
          
          // Refresh favorites from database
          await get().fetchFavorites();
        } catch (error) {
          console.error('Error adding to favorites:', error);
        }
      },

      removeFromFavorites: async (propertyId: string) => {
        try {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.warn('Cannot remove from favorites: User not authenticated');
            return;
          }

          // Remove from favorites table in Supabase
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('property_id', propertyId);

          if (error) {
            console.error('Error removing from favorites in database:', error);
            throw error;
          }

          // Update local state by filtering out the removed property
          const currentFavorites = get().favorites;
          set({ favorites: currentFavorites.filter(property => property.id !== propertyId) });
        } catch (error) {
          console.error('Error removing from favorites:', error);
        }
      },

      addToRecentlyViewed: async (property: Property) => {
        set(state => ({
          recentlyViewed: [property, ...state.recentlyViewed.filter(p => p.id !== property.id)].slice(0, 10),
        }));
      },

      clearRecentlyViewed: () => {
        set({ recentlyViewed: [] });
      },

      setCurrentProperty: (property: Property | null) => {
        set({ currentProperty: property });
      },
      setCurrencyPreference: (currency: string) => {
        set({ currencyPreference: currency });
      },
      clearFilters: () => {
        set({ filters: {} });
      },

      updateFilters: (filters: Partial<PropertyFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      addProperty: async (propertyData: PropertyFormData) => {
        try {
          if (!propertyData) {
            console.warn('addProperty called with empty data');
            set({ loading: false });
            throw new Error('Property data is required');
          }
          
          set({ loading: true, error: null });
          try {
            const property = await propertyService.createProperty(propertyData);
            set(state => ({
              properties: [property, ...state.properties],
              loading: false,
            }));
            return property;
          } catch (innerError) {
            console.error('Error in addProperty:', innerError);
            set({ error: 'Failed to add property', loading: false });
            throw innerError;
          }
        } catch (error) {
          console.error('Failed to add property:', error);
          set({ error: 'Failed to add property', loading: false });
          throw error;
        }
      },

      updateProperty: async (id: string, propertyData: Partial<Property>) => {
        try {
          if (!id) {
            console.warn('updateProperty called with empty id');
            set({ loading: false });
            throw new Error('Property ID is required');
          }
          
          set({ loading: true, error: null });
          try {
            // Convert camelCase to snake_case for database columns
            const dbFormattedData: Record<string, any> = {};
            
            // Map the properties to their database column names
            if (propertyData.title !== undefined) dbFormattedData.title = propertyData.title;
            if (propertyData.description !== undefined) dbFormattedData.description = propertyData.description;
            if (propertyData.price !== undefined) dbFormattedData.price = propertyData.price;
            if (propertyData.location !== undefined) dbFormattedData.location = propertyData.location;
            if (propertyData.address !== undefined) dbFormattedData.address = propertyData.address;
            if (propertyData.type !== undefined) dbFormattedData.type = propertyData.type;
            if (propertyData.status !== undefined) dbFormattedData.status = propertyData.status;
            if (propertyData.bedrooms !== undefined) dbFormattedData.bedrooms = propertyData.bedrooms;
            if (propertyData.bathrooms !== undefined) dbFormattedData.bathrooms = propertyData.bathrooms;
            if (propertyData.area !== undefined) dbFormattedData.area = propertyData.area;
            if (propertyData.area_unit !== undefined) dbFormattedData.area_unit = propertyData.area_unit;
            if (propertyData.features !== undefined) dbFormattedData.features = propertyData.features;
            if (propertyData.userId !== undefined) dbFormattedData.userId = propertyData.userId;
            if (propertyData.ownerName !== undefined) dbFormattedData.owner_name = propertyData.ownerName;
            if (propertyData.isDistressed !== undefined) dbFormattedData.is_distressed = propertyData.isDistressed;
            if (propertyData.distressReason !== undefined) dbFormattedData.distress_reason = propertyData.distressReason;
            if (propertyData.originalPrice !== undefined) dbFormattedData.original_price = propertyData.originalPrice;
            if (propertyData.discountPercentage !== undefined) dbFormattedData.discount_percentage = propertyData.discountPercentage;
            if (propertyData.urgency !== undefined) dbFormattedData.urgency = propertyData.urgency;
            if (propertyData.estimatedValue !== undefined) dbFormattedData.estimated_value = propertyData.estimatedValue;
            if (propertyData.potentialROI !== undefined) dbFormattedData.potential_roi = propertyData.potentialROI;
            if (propertyData.marketTrend !== undefined) dbFormattedData.market_trend = propertyData.marketTrend;
            if (propertyData.isNegotiable !== undefined) dbFormattedData.is_negotiable = propertyData.isNegotiable;
            if (propertyData.listingType !== undefined) dbFormattedData.listing_type = propertyData.listingType;
            
            // Add updated_at timestamp
            dbFormattedData.updated_at = new Date().toISOString();
            
            console.log('Updating property with formatted data:', dbFormattedData);
            
            const { error } = await supabase
              .from('properties')
              .update(dbFormattedData)
              .eq('id', id);

            if (error) {
              console.error(`Error updating property with id ${id}:`, error.message);
              set({ error: 'Failed to update property', loading: false });
              throw error;
            }

            // Update local state
            set(state => ({
              properties: state.properties.map(p => 
                p.id === id ? { ...p, ...propertyData } : p
              ),
              loading: false
            }));
          } catch (innerError) {
            console.error(`Error in updateProperty for id ${id}:`, innerError);
            set({ error: 'Failed to update property', loading: false });
            throw innerError;
          }
        } catch (error) {
          console.error('Failed to update property:', error);
          set({ error: 'Failed to update property', loading: false });
          throw error;
        }
      },

      getUserProperties: async () => {
        try {
          set({ loading: true, error: null });
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            // If no user, just return empty array
            set({ loading: false });
            return [];
          }

          try {
            const { data: properties, error } = await supabase
              .from('properties')
              .select('*')
              .eq('userId', user.id)
              .order('created_at', { ascending: false }); // Use correct column name

            if (error) {
              console.warn('Error fetching user properties:', error.message);
              set({ loading: false });
              return [];
            }

            set({ loading: false });
            return properties || [];
          } catch (innerError) {
            console.error('Error in getUserProperties:', innerError);
            set({ loading: false });
            return [];
          }
        } catch (error) {
          console.error('Failed to fetch user properties:', error);
          set({ error: 'Failed to fetch user properties', loading: false });
          return [];
        }
      },
    }),
    {
      name: 'property-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist essential data that doesn't change frequently
        favorites: state.favorites,
        recentlyViewed: state.recentlyViewed.slice(0, 5), // Limit to 5 recent items
        currencyPreference: state.currencyPreference,
        filters: state.filters,
        // Exclude large data arrays that can be fetched from the API
        // properties: [], matches: [], featuredProperties: [], distressedDeals: []
      }),
    }
  )
);

export default usePropertyStore;
