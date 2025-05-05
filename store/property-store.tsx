import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { Property } from '@/types/property';
import { formatPrice } from '@/utils/format';

interface PropertyContextType {
  properties: Property[];
  loading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
  fetchDistressedDeals: () => Promise<void>;
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  getPropertyById: (id: string) => Promise<Property | null>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      console.log("setProperties in fetchProperties called", data);
      setProperties(data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistressedDeals = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('isDistressed', true)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
    } catch (err) {
      console.error('Error fetching distressed deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch distressed deals');
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('properties')
        .insert([property])
        .select()
        .single();

      if (error) throw error;

      setProperties(prev => [data, ...prev]);
    } catch (err) {
      console.error('Error adding property:', err);
      setError(err instanceof Error ? err.message : 'Failed to add property');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (id: string, property: Partial<Property>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('properties')
        .update(property)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProperties(prev => prev.map(p => p.id === id ? data : p));
    } catch (err) {
      console.error('Error updating property:', err);
      setError(err instanceof Error ? err.message : 'Failed to update property');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting property:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete property');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPropertyById = async (id: string): Promise<Property | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error fetching property:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch property');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect in property-store.tsx called");
    fetchProperties();
  }, []);

  return (
    <PropertyContext.Provider
      value={{
        properties,
        loading,
        error,
        fetchProperties,
        fetchDistressedDeals,
        addProperty,
        updateProperty,
        deleteProperty,
        getPropertyById,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const usePropertyStore = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('usePropertyStore must be used within a PropertyProvider');
  }
  return context;
};
