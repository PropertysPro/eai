import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle, XCircle, User as UserIcon } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { User } from '@/types/user';
import adminService from '@/services/admin-service';

interface Profile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  city?: string;
  experienceYears?: number;
  subscription: string;
  is_visible?: boolean;
}

export default function RealtorVisibilityAdminPage() {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({}); // Track loading state per user ID

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const requests = await adminService.getPendingVisibilityRequests();
      setPendingRequests(requests as Profile[]);
    } catch (error) {
      console.error('Error fetching pending visibility requests:', error);
      Alert.alert('Error', 'Could not fetch pending requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await adminService.updateVisibilityStatus(userId, 'approved');
      Alert.alert('Success', 'User approved for Properties Market visibility.');
      // Refetch requests to update the list
      fetchPendingRequests();
    } catch (error) {
      console.error(`Error approving user ${userId}:`, error);
      Alert.alert('Error', 'Failed to approve user.');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await adminService.updateVisibilityStatus(userId, 'rejected');
      Alert.alert('Success', 'User rejected for Properties Market visibility.');
      // Refetch requests to update the list
      fetchPendingRequests();
    } catch (error) {
      console.error(`Error rejecting user ${userId}:`, error);
      Alert.alert('Error', 'Failed to approve user.');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const renderItem = ({ item }: { item: Profile }) => (
    <View style={styles.requestItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userDetail}>{item.email}</Text>
        <Text style={styles.userDetail}>City: {item.city || 'N/A'}</Text>
        <Text style={styles.userDetail}>Experience: {item.experienceYears || 'N/A'} years</Text>
        <Text style={styles.userDetail}>Subscription: {item.subscription}</Text>
        <Text style={styles.userDetail}>Visibility Status: {item.is_visible ? 'Approved' : 'Rejected'}</Text>
      </View>
      <View style={styles.actions}>
        {actionLoading[item.id] ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <TouchableOpacity onPress={() => handleApprove(item.id)} style={[styles.actionButton, styles.approveButton]}>
              <CheckCircle size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleReject(item.id)} style={[styles.actionButton, styles.rejectButton]}>
              <XCircle size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Realtor Hub Visibility Requests' }} />
      <FlatList
        data={pendingRequests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <UserIcon size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>No pending visibility requests.</Text>
          </View>
        }
        onRefresh={fetchPendingRequests}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  requestItem: {
    flexDirection: 'row',
    backgroundColor: colors.card.background,
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
});
