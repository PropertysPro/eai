import axios from 'axios';
import { API_URL } from '@/config/env';
import { Attachment, PropertyMatch } from '@/types/chat';
import supabase from '@/config/supabase';

class ApiService {
  async getProperties(filters = {}) {
    try {
      // Use Supabase to fetch properties
      let query = supabase.from('properties').select('*');
      
      // Apply filters if any
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  }
  
  async getPropertyById(id: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error fetching property with id ${id}:`, error);
      return null;
    }
  }
  
  async saveProperty(propertyData: any) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select();
        
      if (error) throw error;
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  }
  
  async updateProperty(id: string, propertyData: any) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      return data?.[0] || null;
    } catch (error) {
      console.error(`Error updating property with id ${id}:`, error);
      throw error;
    }
  }
  
  async deleteProperty(id: string) {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error(`Error deleting property with id ${id}:`, error);
      throw error;
    }
  }
  
  async getPropertyMatches() {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { properties: [], savedProperties: [] };
      }
      
      // Get user preferences
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', session.user.id)
        .single();
        
      if (userError) throw userError;
      
      // Get properties that match user preferences
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('is_match', true);
        
      if (propertiesError) throw propertiesError;
      
      // Get saved properties
      const { data: savedData, error: savedError } = await supabase
        .from('saved_properties')
        .select('propertyId')
        .eq('userId', session.user.id);
        
      if (savedError) throw savedError;
      
      const savedProperties = savedData?.map(item => item.propertyId) || [];
      
      return { properties: properties || [], savedProperties };
    } catch (error) {
      console.error('Error fetching property matches:', error);
      return { properties: [], savedProperties: [] };
    }
  }
  
  async getPropertyDetails(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching property details:', error);
      throw error;
    }
  }
  
  async savePropertyToFavorites(propertyId: string) {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Save property
      const { error } = await supabase
        .from('saved_properties')
        .insert({
          userId: session.user.id,
          propertyId: propertyId,
          savedAt: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  }
  
  async unsaveProperty(propertyId: string) {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Unsave property
      const { error } = await supabase
        .from('saved_properties')
        .delete()
        .eq('userId', session.user.id)
        .eq('propertyId', propertyId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error unsaving property:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();