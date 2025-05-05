import { supabase } from '@/config/supabase';
import { Property, MarketplaceTransaction, MarketplaceMessage } from '@/types/property';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const marketplaceService = {
  async getMarketplaceListings(
    page: number = 1,
    pageSize: number = 10,
    filters: any = {}
  ): Promise<PaginatedResponse<Property>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('is_in_marketplace', true)
        .order('marketplace_listing_date', { ascending: false });

      // Apply filters if provided
      if (filters.minPrice) {
        query = query.gte('marketplace_price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('marketplace_price', filters.maxPrice);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.bedrooms) {
        query = query.gte('bedrooms', filters.bedrooms);
      }
      if (filters.bathrooms) {
        query = query.gte('bathrooms', filters.bathrooms);
      }

      // Handle pagination safely
      if (page > 1) {
        // Only use range for pagination beyond first page
        const { data, error, count } = await query.range(from, to);
        
        if (error) {
          console.error('Error fetching marketplace listings:', error);
          throw error;
        }
        
        const properties = this.mapPropertiesToModel(data);
        
        return {
          data: properties,
          total: count || 0,
          page,
          pageSize
        };
      } else {
        // For first page, use limit instead of range to avoid pagination issues
        const { data, error, count } = await query.limit(pageSize);
        
        if (error) {
          console.error('Error fetching marketplace listings:', error);
          throw error;
        }
        
        const properties = this.mapPropertiesToModel(data);
        
        return {
          data: properties,
          total: count || 0,
          page,
          pageSize
        };
      }
    } catch (error) {
      console.error('Error in getMarketplaceListings:', error);
      throw error;
    }
  },
  
  // Helper method to map database properties to model
  mapPropertiesToModel(data: any[]): Property[] {
    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      price: item.price,
      currency: item.currency,
      location: item.location,
      address: item.address,
      type: item.type,
      status: item.status,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      area: item.area,
      area_unit: item.area_unit,
      features: item.features,
      images: item.images,
      created_at: item.created_at,
      updated_at: item.updated_at,
      isInMarketplace: item.is_in_marketplace,
      marketplacePrice: item.marketplace_price,
      marketplaceListingDate: item.marketplace_listing_date,
      marketplaceDuration: item.marketplace_duration,
      ownerName: item.owner_name || ''
    }));
  },

  async getMarketplaceListing(id: string): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching marketplace listing:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      location: data.location,
      address: data.address,
      type: data.type,
      status: data.status,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      area: data.area,
      area_unit: data.area_unit,
      features: data.features,
      images: data.images,
      created_at: data.created_at,
      updated_at: data.updated_at,
      isInMarketplace: data.is_in_marketplace,
      marketplacePrice: data.marketplace_price,
      marketplaceListingDate: data.marketplace_listing_date,
      marketplaceDuration: data.marketplace_duration,
      ownerName: data.owner_name || ''
    };
  },

  async listPropertyInMarketplace(
    userId: string,
    propertyId: string,
    price: number,
    duration: number = 30
  ): Promise<boolean> {
    // Check if user is a paid member
    const isPaid = await this.isPaidMember(userId);
    if (!isPaid) {
      throw new Error('Only paid members can list properties in the marketplace. Please upgrade your subscription.');
    }
    
    try {
      const { data, error } = await supabase.rpc('list_property_in_marketplace', {
        p_user_id: userId,
        p_property_id: propertyId,
        p_price: price,
        p_duration: duration
      });

      if (error) {
        console.error('Error listing property in marketplace:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in listPropertyInMarketplace:', error);
      throw error;
    }
  },

  async removePropertyFromMarketplace(
    userId: string,
    propertyId: string
  ): Promise<boolean> {
    // First check if user owns the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      console.error('Error fetching property:', propertyError);
      throw propertyError;
    }

    if (property.user_id !== userId) {
      throw new Error('You can only remove your own properties from the marketplace');
    }

    // Update property to remove from marketplace
    const { error } = await supabase
      .from('properties')
      .update({
        is_in_marketplace: false,
        marketplace_price: null,
        marketplace_listing_date: null,
        marketplace_duration: null
      })
      .eq('id', propertyId);

    if (error) {
      console.error('Error removing property from marketplace:', error);
      throw error;
    }

    return true;
  },

  async purchaseMarketplaceListing(
    buyerId: string,
    propertyId: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('purchase_marketplace_listing', {
      p_buyer_id: buyerId,
      p_property_id: propertyId
    });

    if (error) {
      console.error('Error purchasing marketplace listing:', error);
      throw error;
    }

    return data;
  },

  async getMarketplaceTransaction(id: string): Promise<MarketplaceTransaction> {
    const { data, error } = await supabase
      .from('marketplace_transactions')
      .select(`
        *,
        buyer:buyer_id(id, name, avatar),
        seller:seller_id(id, name, avatar),
        property:listing_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching marketplace transaction:', error);
      throw error;
    }

    return {
      id: data.id,
      buyerId: data.buyer_id,
      sellerId: data.seller_id,
      listingId: data.listing_id,
      salePrice: data.sale_price,
      platformFee: data.platform_fee,
      sellerEarning: data.seller_earning,
      createdAt: data.created_at,
      property: data.property ? {
        id: data.property.id,
        userId: data.property.user_id,
        title: data.property.title,
        description: data.property.description,
        price: data.property.price,
        currency: data.property.currency,
        location: data.property.location,
        address: data.property.address,
        type: data.property.type,
        status: data.property.status,
        bedrooms: data.property.bedrooms,
        bathrooms: data.property.bathrooms,
        area: data.property.area,
        area_unit: data.property.area_unit,
        features: data.property.features || [],
        images: data.property.images || [],
        created_at: data.property.created_at,
        updated_at: data.property.updated_at
      } : undefined,
      buyer: data.buyer ? {
        id: data.buyer.id,
        name: data.buyer.name,
        avatar: data.buyer.avatar
      } : undefined,
      seller: data.seller ? {
        id: data.seller.id,
        name: data.seller.name,
        avatar: data.seller.avatar
      } : undefined
    };
  },

  async getUserMarketplaceTransactions(
    userId: string,
    type: 'buyer' | 'seller' | 'all' = 'all',
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<MarketplaceTransaction>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('marketplace_transactions')
      .select(`
        *,
        buyer:buyer_id(id, name, avatar),
        seller:seller_id(id, name, avatar),
        property:listing_id(id, title, images, description, price, location, type, status, area, area_unit, features, user_id, created_at, updated_at)
      `, { count: 'exact' });

    if (type === 'buyer') {
      query = query.eq('buyer_id', userId);
    } else if (type === 'seller') {
      query = query.eq('seller_id', userId);
    } else {
      query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching user marketplace transactions:', error);
      throw error;
    }

    const transactions = data.map(item => ({
      id: item.id,
      buyerId: item.buyer_id,
      sellerId: item.seller_id,
      listingId: item.listing_id,
      salePrice: item.sale_price,
      platformFee: item.platform_fee,
      sellerEarning: item.seller_earning,
      createdAt: item.created_at,
      property: item.property ? {
        id: item.property.id,
        userId: item.property.user_id,
        title: item.property.title,
        description: item.property.description || '',
        price: item.property.price || 0,
        location: item.property.location || '',
        type: item.property.type || 'apartment',
        status: item.property.status || 'available',
        area: item.property.area || 0,
        area_unit: item.property.area_unit || 'sqft',
        features: item.property.features || [],
        images: item.property.images || [],
        created_at: item.property.created_at,
        updated_at: item.property.updated_at
      } : undefined,
      buyer: item.buyer ? {
        id: item.buyer.id,
        name: item.buyer.name,
        avatar: item.buyer.avatar
      } : undefined,
      seller: item.seller ? {
        id: item.seller.id,
        name: item.seller.name,
        avatar: item.seller.avatar
      } : undefined
    }));

    return {
      data: transactions,
      total: count || 0,
      page,
      pageSize
    };
  },

  async getMarketplaceMessages(
    transactionId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<MarketplaceMessage>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('marketplace_messages')
      .select(`
        *,
        sender:sender_id(id, name, avatar)
      `, { count: 'exact' })
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching marketplace messages:', error);
      throw error;
    }

    const messages = data.map(item => ({
      id: item.id,
      transactionId: item.transaction_id,
      senderId: item.sender_id,
      content: item.content,
      createdAt: item.created_at,
      sender: item.sender ? {
        id: item.sender.id,
        name: item.sender.name,
        avatar: item.sender.avatar
      } : undefined
    }));

    return {
      data: messages,
      total: count || 0,
      page,
      pageSize
    };
  },

  async sendMarketplaceMessage(
    transactionId: string,
    senderId: string,
    content: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('marketplace_messages')
      .insert({
        transaction_id: transactionId,
        sender_id: senderId,
        content
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error sending marketplace message:', error);
      throw error;
    }

    return data.id;
  },

  async markMessageAsRead(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('marketplace_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }

    return true;
  },

  async isPaidMember(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, plan_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active subscription found
        return false;
      }
      console.error('Error checking membership status:', error);
      throw error;
    }

    // Check if the user has a paid plan (not free tier)
    return data && data.status === 'active' && data.plan_id !== 'free';
  }
};
