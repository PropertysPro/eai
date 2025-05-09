import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Home,
  Search,
  Heart,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Plus,
  HelpCircle,
  Info,
  X,
  Clock,
  Sparkles,
  AlertTriangle,
  Bell,
  ShoppingBag,
  Wallet,
  Store, // Added Store icon
} from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/store/notification-store';

interface MenuDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

// Section header component for menu categories
interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
};

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.8, 300);

const MenuDrawer: React.FC<MenuDrawerProps> = ({ isVisible, onClose }) => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);
  
  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route);
    }, 300);
  };
  
  const handleLogout = async () => {
    onClose();
    setTimeout(async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }, 300);
  };
  
  const handleLogin = () => {
    onClose();
    setTimeout(() => {
      router.push('/auth/login');
    }, 300);
  };
  
  if (!isVisible) return null;
  
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: opacityAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            onPress={onClose} 
            activeOpacity={1}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {isAuthenticated ? (
                <>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userInitial}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.loginPrompt}>
                  <Text style={styles.loginPromptText}>Sign in to access all features</Text>
                  <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={handleLogin}
                  >
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.menuItems}>
            {/* Navigation section */}
            <SectionHeader title="Navigation" />
            <MenuItem 
              icon={<Home size={22} color={Colors.text} />}
              label="Home"
              onPress={() => handleNavigation('/(tabs)')}
            />
            
            <MenuItem 
              icon={<Search size={22} color={Colors.text} />}
              label="Discover Properties"
              onPress={() => handleNavigation('/(tabs)/discover')}
            />

            <MenuItem
              icon={<Store size={22} color={Colors.text} />}
              label="Properties Market"
              onPress={() => handleNavigation('/(tabs)/properties-market')}
            />
            
            {isAuthenticated && (
              <MenuItem 
                icon={<Heart size={22} color={Colors.text} />}
                label="Saved Properties"
                onPress={() => handleNavigation('/(tabs)/saved')}
              />
            )}
            
            {/* Communication section - only for authenticated users */}
            {isAuthenticated && (
              <>
                <SectionHeader title="Communication" />
                <MenuItem 
                  icon={<Bell size={22} color={Colors.text} />}
                  label="Notifications"
                  badge={unreadCount > 0 ? unreadCount : undefined}
                  onPress={() => handleNavigation('/notifications')}
                />
                
                <MenuItem 
                  icon={<MessageSquare size={22} color={Colors.text} />}
                  label="Chat"
                  onPress={() => handleNavigation('/(tabs)/chat')}
                />
                
                <MenuItem 
                  icon={<Clock size={22} color={Colors.text} />}
                  label="Chat History"
                  onPress={() => handleNavigation('/history')}
                />
              </>
            )}
            
            {/* Property Management - only for authenticated users */}
            {isAuthenticated && (
              <>
                <SectionHeader title="Property Management" />
                <MenuItem 
                  icon={<AlertTriangle size={22} color={Colors.text} />}
                  label="Distressed Deals"
                  onPress={() => handleNavigation('/distressed-deals')}
                />
                
                <MenuItem 
                  icon={<Plus size={22} color={Colors.text} />}
                  label="Add Property"
                  onPress={() => handleNavigation('/add-edit-property')}
                />
                
                <MenuItem 
                  icon={<User size={22} color={Colors.text} />}
                  label="My Properties"
                  onPress={() => handleNavigation('/my-properties')}
                />

                <MenuItem 
                  icon={<ShoppingBag size={22} color={Colors.text} />}
                  label="Marketplace"
                  onPress={() => handleNavigation('/(tabs)/marketplace')}
                />
              </>
            )}
            
            {/* Wallet - only for authenticated users */}
            {isAuthenticated && (
              <>
                <SectionHeader title="Finances" />
                <MenuItem 
                  icon={<Wallet size={22} color={Colors.text} />}
                  label="Wallet"
                  onPress={() => handleNavigation('/(tabs)/wallet')}
                />
              </>
            )}
            
            {/* Account section */}
            <SectionHeader title="Account" />
            {isAuthenticated ? (
              <>
                <MenuItem 
                  icon={<User size={22} color={Colors.text} />}
                  label="Profile"
                  onPress={() => handleNavigation('/profile')}
                />

                <MenuItem
                  icon={<User size={22} color={Colors.text} />}
                  label="My Public Profile"
                  onPress={() => handleNavigation(user ? `/public-profile?userId=${user.id}` : '/auth/login')}
                />
                
                <MenuItem 
                  icon={<Sparkles size={22} color={Colors.text} />}
                  label="Subscription"
                  onPress={() => handleNavigation('/subscription')}
                />
                
                <MenuItem 
                  icon={<Settings size={22} color={Colors.text} />}
                  label="Settings"
                  onPress={() => handleNavigation('/settings')}
                />
              </>
            ) : (
              <MenuItem 
                icon={<User size={22} color={Colors.text} />}
                label="Create Account"
                onPress={() => handleNavigation('/auth/register')}
              />
            )}
            
            {/* Information section */}
            <SectionHeader title="Information" />
            <MenuItem 
              icon={<HelpCircle size={22} color={Colors.text} />}
              label="How We Work"
              onPress={() => handleNavigation('/how-we-work')}
            />
            
            <MenuItem 
              icon={<Info size={22} color={Colors.text} />}
              label="About"
              onPress={() => handleNavigation('/version')}
            />
            
            {isAuthenticated && (
              <MenuItem 
                icon={<LogOut size={22} color={Colors.error} />}
                label="Logout"
                labelStyle={{ color: Colors.error }}
                onPress={handleLogout}
              />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  labelStyle?: object;
  badge?: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, labelStyle, badge }) => {
  const [isPressed, setIsPressed] = React.useState(false);
  
  return (
    <TouchableOpacity 
      style={[
        styles.menuItem,
        isPressed && styles.menuItemPressed
      ]} 
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemIcon}>{icon}</View>
      <Text style={[styles.menuItemLabel, labelStyle]}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropTouchable: {
    flex: 1,
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: Colors.background,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(98, 0, 238, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userInitial: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  loginPrompt: {
    flex: 1,
  },
  loginPromptText: {
    fontSize: 15,
    color: Colors.textLight,
    marginBottom: 10,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 229, 229, 0.5)',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(98, 0, 238, 0.05)',
  },
  menuItemIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 20,
  },
  menuItemLabel: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MenuDrawer;
