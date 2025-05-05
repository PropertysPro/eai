import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { walletService } from '@/services/wallet-service';
import { Transaction, WalletSummary } from '@/types/wallet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { formatPrice } from '@/utils/format';

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      loadWalletData();
    } else {
      router.replace('/auth/login');
    }
  }, [user]);

  const loadWalletData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!user) return;

      // Load wallet summary
      const summary = await walletService.getWalletSummary(user.id);
      setWalletSummary(summary);

      // Load transactions (first page)
      await loadTransactions(1, refresh);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTransactions = async (pageNum = 1, refresh = false) => {
    try {
      if (!user) return;

      const response = await walletService.getTransactions(user.id, pageNum);
      
      if (refresh || pageNum === 1) {
        setTransactions(response.data);
        setPage(1);
      } else {
        setTransactions(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length > 0 && response.total > pageNum * 10);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transaction history. Please try again.');
    }
  };

  const handleRefresh = () => {
    loadWalletData(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransactions(nextPage);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <Ionicons name="arrow-down-circle" size={24} color={colors.success} />;
      case 'withdrawal':
        return <Ionicons name="arrow-up-circle" size={24} color={colors.error} />;
      case 'purchase':
        return <Ionicons name="cart" size={24} color={colors.error} />;
      case 'sale':
        return <Ionicons name="cash" size={24} color={colors.success} />;
      case 'commission':
        return <Ionicons name="business" size={24} color={colors.error} />;
      default:
        return <Ionicons name="ellipsis-horizontal-circle" size={24} color={colors.textLight} />;
    }
  };

  const getTransactionTitle = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'deposit':
        return 'Wallet Deposit';
      case 'withdrawal':
        return 'Wallet Withdrawal';
      case 'purchase':
        return transaction.property 
          ? `Purchase: ${transaction.property.title}` 
          : 'Property Purchase';
      case 'sale':
        return transaction.property 
          ? `Sale: ${transaction.property.title}` 
          : 'Property Sale';
      case 'commission':
        return 'Platform Commission';
      default:
        return 'Transaction';
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => {
        if (item.relatedListingId) {
          router.push(`/property-details/${item.relatedListingId}`);
        }
      }}
    >
      <View style={styles.transactionIcon}>
        {getTransactionIcon(item.type)}
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{getTransactionTitle(item)}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString()} • {item.status}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        item.amount > 0 ? styles.positiveAmount : styles.negativeAmount
      ]}>
        {item.amount > 0 ? '+' : ''}{formatPrice(item.amount, 'AED')}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={64} color={colors.textLight} />
        <Text style={styles.emptyText}>No transactions yet</Text>
        <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading wallet data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Wallet',
        }}
      />

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatPrice(walletSummary?.balance || 0, 'AED')}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.depositButton]}
            onPress={() => router.push('/wallet/deposit')}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.button.text.primary} />
            <Text style={styles.actionButtonText}>Add Funds</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => router.push('/wallet/withdraw')}
          >
            <Ionicons name="cash-outline" size={20} color={colors.button.text.primary} />
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {walletSummary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Deposits</Text>
            <Text style={styles.summaryValue}>{formatPrice(walletSummary.totalDeposits, 'AED')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Withdrawals</Text>
            <Text style={styles.summaryValue}>{formatPrice(walletSummary.totalWithdrawals, 'AED')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Text style={styles.summaryValue}>{formatPrice(walletSummary.totalSales, 'AED')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Purchases</Text>
            <Text style={styles.summaryValue}>{formatPrice(walletSummary.totalPurchases, 'AED')}</Text>
          </View>
        </View>
      )}

      <View style={styles.transactionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity onPress={() => router.push('/wallet/transactions')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textLight,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.button.text.primary,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  depositButton: {
    backgroundColor: colors.success,
  },
  withdrawButton: {
    backgroundColor: colors.info,
  },
  actionButtonText: {
    color: colors.button.text.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 0,
  },
  summaryItem: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
  },
  listContent: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveAmount: {
    color: colors.success,
  },
  negativeAmount: {
    color: colors.error,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
});
