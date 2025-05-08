import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle, XCircle, User as UserIcon } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { User } from '@/types/user'; // Assuming User type includes properties_market_status
// import adminService from '@/services/admin-service'; // Placeholder for actual service

// Mock data for pending requests
const mockPendingRequests: User[] = [
  {
    id: 'realtor-pending-1',
    name: 'Alice Realtor',
    email: 'alice.realtor@example.com',
    role: 'realtor',
    properties_market_status: 'pending_approval',
    city: 'Dubai',
    experienceYears: 5,
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    // Add other necessary User fields with default/mock values
    preferences: {} as any, subscription: 'premium', message_count: 0, message_limit: 0, created_at: '', updated_at: '', onboarding_completed: true, email_verified: true,
  },
  {
    id: 'seller-pending-1',
    name: 'Bob Seller',
    email: 'bob.seller@example.com',
    role: 'seller',
    properties_market_status: 'pending_approval',
    city: 'Abu Dhabi',
    experienceYears: 2,
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    preferences: {} as any, subscription: 'enterprise', message_count: 0, message_limit: 0, created_at: '', updated_at: '', onboarding_completed: true, email_verified: true,
  },
];

export default function RealtorVisibilityAdminPage() {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({}); // Track loading state per user ID

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const requests = await adminService.getPendingVisibilityRequests();
      // setPendingRequests(requests);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      setPendingRequests(mockPendingRequests);
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
      // TODO: Replace with actual API call to approve
      // await adminService.updateVisibilityStatus(userId, 'approved');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      Alert.alert('Success', 'User approved for Properties Market visibility.');
      // Remove from list or refetch
      setPendingRequests(prev => prev.filter(user => user.id !== userId));
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
      // TODO: Replace with actual API call to reject
      // await adminService.updateVisibilityStatus(userId, 'rejected');
       await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      Alert.alert('Success', 'User rejected for Properties Market visibility.');
      // Remove from list or refetch
      setPendingRequests(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error(`Error rejecting user ${userId}:`, error);
      Alert.alert('Error', 'Failed to reject user.');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.requestItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userDetail}>{item.email}</Text>
        <Text style={styles.userDetail}>Role: {item.role}</Text>
        <Text style={styles.userDetail}>City: {item.city || 'N/A'}</Text>
        <Text style={styles.userDetail}>Experience: {item.experienceYears || 'N/A'} years</Text>
        <Text style={styles.userDetail}>Subscription: {item.subscription}</Text>
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
      <Stack.Screen options={{ title: 'Realtor Visibility Requests' }} />
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
