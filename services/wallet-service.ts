import { supabase } from '@/config/supabase';
import { Wallet, Transaction, WithdrawalRequest, WalletSummary } from '@/types/wallet';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const walletService = {
  async getWallet(userId: string): Promise<Wallet> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      balance: data.balance,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async getWalletSummary(userId: string): Promise<WalletSummary> {
    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError) {
      console.error('Error fetching wallet:', walletError);
      throw walletError;
    }

    // Get transaction totals
    const { data: deposits, error: depositsError } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'deposit')
      .eq('status', 'completed');

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError);
      throw depositsError;
    }

    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'withdrawal')
      .eq('status', 'completed');

    if (withdrawalsError) {
      console.error('Error fetching withdrawals:', withdrawalsError);
      throw withdrawalsError;
    }

    const { data: sales, error: salesError } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'sale')
      .eq('status', 'completed');

    if (salesError) {
      console.error('Error fetching sales:', salesError);
      throw salesError;
    }

    const { data: purchases, error: purchasesError } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'purchase')
      .eq('status', 'completed');

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      throw purchasesError;
    }

    const { data: commissions, error: commissionsError } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'commission')
      .eq('status', 'completed');

    if (commissionsError) {
      console.error('Error fetching commissions:', commissionsError);
      throw commissionsError;
    }

    // Get pending withdrawals
    const { data: pendingWithdrawals, error: pendingWithdrawalsError } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (pendingWithdrawalsError) {
      console.error('Error fetching pending withdrawals:', pendingWithdrawalsError);
      throw pendingWithdrawalsError;
    }

    // Calculate totals
    const totalDeposits = deposits.reduce((sum, item) => sum + item.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const totalSales = sales.reduce((sum, item) => sum + item.amount, 0);
    const totalPurchases = purchases.reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const totalCommissions = commissions.reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const pendingWithdrawalsTotal = pendingWithdrawals.reduce((sum, item) => sum + item.amount, 0);

    return {
      balance: wallet.balance,
      totalDeposits,
      totalWithdrawals,
      totalSales,
      totalPurchases,
      totalCommissions,
      pendingWithdrawals: pendingWithdrawalsTotal
    };
  },

  async getTransactions(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Transaction>> {
    // First check if there are any transactions for this user
    const { count } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // If no transactions exist, return empty result immediately
    if (!count || count === 0) {
      return {
        data: [],
        total: 0,
        page,
        pageSize
      };
    }
    
    // Calculate range only if we have transactions
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Only query with range if we have enough rows
    if (from >= count) {
      // Requested page is beyond available data
      return {
        data: [],
        total: count,
        page,
        pageSize
      };
    }

    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*, properties!wallet_transactions_related_listing_id_fkey(id, title, images)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    const transactions = data.map(item => ({
      id: item.id,
      userId: item.user_id,
      type: item.type,
      amount: item.amount,
      relatedListingId: item.related_listing_id,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      property: item.properties ? {
        ...item.properties,
        userId: item.properties.user_id || '',
        createdAt: item.properties.created_at || '',
        updatedAt: item.properties.updated_at || '',
        type: item.properties.type || 'apartment',
        status: item.properties.status || 'available',
        area: item.properties.area || 0,
        area_unit: item.properties.area_unit || 'sqft',
        features: item.properties.features || [],
        description: item.properties.description || '',
        location: item.properties.location || '',
        price: item.properties.price || 0
      } : undefined
    }));

    return {
      data: transactions,
      total: count || 0,
      page,
      pageSize
    };
  },

  async depositFunds(userId: string, amount: number): Promise<boolean> {
    const { data, error } = await supabase.rpc('process_wallet_deposit', {
      p_user_id: userId,
      p_amount: amount
    });

    if (error) {
      console.error('Error depositing funds:', error);
      throw error;
    }

    return data;
  },

  async requestWithdrawal(
    userId: string,
    amount: number,
    paymentDetails: any
  ): Promise<string> {
    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_user_id: userId,
      p_amount: amount,
      p_payment_details: paymentDetails
    });

    if (error) {
      console.error('Error requesting withdrawal:', error);
      throw error;
    }

    return data;
  },

  async getWithdrawalRequests(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<WithdrawalRequest>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching withdrawal requests:', error);
      throw error;
    }

    const withdrawalRequests = data.map(item => ({
      id: item.id,
      userId: item.user_id,
      amount: item.amount,
      status: item.status,
      paymentDetails: item.payment_details,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    return {
      data: withdrawalRequests,
      total: count || 0,
      page,
      pageSize
    };
  },

  // Admin functions
  async approveWithdrawal(requestId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('approve_withdrawal', {
      p_request_id: requestId
    });

    if (error) {
      console.error('Error approving withdrawal:', error);
      throw error;
    }

    return data;
  },

  async rejectWithdrawal(requestId: string): Promise<boolean> {
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting withdrawal:', error);
      throw error;
    }

    return true;
  },

  async getAllWithdrawalRequests(
    status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending',
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<WithdrawalRequest & { user: { name: string, email: string } }>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('withdrawal_requests')
      .select('*, profiles!withdrawal_requests_user_id_fkey(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching all withdrawal requests:', error);
      throw error;
    }

    const withdrawalRequests = data.map(item => ({
      id: item.id,
      userId: item.user_id,
      amount: item.amount,
      status: item.status,
      paymentDetails: item.payment_details,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      user: {
        name: item.profiles.name,
        email: item.profiles.email
      }
    }));

    return {
      data: withdrawalRequests,
      total: count || 0,
      page,
      pageSize
    };
  }
};
