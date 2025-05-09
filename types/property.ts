import { SupportedCurrency } from '@/store/currency-store'; // Import SupportedCurrency

export type PropertyType = 
  | 'apartment'
  | 'villa'
  | 'townhouse'
  | 'penthouse'
  | 'duplex'
  | 'studio'
  | 'office'
  | 'retail'
  | 'land'
  | 'warehouse';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  address?: string;
  type: PropertyType;
  status: 'available' | 'sold' | 'pending' | 'rented' | 'inactive';
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  area_unit: 'sqft' | 'sqm';
  images: string[];
  features: string[];
  created_at: string;
  updated_at: string;
  userId: string;
  isDistressed?: boolean;
  distressReason?: string;
  originalPrice?: number;
  discountPercentage?: number;
  reason?: string;
  urgency?: 'high' | 'medium' | 'low';
  estimatedValue?: number;
  potentialROI?: number;
  marketTrend?: 'up' | 'down' | 'stable';
  lastPriceChange?: string;
  daysOnMarket?: number;
  views?: number;
  savedCount?: number;
  contactCount?: number;
  isHot?: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
  matchPercentage?: number;
  listingType?: 'sale' | 'rent';
  currency?: SupportedCurrency; // Update type here
  ownerId?: string;
  ownerName?: string;
  ownerContact?: string;
  isNegotiable?: boolean;
  // Marketplace fields
  isInMarketplace?: boolean;
  marketplacePrice?: number;
  marketplaceListingDate?: string;
  marketplaceDuration?: number;
  // New status fields
  construction_status?: 'ready' | 'off_plan';
  market_status?: 'new_to_market' | 'resale';
  inquiries?: {
    id: string;
    userId: string;
    message: string;
    createdAt: string;
    status: 'pending' | 'responded' | 'closed';
  }[];
}

export interface PropertyFilters {
  type?: PropertyType;
  propertyType?: PropertyType;
  status?: Property['status'];
  minPrice?: number;
  maxPrice?: number;
  location?: string; // General location search
  city?: string; // Specific city filter
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  isDistressed?: boolean;
  listingType?: 'sale' | 'rent';
}

export interface PropertyFormData {
  title: string;
  description: string;
  price: number;
  location: string;
  type: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  area_unit: 'sqft' | 'sqm';
  images: string[];
  features: string[];
  isDistressed?: boolean;
  distressReason?: string;
  originalPrice?: number;
  discountPercentage?: number;
  listingType?: 'sale' | 'rent';
  currency?: SupportedCurrency; // And here for PropertyFormData
  isNegotiable?: boolean;
  userId?: string;
  urgency?: 'high' | 'medium' | 'low';
  estimatedValue?: number;
  potentialROI?: number;
  marketTrend?: 'up' | 'down' | 'stable';
  ownerName?: string;
  // Marketplace fields
  isInMarketplace?: boolean;
  marketplacePrice?: number;
  marketplaceDuration?: number;
}

// Marketplace transaction interfaces
export interface MarketplaceTransaction {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  salePrice: number;
  platformFee: number;
  sellerEarning: number;
  createdAt: string;
  property?: Property;
  buyer?: {
    id: string;
    name: string;
    avatar?: string;
  };
  seller?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface MarketplaceMessage {
  id: string;
  transactionId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}
