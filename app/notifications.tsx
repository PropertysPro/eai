import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator,
  Animated,
  SectionList,
  Pressable
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Bell, 
  ArrowLeft, 
  Home, 
  AlertTriangle, 
  MessageSquare, 
  Info, 
  Check, 
  Trash2, 
  Filter,
  X
} from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useNotifications } from '@/store/notification-store';
import { useAuth } from '@/context/auth-context';
import { Notification } from '@/types/user';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAllNotifications,
    isLoading 
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Animate filter menu
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showFilterMenu ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showFilterMenu, fadeAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const toggleFilterMenu = () => {
    setShowFilterMenu(!showFilterMenu);
  };

  const applyFilter = (type: string | null) => {
    setFilterType(type);
    setShowFilterMenu(false);
  };

  const filteredNotifications = useMemo(() => {
    if (!filterType) return notifications;
    return notifications.filter(notification => notification.type === filterType);
  }, [notifications, filterType]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0);
    
    const groups: {title: string, data: Notification[]}[] = [
      { title: 'Today', data: [] },
      { title: 'Yesterday', data: [] },
      { title: 'This Week', data: [] },
      { title: 'Earlier', data: [] }
    ];
    
    filteredNotifications.forEach(notification => {
      const notifDate = new Date(notification.createdAt).setHours(0, 0, 0, 0);
      
      if (notifDate === today) {
        groups[0].data.push(notification);
      } else if (notifDate === yesterday) {
        groups[1].data.push(notification);
      } else if (notifDate > today - 7 * 86400000) {
        groups[2].data.push(notification);
      } else {
        groups[3].data.push(notification);
      }
    });
    
    // Remove empty groups
    return groups.filter(group => group.data.length > 0);
  }, [filteredNotifications]);

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'property':
        if (notification.data?.propertyId) {
          router.push(`/property-details?id=${notification.data.propertyId}`);
        }
        break;
      case 'message':
        if (notification.data?.sessionId) {
          router.push(`/chat?id=${notification.data.sessionId}`);
        } else {
          router.push('/(tabs)/chat');
        }
        break;
      case 'system':
        // System notifications typically don't navigate anywhere
        break;
      case 'alert':
        if (notification.data?.route) {
          router.push(notification.data.route);
        }
        break;
    }
  };

  const handleDeleteNotification = async (id: string, event: any) => {
    // Stop the parent touchable from triggering
    event.stopPropagation();
    await deleteNotification(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Home size={24} color="#FFFFFF" />;
      case 'message':
        return <MessageSquare size={24} color="#FFFFFF" />;
      case 'alert':
        return <AlertTriangle size={24} color="#FFFFFF" />;
      case 'system':
      default:
        return <Info size={24} color="#FFFFFF" />;
    }
  };

  const getNotificationIconBackground = (type: string) => {
    switch (type) {
      case 'property':
        return { backgroundColor: Colors.property.house };
      case 'message':
        return { backgroundColor: Colors.info };
      case 'alert':
        return { backgroundColor: Colors.warning };
      case 'system':
      default:
        return { backgroundColor: Colors.textLight };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    
    // For today's notifications, show time
    if (date.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0)) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // For recent notifications
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hr' : 'hrs'} ago`;
    } 
    
    // For older notifications, the section header will show the day
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <Pressable
      style={({ pressed }) => [
        styles.notificationItem,
        !item.read && styles.unreadNotification,
        pressed && styles.notificationItemPressed
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.notificationIcon, getNotificationIconBackground(item.type)]}>
        {getNotificationIcon(item.type)}
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.notificationTime}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <View style={styles.notificationFooter}>
          <Text style={styles.notificationTypeTag}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(event) => handleDeleteNotification(item.id, event)}
          >
            <Trash2 size={16} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string, data: Notification[] } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Bell size={60} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyMessage}>
        When you receive notifications about new properties, messages, or system updates, they'll appear here.
      </Text>
      {filterType && (
        <TouchableOpacity 
          style={styles.clearFilterButton}
          onPress={() => setFilterType(null)}
        >
          <Text style={styles.clearFilterText}>Clear filter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {notifications.length > 0 && (
                <>
                  <TouchableOpacity onPress={toggleFilterMenu} style={styles.filterButton}>
                    <Filter size={20} color={filterType ? Colors.primary : Colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                    <Check size={18} color={Colors.primary} />
                    <Text style={styles.markAllText}>Read all</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />

      {/* Filter Menu */}
      {showFilterMenu && (
        <Animated.View 
          style={[
            styles.filterMenu,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.filterMenuHeader}>
            <Text style={styles.filterMenuTitle}>Filter by type</Text>
            <TouchableOpacity onPress={toggleFilterMenu}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.filterOption, !filterType && styles.filterOptionSelected]} 
            onPress={() => applyFilter(null)}
          >
            <Text style={[styles.filterOptionText, !filterType && styles.filterOptionTextSelected]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, filterType === 'property' && styles.filterOptionSelected]} 
            onPress={() => applyFilter('property')}
          >
            <Home size={16} color={filterType === 'property' ? Colors.primary : Colors.text} />
            <Text style={[styles.filterOptionText, filterType === 'property' && styles.filterOptionTextSelected]}>Property</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, filterType === 'message' && styles.filterOptionSelected]} 
            onPress={() => applyFilter('message')}
          >
            <MessageSquare size={16} color={filterType === 'message' ? Colors.primary : Colors.text} />
            <Text style={[styles.filterOptionText, filterType === 'message' && styles.filterOptionTextSelected]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, filterType === 'alert' && styles.filterOptionSelected]} 
            onPress={() => applyFilter('alert')}
          >
            <AlertTriangle size={16} color={filterType === 'alert' ? Colors.primary : Colors.text} />
            <Text style={[styles.filterOptionText, filterType === 'alert' && styles.filterOptionTextSelected]}>Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, filterType === 'system' && styles.filterOptionSelected]} 
            onPress={() => applyFilter('system')}
          >
            <Info size={16} color={filterType === 'system' ? Colors.primary : Colors.text} />
            <Text style={[styles.filterOptionText, filterType === 'system' && styles.filterOptionTextSelected]}>System</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {!isAuthenticated ? (
        <View style={styles.authContainer}>
          <View style={styles.emptyIconContainer}>
            <Bell size={60} color={Colors.primary} />
          </View>
          <Text style={styles.authTitle}>Sign in to view notifications</Text>
          <Text style={styles.authMessage}>
            Create an account or sign in to receive notifications about new properties, messages, and more.
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <SectionList
            sections={groupedNotifications}
            renderItem={renderNotificationItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={isLoading ? null : renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            stickySectionHeadersEnabled={true}
          />
          
          {notifications.length > 0 && (
            <View style={styles.footerContainer}>
              <TouchableOpacity 
                style={styles.clearAllButton}
                onPress={clearAllNotifications}
              >
                <Trash2 size={16} color={Colors.error} />
                <Text style={styles.clearAllText}>Clear All Notifications</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {isLoading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 8,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  filterMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    width: 200,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  filterOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  filterOptionText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  filterOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 70, // Space for the footer
  },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  notificationItemPressed: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.9,
  },
  unreadNotification: {
    backgroundColor: '#F9F5FF', // Very light purple
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTypeTag: {
    fontSize: 12,
    color: Colors.textLight,
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: 16,
  },
  clearFilterButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  clearFilterText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  authMessage: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
    alignItems: 'center',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  clearAllText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
