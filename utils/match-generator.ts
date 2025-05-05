import { supabase } from '@/config/supabase';
import { Property } from '@/types/property';

/**
 * Calculates a match score between a user's preferences and a property
 * @param userPreferences The user's preferences
 * @param property The property to match against
 * @returns A score between 0 and 100
 */
export const calculateMatchScore = (userPreferences: any, property: Property): number => {
  let score = 0;
  let totalFactors = 0;

  // Match by price range (30% weight)
  if (userPreferences.propertyPreferences?.budget) {
    totalFactors += 30;
    const { min, max } = userPreferences.propertyPreferences.budget;
    
    if (property.price >= min && property.price <= max) {
      // Perfect match
      score += 30;
    } else if (property.price < min) {
      // Below budget (good)
      const percentBelow = 1 - (min - property.price) / min;
      score += 30 * Math.max(0, percentBelow);
    } else if (property.price > max) {
      // Above budget (not as good)
      const percentAbove = 1 - (property.price - max) / max;
      score += 30 * Math.max(0, percentAbove) * 0.7; // Penalty for being over budget
    }
  }

  // Match by location (25% weight)
  if (userPreferences.location && property.location) {
    totalFactors += 25;
    const userLocation = userPreferences.location.toLowerCase();
    const propertyLocation = property.location.toLowerCase();
    
    if (propertyLocation.includes(userLocation) || userLocation.includes(propertyLocation)) {
      score += 25;
    } else {
      // Check if city matches
      const userCity = userLocation.split(',')[0].trim();
      if (propertyLocation.includes(userCity)) {
        score += 15; // Partial match
      }
    }
  }

  // Match by property type (20% weight)
  if (userPreferences.propertyPreferences?.types && property.type) {
    totalFactors += 20;
    const preferredTypes = userPreferences.propertyPreferences.types;
    
    // Map user preference types to property types
    const typeMapping: Record<string, string[]> = {
      'buy': ['apartment', 'villa', 'townhouse', 'penthouse', 'duplex'],
      'rent': ['apartment', 'villa', 'townhouse', 'penthouse', 'duplex'],
      'invest': ['apartment', 'commercial', 'land', 'retail', 'office']
    };
    
    // Flatten the array of arrays into a single array of property types
    const expandedTypes = preferredTypes.flatMap((type: string) => typeMapping[type] || []);
    
    if (expandedTypes.includes(property.type.toLowerCase())) {
      score += 20;
    }
  }

  // Match by bedrooms (15% weight)
  if (userPreferences.propertyPreferences?.bedrooms !== undefined && property.bedrooms !== undefined) {
    totalFactors += 15;
    const preferredBedrooms = userPreferences.propertyPreferences.bedrooms;
    
    if (property.bedrooms === preferredBedrooms) {
      score += 15;
    } else {
      // Partial match based on how close it is
      const difference = Math.abs(property.bedrooms - preferredBedrooms);
      if (difference === 1) {
        score += 10;
      } else if (difference === 2) {
        score += 5;
      }
    }
  }

  // Match by bathrooms (10% weight)
  if (userPreferences.propertyPreferences?.bathrooms !== undefined && property.bathrooms !== undefined) {
    totalFactors += 10;
    const preferredBathrooms = userPreferences.propertyPreferences.bathrooms;
    
    if (property.bathrooms === preferredBathrooms) {
      score += 10;
    } else {
      // Partial match based on how close it is
      const difference = Math.abs(property.bathrooms - preferredBathrooms);
      if (difference === 1) {
        score += 7;
      } else if (difference === 2) {
        score += 3;
      }
    }
  }

  // If no factors were considered, return 0
  if (totalFactors === 0) return 0;
  
  // Normalize score to account for missing factors
  const normalizedScore = (score / totalFactors) * 100;
  
  return Math.round(normalizedScore);
};

/**
 * Generates property matches for a user based on their preferences
 * @param userId The user's ID
 * @returns An array of match objects with property IDs and scores
 */
export const generateMatchesForUser = async (userId: string) => {
  try {
    // Get user profile with preferences
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !userProfile) {
      console.error('Error fetching user profile:', userError?.message);
      return [];
    }
    
    // Get all available properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'available');
    
    if (propertiesError || !properties) {
      console.error('Error fetching properties:', propertiesError?.message);
      return [];
    }
    
    // Calculate match scores for each property
    const matches = properties.map(property => ({
      user_id: userId,
      property_id: property.id,
      match_score: calculateMatchScore(userProfile, property)
    }));
    
    // Filter out low-scoring matches (below 40%)
    const goodMatches = matches.filter(match => match.match_score >= 40);
    
    // Sort by match score (highest first)
    goodMatches.sort((a, b) => b.match_score - a.match_score);
    
    return goodMatches;
  } catch (error) {
    console.error('Error generating matches:', error);
    return [];
  }
};

/**
 * Saves generated matches to the database
 * @param matches Array of match objects with user_id, property_id, and match_score
 * @returns True if successful, false otherwise
 */
export const saveMatchesToDatabase = async (matches: any[]) => {
  try {
    if (matches.length === 0) return true;
    
    // Delete existing matches for this user
    const userId = matches[0].user_id;
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Error deleting existing matches:', deleteError.message);
      return false;
    }
    
    // Insert new matches
    const { error: insertError } = await supabase
      .from('matches')
      .insert(matches);
    
    if (insertError) {
      console.error('Error inserting matches:', insertError.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving matches to database:', error);
    return false;
  }
};

/**
 * Generates and saves property matches for all users
 * @returns The number of users processed
 */
export const generateMatchesForAllUsers = async () => {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');
    
    if (usersError || !users) {
      console.error('Error fetching users:', usersError?.message);
      return 0;
    }
    
    let successCount = 0;
    
    // Generate and save matches for each user
    for (const user of users) {
      const matches = await generateMatchesForUser(user.id);
      const success = await saveMatchesToDatabase(matches);
      if (success) successCount++;
    }
    
    return successCount;
  } catch (error) {
    console.error('Error generating matches for all users:', error);
    return 0;
  }
};
