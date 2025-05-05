import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api-service';
import { PropertyMatch } from '@/types/chat';
import supabase from '@/config/supabase';

interface PropertiesState {
  properties: PropertyMatch[];
  savedProperties: string[];
  isLoading: boolean;
  error: string | null;
}

export function useProperties() {
  const [state, setState] = useState<PropertiesState>({
    properties: [],
    savedProperties: [],
    isLoading: false,
    error: null,
  });

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch properties from API
  const fetchProperties = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.getPropertyMatches();
      
      setState(prev => ({
        ...prev,
        properties: response.properties,
        savedProperties: response.savedProperties || [],
        isLoading: false,
      }));
      
      return response.properties;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch properties',
      }));
      
      return [];
    }
  }, []);

  // Get property details
  const getPropertyDetails = useCallback(async (propertyId: string) => {
    try {
      return await apiService.getPropertyDetails(propertyId);
    } catch (error: any) {
      console.error('Error fetching property details:', error);
      throw error;
    }
  }, []);

  // Save property
  const saveProperty = useCallback(async (propertyId: string) => {
    try {
      await apiService.saveProperty(propertyId);
      
      setState(prev => ({
        ...prev,
        savedProperties: [...prev.savedProperties, propertyId],
      }));
    } catch (error: any) {
      console.error('Error saving property:', error);
      throw error;
    }
  }, []);

  // Unsave property
  const unsaveProperty = useCallback(async (propertyId: string) => {
    try {
      await apiService.unsaveProperty(propertyId);
      
      setState(prev => ({
        ...prev,
        savedProperties: prev.savedProperties.filter(id => id !== propertyId),
      }));
    } catch (error: any) {
      console.error('Error unsaving property:', error);
      throw error;
    }
  }, []);

  // Toggle save property
  const toggleSaveProperty = useCallback(async (propertyId: string) => {
    const isSaved = state.savedProperties.includes(propertyId);
    
    if (isSaved) {
      await unsaveProperty(propertyId);
    } else {
      await saveProperty(propertyId);
    }
  }, [state.savedProperties, saveProperty, unsaveProperty]);

  return {
    ...state,
    fetchProperties,
    getPropertyDetails,
    saveProperty,
    unsaveProperty,
    toggleSaveProperty,
  };
}