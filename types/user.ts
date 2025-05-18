export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  country?: string; // Added country field
  preferences: {
    language: string;
    darkMode: boolean;
    biometricAuth: boolean;
    notifications: {
      matches: boolean;
      marketUpdates: boolean;
      newListings: boolean;
      subscriptionUpdates: boolean;
    };
    propertyPreferences: {
      types: string[];
      budget: {
        min: number;
        max: number;
      };
      bedrooms: number;
      bathrooms: number;
      locations: string[];
    };
    location: string;
    currency: string;
    isNegotiable: boolean;
    requestingPrice?: number;
  };
  subscription: string;
  message_count: number;
  message_limit: number;
  created_at: string;
  updated_at: string;
  role: string;
  onboarding_completed: boolean;
  email_verified: boolean;
  // Realtor license information (optional)
  reraLicenseNumber?: string;
  dldLicenseNumber?: string;
  admLicenseNumber?: string;

  // Realtor/Seller specific profile information
  city?: string; // City they primarily work in
  experienceYears?: number; // Years of experience
  specialties?: string[]; // Areas of expertise, e.g., ["Luxury Villas", "Commercial Real Estate"]
  languagesSpoken?: string[]; // e.g., ["English", "Arabic"]
  bio?: string; // Short biography

  // Reviews and Ratings
  averageRating?: number; // Calculated average rating
  reviewCount?: number; // Total number of reviews
  reviews?: Review[]; // Array of reviews

  // Visibility request for Properties Market
  // request_properties_market_visibility?: boolean; // Replaced by status field
  properties_market_status?: 'not_requested' | 'pending_approval' | 'approved' | 'rejected';
  is_visible?: boolean;

  // Social media links
  linkedin_url?: string;
  youtube_url?: string;
  whatsapp_number?: string;
  tiktok_url?: string;
  instagram_url?: string;
  snapchat_username?: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number; // e.g., 1-5
  comment?: string;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
  currency: string;
  propertyAlerts: boolean;
  marketUpdates: boolean;
  savedSearches: SavedSearch[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    features?: string[];
  };
  createdAt: string;
  lastRun?: string;
}

export interface UserStats {
  propertiesViewed: number;
  favoritesSaved: number;
  searchesPerformed: number;
  messagesExchanged: number;
  lastActive: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'property' | 'message' | 'system' | 'alert';
  title: string;
  message: string;
  read: boolean;
  data?: {
    propertyId?: string;
    sessionId?: string;
    route?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'search' | 'view' | 'favorite' | 'message' | 'login';
  details: string;
  metadata?: any;
  timestamp: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'canceled' | 'expired' | 'trial';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod?: string;
  features: string[];
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'paypal' | 'bank';
  isDefault: boolean;
  details: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    name?: string;
    email?: string;
  };
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  items: {
    description: string;
    amount: number;
  }[];
  pdf?: string;
}
