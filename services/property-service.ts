import { supabase } from '@/config/supabase';
import { Property, PropertyFilters, PropertyFormData } from '@/types/property';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const propertyService = {
  async createProperty(data: PropertyFormData): Promise<Property> {
    if (!data.userId) {
      throw new Error('User ID is required to create a property');
    }

    console.log('Creating property with data:', {
      ...data,
      userId: data.userId, // Log the userId mapping
    });

    const { data: property, error } = await supabase
      .from('properties')
      .insert([{
        title: data.title,
        description: data.description,
        price: data.price,
        location: data.location,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        area_unit: data.area_unit || 'sqft',
        type: data.type,
        listing_type: data.listingType,
        features: data.features,
        images: data.images,
        userId: data.userId,
        owner_name: data.ownerName,
        is_distressed: data.isDistressed,
        distress_reason: data.distressReason,
        original_price: data.originalPrice,
        discount_percentage: data.discountPercentage,
        urgency: data.urgency,
        estimated_value: data.estimatedValue,
        potential_roi: data.potentialROI,
        market_trend: data.marketTrend,
        is_negotiable: data.isNegotiable,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      throw error;
    }

    console.log('Property created successfully:', property);
    return property;
  },

  async updateProperty(id: string, data: Partial<PropertyFormData>): Promise<Property> {
    console.log('Updating property with data:', {
      id,
      ...data,
    });

    const { data: property, error } = await supabase
      .from('properties')
      .update({
        title: data.title,
        description: data.description,
        price: data.price,
        location: data.location,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        area_unit: data.area_unit || 'sqft',
        type: data.type,
        listing_type: data.listingType,
        features: data.features,
        images: data.images,
        owner_name: data.ownerName,
        is_distressed: data.isDistressed,
        distress_reason: data.distressReason,
        original_price: data.originalPrice,
        discount_percentage: data.discountPercentage,
        urgency: data.urgency,
        estimated_value: data.estimatedValue,
        potential_roi: data.potentialROI,
        market_trend: data.marketTrend,
        is_negotiable: data.isNegotiable,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      throw error;
    }

    console.log('Property updated successfully:', property);
    return property;
  },

  async deleteProperty(id: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getProperty(id: string): Promise<Property> {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return property;
  },

  async getProperties(
    filters?: PropertyFilters,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Property>> {
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' });

    if (filters) {
      if (filters.propertyType) {
        query = query.eq('propertyType', filters.propertyType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.location) {
        // Use ilike for case-insensitive partial matching on location/city
        query = query.ilike('location', `%${filters.location}%`);
      }
      // Add city filter (assuming 'location' field contains city info)
      if (filters.city && filters.city !== '') {
        query = query.ilike('location', `%${filters.city}%`);
      }
      if (filters.bedrooms) {
        query = query.eq('bedrooms', filters.bedrooms);
      }
      if (filters.bathrooms) {
        query = query.eq('bathrooms', filters.bathrooms);
      }
      if (filters.minArea) {
        query = query.gte('area', filters.minArea);
      }
      if (filters.maxArea) {
        query = query.lte('area', filters.maxArea);
      }
      if (filters.isDistressed !== undefined) {
        query = query.eq('is_distressed', filters.isDistressed); // Corrected column name
      }
    }

    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Add sorting
    query = query.order('created_at', { ascending: false }); // Corrected column name

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error); // Log the error object
      throw error;
    }

    console.log("page:", page);
    console.log("pageSize:", pageSize);
    console.log("total:", count);

    return {
      data: properties || [],
      total: count || 0,
      page,
      pageSize,
    };
  },

  async getDistressedDeals(
    page: number = 1,
    city?: string | null, // Add city parameter
    pageSize: number = 10
  ): Promise<PaginatedResponse<Property>> {
    const filters: PropertyFilters = { isDistressed: true };
    if (city) {
      filters.city = city; // Add city to filters if provided
    }
    return this.getProperties(filters, page, pageSize);
  },

  async getUserProperties(userId: string): Promise<Property[]> {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return properties;
  },

  async uploadPropertyImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `property-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('properties')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('properties')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async deletePropertyImage(url: string): Promise<void> {
    const path = url.split('/').pop();
    if (!path) throw new Error('Invalid image URL');

    const { error } = await supabase.storage
      .from('properties')
      .remove([`property-images/${path}`]);

    if (error) throw error;
  },

  async getPropertyById(id: string): Promise<Property | null> {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return property;
  },

  async getPropertiesByUserId(userId: string): Promise<Property[]> {
    console.log('[PropertyService] Fetching properties for user ID:', userId);
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('userId', userId) // Ensure this matches your table's column name for user ID
      .order('created_at', { ascending: false }); // Ensure 'created_at' is the correct column name

    if (error) {
      console.error('[PropertyService] Error fetching properties by user ID:', error.message);
      throw error;
    }
    
    console.log(`[PropertyService] Found ${properties?.length || 0} properties for user ID: ${userId}`);
    return properties || [];
  },
};
