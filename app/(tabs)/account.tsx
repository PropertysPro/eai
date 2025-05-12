import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  LogOut,
  Heart,
  MessageSquare,
  Clock,
  Home,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Bell,
  Plus,
  Sparkles,
  Shield,
} from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import NotificationBell from '@/components/NotificationBell';
import { useNotifications } from '@/store/notification-store';

export default function AccountScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { unreadCount, fetchNotifications } = useNotifications();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateTo = (route: string) => {
    router.push(route);
  };

  const renderMenuItem = (
    icon: React.ReactNode,
    label: string,
    route: string,
    badge?: number
  ) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => navigateTo(route)}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {badge !== undefined && badge > 0 && (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
        <ChevronRight size={20} color={Colors.textLight} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Account',
          headerRight: () => <NotificationBell style={styles.headerIcon} />,
        }}
      />

      <ScrollView style={styles.scrollView}>
        {isAuthenticated ? (
          <>
            <View style={styles.profileSection}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={require('@/assets/favicon-logo.png')}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{user?.name || 'User'}</Text>
                  <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                  <View style={styles.subscriptionBadge}>
                    <Sparkles size={14} color="white" />
                    <Text style={styles.subscriptionText}>
                      {user?.subscription ? user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1) : 'Free'} Plan
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigateTo('/profile')}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Properties</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Saved</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.message_count || 0}</Text>
                  <Text style={styles.statLabel}>Messages</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Account</Text>
            </View>

            {renderMenuItem(
              <User size={22} color={Colors.text} style={styles.menuIcon} />,
              'Profile',
              '/profile'
            )}
            
            {renderMenuItem(
              <Bell size={22} color={Colors.text} style={styles.menuIcon} />,
              'Notifications',
              '/notifications',
              unreadCount
            )}

            {renderMenuItem(
              <Sparkles size={22} color={Colors.text} style={styles.menuIcon} />,
              'Subscription',
              '/subscription'
            )}

            {renderMenuItem(
              <Settings size={22} color={Colors.text} style={styles.menuIcon} />,
              'Settings',
              '/settings'
            )}

            {/* Admin Panel option - only visible to admin users */}
            {isAdmin && renderMenuItem(
              <Shield size={22} color={Colors.text} style={styles.menuIcon} />,
              'Admin Panel',
              '/admin'
            )}

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Properties</Text>
            </View>

            {renderMenuItem(
              <Heart size={22} color={Colors.text} style={styles.menuIcon} />,
              'Saved Properties',
              '/(tabs)/saved'
            )}

            {renderMenuItem(
              <Home size={22} color={Colors.text} style={styles.menuIcon} />,
              'My Properties',
              '/my-properties'
            )}

            {renderMenuItem(
              <Plus size={22} color={Colors.text} style={styles.menuIcon} />,
              'Add Property',
              '/add-edit-property'
            )}

            {renderMenuItem(
              <Home size={22} color={Colors.text} style={styles.menuIcon} />,
              'Distressed Deals',
              '/distressed-deals'
            )}

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Communication</Text>
            </View>

            {renderMenuItem(
              <MessageSquare size={22} color={Colors.text} style={styles.menuIcon} />,
              'Chat',
              '/(tabs)/chat'
            )}

            {renderMenuItem(
              <Clock size={22} color={Colors.text} style={styles.menuIcon} />,
              'Chat History',
              '/history'
            )}

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Support</Text>
            </View>

            {renderMenuItem(
              <HelpCircle size={22} color={Colors.text} style={styles.menuIcon} />,
              'How We Work',
              '/how-we-work'
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={22} color={Colors.error} style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Version 1.0.0</Text>
          </>
        ) : (
          <View style={styles.unauthenticatedContainer}>
            <View style={styles.unauthenticatedContent}>
              <User size={60} color={Colors.textLight} />
              <Text style={styles.unauthenticatedTitle}>Sign in to your account</Text>
              <Text style={styles.unauthenticatedMessage}>
                Sign in to access your saved properties, chat history, and personalized recommendations.
              </Text>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => navigateTo('/auth/login')}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={() => navigateTo('/auth/register')}
              >
                <Text style={styles.createAccountText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>General</Text>
            </View>

            {renderMenuItem(
              <Settings size={22} color={Colors.text} style={styles.menuIcon} />,
              'Settings',
              '/settings'
            )}

            {renderMenuItem(
              <HelpCircle size={22} color={Colors.text} style={styles.menuIcon} />,
              'How We Work',
              '/how-we-work'
            )}

            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerIcon: {
    marginRight: 16,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  subscriptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFEBEE', // Light red background
    borderRadius: 8,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 24,
    marginBottom: 40,
  },
  unauthenticatedContainer: {
    flex: 1,
  },
  unauthenticatedContent: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  unauthenticatedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  unauthenticatedMessage: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  createAccountText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
