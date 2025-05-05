import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { walletService } from '@/services/wallet-service';
import { Transaction } from '@/types/wallet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { formatPrice } from '@/utils/format';

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      loadTransactions();
    } else {
      router.replace('/auth/login');
    }
  }, [user]);

  const loadTransactions = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadTransactions(1, true);
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Transaction History',
        }}
      />

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
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerText}>All Transactions</Text>
          </View>
        }
      />

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 80,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
