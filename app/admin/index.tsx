import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { 
  Users, 
  MessageSquare, 
  Home, 
  Settings, 
  BarChart, 
  Bell, 
  Database,
  Search,
  AlertTriangle,
  Check,
  X,
  Clock,
  Tag,
  Filter,
  Calendar,
  Send,
  Info,
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  CreditCard,
  Eye // Added Eye icon for visibility requests
} from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useNotifications } from '@/store/notification-store';
import { useRouter } from 'expo-router'; // Import useRouter
import { useSupportStore } from '@/store/support-store';
import * as authService from '@/services/auth-service';
import { User as UserType } from '@/types/user';
import { supabase } from '@/config/supabase';
import { ChatMessage } from '@/types/chat';
import { Property } from '@/types/property';
import { getAllProperties } from '@/services/supabase-service';
import { useAuth } from '@/context/auth-context';

// Extended ChatSession type with user information
interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  messages: ChatMessage[];
  category?: string;
  tags?: string[];
  isAdminChat?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface DistressedDeal {
  id: string;
  title: string;
  location: string;
  originalPrice: number;
  price: number;
  currency: string;
  distressReason: string;
  owner: string;
  submittedDate: string;
  imageUrl: string;
  distressedDealDuration: number;
  totalFee: number;
}

// Function to fetch all users from Supabase
const fetchUsers = async (): Promise<UserType[]> => {
  try {
    console.log('[Admin Panel] Fetching users from Supabase');
    
    // Get the current user's session to check if they're an admin
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Admin Panel] Error getting session:', sessionError.message);
      throw sessionError;
    }
    
    if (!sessionData?.session?.user) {
      console.error('[Admin Panel] No active session found');
      throw new Error('No active session found');
    }
    
    // Get the current user's profile to check their role
    const { data: currentUserData, error: currentUserError } = await supabase
      .from('profiles')
      .select('role, roles')
      .eq('id', sessionData.session.user.id)
      .single();
    
    if (currentUserError) {
      console.error('[Admin Panel] Error fetching current user profile:', currentUserError.message);
      throw currentUserError;
    }
    
    const isAdmin = currentUserData.role === 'admin' || 
                   (Array.isArray(currentUserData.roles) && currentUserData.roles.includes('admin'));
    
    if (!isAdmin) {
      console.error('[Admin Panel] User does not have admin privileges');
      throw new Error('Unauthorized: Admin privileges required');
    }
    
    // Use RPC function to bypass RLS for admin users
    // This requires creating a stored procedure in Supabase that returns all profiles
    // If you don't have an RPC function, you can use the service role client instead
    
    // Option 1: Using RPC (if available)
    // const { data, error } = await supabase.rpc('get_all_profiles');
    
    // Option 2: Using service role client (if available)
    // const { data, error } = await supabaseAdmin.from('profiles').select('*');
    
    // Option 3: Standard query (relies on proper RLS policies for admins)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[Admin Panel] Error fetching users:', error.message);
      throw error;
    }
    
    console.log(`[Admin Panel] Successfully fetched ${data?.length} users`);
    return data as UserType[];
  } catch (error: any) {
    console.error('[Admin Panel] Error fetching users:', error.message);
    // Return empty array in case of error
    return [];
  }
};

// Default admin user as fallback
const defaultAdminUser: UserType = {
  id: 'admin',
  email: 'propertyspro@gmail.com',
  name: 'Admin User',
  role: 'admin',
  subscription: 'enterprise',
  message_count: 0,
  message_limit: 999999,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email_verified: true,
  onboarding_completed: true,
  preferences: {
    language: 'en',
    darkMode: false,
    biometricAuth: false,
    notifications: {
      matches: true,
      marketUpdates: true,
      newListings: true,
      subscriptionUpdates: true,
    },
    propertyPreferences: {
      types: [],
      budget: {
        min: 0,
        max: 1000000,
      },
      bedrooms: 2,
      bathrooms: 2,
      locations: [],
    },
    location: 'Dubai',
    currency: 'AED',
    isNegotiable: true,
  }
};

export default function AdminPanel() {
  console.log('[AdminPanel] Component rendered');
  const router = useRouter(); // Initialize router
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponseTime, setAiResponseTime] = useState(1.5);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('system');
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [filteredChatSessions, setFilteredChatSessions] = useState<ChatSession[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [searchPropertiesQuery, setSearchPropertiesQuery] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoadingProperties(true);
      try {
        const propertiesData = await getAllProperties();
        setProperties(propertiesData || []);
        setFilteredProperties(propertiesData || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        Alert.alert('Error', 'Failed to load properties from database.');
      } finally {
        setIsLoadingProperties(false);
      }
    };

    const loadData = async () => {
      setIsLoadingUsers(true);
      setIsLoadingChats(true);
      setIsLoadingProperties(true);
      
      try {
        // Fetch users
        const fetchedUsers = await fetchUsers();
        
        // If no users were fetched, add the default admin user
        if (fetchedUsers.length === 0) {
          setUsers([defaultAdminUser]);
        } else {
          setUsers(fetchedUsers);
        }
        
        // Fetch chat sessions
        const fetchedChatSessions = await fetchChatSessions();
        setChatSessions(fetchedChatSessions);
        setFilteredChatSessions(fetchedChatSessions);

        // Fetch properties
        await fetchProperties();
        
      } catch (error) {
        console.error('[Admin Panel] Error loading data:', error);
        // Use default admin user as fallback
        setUsers([defaultAdminUser]);
        Alert.alert('Error', 'Failed to load data from database.');
      } finally {
        setIsLoadingUsers(false);
        setIsLoadingChats(false);
        setIsLoadingProperties(false);
      }
    };
    
    loadData();
  }, []);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserSubscription, setNewUserSubscription] = useState('free');
  const [newUserMessageLimit, setNewUserMessageLimit] = useState('100');
  
  const { addNotification } = useNotifications();
  const { supportInfo, updateSupportInfo } = useSupportStore();
  
  // Function to fetch all chat sessions from Supabase
  const fetchChatSessions = async (): Promise<ChatSession[]> => {
    try {
      console.log('[Admin Panel] Fetching chat sessions from Supabase');
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*, profiles(name, email)')
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('[Admin Panel] Error fetching chat sessions:', error.message);
        throw error;
      }
      
      console.log(`[Admin Panel] Successfully fetched ${data?.length} chat sessions`, data);
      
      // Transform the data to match our ChatSession type
      const chatSessions: ChatSession[] = data?.map(session => ({
        id: session.id,
        title: session.title,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        messageCount: session.message_count || 0,
        messages: [],
        isAdminChat: session.is_admin_chat || false,
        // Add user information
        user: {
          id: session.user_id,
          name: session.profiles?.name || 'Unknown User',
          email: session.profiles?.email || 'unknown@example.com'
        }
      }));
      
      return chatSessions;
    } catch (error: any) {
      console.error('[Admin Panel] Error fetching chat sessions:', error.message);
      // Return empty array in case of error
      return [];
    }
  };
  
  // Function to fetch chat messages for a specific session
  const fetchChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      console.log(`[Admin Panel] Fetching messages for chat session ${sessionId}`);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('[Admin Panel] Error fetching chat messages:', error.message);
        throw error;
      }
      
      console.log(`[Admin Panel] Successfully fetched ${data?.length} messages for session ${sessionId}`);
      
      // Transform the data to match our ChatMessage type
      const messages: ChatMessage[] = data.map(message => ({
        id: message.id,
        content: message.content,
        role: message.role,
        createdAt: message.created_at,
        attachments: message.attachments || []
      }));
      
      return messages;
    } catch (error: any) {
      console.error('[Admin Panel] Error fetching chat messages:', error.message);
      // Return empty array in case of error
      return [];
    }
  };
  
  // Fetch users and chat sessions from Supabase when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingUsers(true);
      setIsLoadingChats(true);
      
      try {
        // Fetch users
        const fetchedUsers = await fetchUsers();
        
        // If no users were fetched, add the default admin user
        if (fetchedUsers.length === 0) {
          setUsers([defaultAdminUser]);
        } else {
          setUsers(fetchedUsers);
        }
        
        // Fetch chat sessions
        const fetchedChatSessions = await fetchChatSessions();
        setChatSessions(fetchedChatSessions);
        setFilteredChatSessions(fetchedChatSessions);
        
      } catch (error) {
        console.error('[Admin Panel] Error loading data:', error);
        // Use default admin user as fallback
        setUsers([defaultAdminUser]);
        Alert.alert('Error', 'Failed to load data from database.');
      } finally {
        setIsLoadingUsers(false);
        setIsLoadingChats(false);
      }
    };
    
    loadData();
  }, []);
  
  // Filter users when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(query) || 
      user.email?.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);
  
  // Mock distressed deals pending approval
  const pendingDistressedDeals: DistressedDeal[] = [
    {
      id: 'd1',
      title: 'Luxury Apartment - Urgent Sale',
      location: 'Dubai Marina',
      originalPrice: 2500000,
      price: 1950000,
      currency: 'AED',
      distressReason: 'Relocation',
      owner: 'Sarah Johnson',
      submittedDate: '2023-06-15',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a04ff0f8b?w=800&auto=format&fit=crop',
      distressedDealDuration: 14,
      totalFee: 1400,
    },
    {
      id: 'd2',
      title: 'Family Villa - Below Market Value',
      location: 'Arabian Ranches',
      originalPrice: 5800000,
      price: 4600000,
      currency: 'AED',
      distressReason: 'Financial Hardship',
      owner: 'Mohammed Al Farsi',
      submittedDate: '2023-06-14',
      imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop',
      distressedDealDuration: 7,
      totalFee: 700,
    },
    {
      id: 'd3',
      title: 'Office Space - Quick Sale',
      location: 'Business Bay',
      originalPrice: 3200000,
      price: 2650000,
      currency: 'AED',
      distressReason: 'Estate Sale',
      owner: 'Elena Petrova',
      submittedDate: '2023-06-13',
      imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&auto=format&fit=crop',
      distressedDealDuration: 30,
      totalFee: 3000,
    },
  ];
  
  const handleApproveDistressedDeal = (dealId: string) => {
    const deal = pendingDistressedDeals.find(d => d.id === dealId);
    if (!deal) return;
    
    Alert.alert(
      'Approve Distressed Deal',
      `Are you sure you want to approve this distressed deal? The owner will be charged ${deal.totalFee} AED for ${deal.distressedDealDuration} days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => {
            // In a real app, this would call an API to approve the deal
            console.log('Approved deal:', dealId);
            Alert.alert('Success', 'Distressed deal has been approved and is now live.');
          } 
        }
      ]
    );
  };
  
  const handleRejectDistressedDeal = (dealId: string) => {
    Alert.alert(
      'Reject Distressed Deal',
      'Are you sure you want to reject this distressed deal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          onPress: () => {
            // In a real app, this would call an API to reject the deal
            console.log('Rejected deal:', dealId);
            Alert.alert('Success', 'Distressed deal has been rejected.');
          } 
        }
      ]
    );
  };

  const handleSendNotification = () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert('Error', 'Please enter both a title and message for the notification.');
      return;
    }

    // Add notification to all users (in a real app, this would be sent to the backend)
    addNotification({
      userId: 'all', // Special value to indicate system-wide notification
      type: notificationType as any,
      title: notificationTitle,
      message: notificationMessage,
      read: false,
    });

    Alert.alert(
      'Success',
      'System notification has been sent to all users.',
      [
        { 
          text: 'OK', 
          onPress: () => {
            setNotificationModalVisible(false);
            setNotificationTitle('');
            setNotificationMessage('');
          } 
        }
      ]
    );
  };
  
  const handleAddUser = async () => {
    // Validate form
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (name, email, password).');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    
    // Password validation (at least 6 characters)
    if (newUserPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if user with this email already exists in Supabase
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newUserEmail)
        .limit(1);
      
      if (checkError) {
        console.error('[Admin Panel] Error checking existing user:', checkError.message);
        throw checkError;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        Alert.alert('Error', 'A user with this email already exists.');
        setIsLoading(false);
        return;
      }
      
      // Register user with Supabase auth
      let userId;
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: newUserEmail,
          password: newUserPassword,
        });
        
        if (authError) {
          console.error('[Admin Panel] Error registering user with auth:', authError.message);
          throw authError;
        }
        
        userId = authData?.user?.id;
        console.log('[Admin Panel] User registered successfully with ID:', userId);
      } catch (error: any) {
        console.error('[Admin Panel] Error registering user:', error.message);
        Alert.alert('Error', `Failed to register user: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      if (!userId) {
        Alert.alert('Error', 'Failed to create user account. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Create default preferences
      const defaultPreferences = {
        language: 'en',
        darkMode: false,
        biometricAuth: false,
        notifications: {
          matches: true,
          marketUpdates: true,
          newListings: true,
          subscriptionUpdates: true,
        },
        propertyPreferences: {
          types: [],
          budget: {
            min: 0,
            max: 1000000,
          },
          bedrooms: 2,
          bathrooms: 2,
          locations: [],
        },
        location: 'Dubai',
        currency: 'AED',
        isNegotiable: true,
      };
      
      // Log the value of newUserRole
      console.log('[Admin Panel] Creating user with role:', newUserRole);

      // Create user profile in Supabase profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: newUserEmail,
            name: newUserName,
            // Set the role field (we've migrated from roles array to single role field)
            role: newUserRole,
            subscription: newUserSubscription,
            message_count: 0,
            message_limit: parseInt(newUserMessageLimit) || 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_verified: true,
            onboarding_completed: true,
            preferences: defaultPreferences
          }
        ])
        .select();
      
      if (profileError) {
        console.error('[Admin Panel] Error creating user profile:', profileError.message);
        Alert.alert('Error', `Failed to create user profile: ${profileError.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log('[Admin Panel] User profile created successfully:', profileData?.[0]?.email);
      
      // Add the new user to the state
      if (profileData && profileData.length > 0) {
        const newUser = profileData[0] as UserType;
        setUsers(prevUsers => [...prevUsers, newUser]);
      }
      
      // Reset form
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setNewUserSubscription('free');
      setNewUserMessageLimit('100');
      
      // Close modal
      setAddUserModalVisible(false);
      
      // Show success message
      Alert.alert('Success', 'User has been created successfully.');
      
      // Add notification
      addNotification({
        userId: 'all',
        type: 'system',
        title: 'New User Added',
        message: `${newUserName} has been added to the system.`,
        read: false,
      });
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('Error', 'Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    // Validate form
    if (!selectedUser.name.trim() || !selectedUser.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (name, email).');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(selectedUser.email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if another user with this email already exists in Supabase
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', selectedUser.email)
        .neq('id', selectedUser.id)
        .limit(1);
      
      if (checkError) {
        console.error('[Admin Panel] Error checking existing user:', checkError.message);
        throw checkError;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        Alert.alert('Error', 'Another user with this email already exists.');
        setIsLoading(false);
        return;
      }
      
      // Update user in Supabase
      const { data: updatedUser, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          subscription: selectedUser.subscription,
          message_limit: selectedUser.message_limit,
          updated_at: new Date().toISOString(),
          preferences: selectedUser.preferences
        })
        .eq('id', selectedUser.id)
        .select();
      
      if (updateError) {
        console.error('[Admin Panel] Error updating user:', updateError.message);
        throw updateError;
      }
      
      console.log('[Admin Panel] User updated successfully:', updatedUser?.[0]?.email);
      
      // Update user in state
      if (updatedUser && updatedUser.length > 0) {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id ? updatedUser[0] as UserType : user
          )
        );
      }
      
      // Close modal
      setEditUserModalVisible(false);
      setSelectedUser(null);
      
      // Show success message
      Alert.alert('Success', 'User has been updated successfully.');
    } catch (error: any) {
      console.error('[Admin Panel] Error updating user:', error.message);
      Alert.alert('Error', `Failed to update user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteUser = (userId: string) => {
    // Don't allow deleting the admin user
    const userToDelete = users.find(user => user.id === userId);
    if (userToDelete?.email === 'propertyspro@gmail.com') {
      Alert.alert('Error', 'You cannot delete the main admin account.');
      return;
    }
    
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Delete user from Supabase profiles table
              const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);
              
              if (deleteError) {
                console.error('[Admin Panel] Error deleting user profile:', deleteError.message);
                throw deleteError;
              }
              
              // Try to delete user from auth as well (requires admin privileges)
              try {
                const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
                if (authDeleteError) {
                  console.warn('[Admin Panel] Could not delete user from auth:', authDeleteError.message);
                  // Continue anyway, as we've deleted the profile
                }
              } catch (authError: any) {
                console.warn('[Admin Panel] Error deleting user from auth:', authError.message);
                // Continue anyway, as we've deleted the profile
              }
              
              // Update state
              setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
              
              // Show success message
              Alert.alert('Success', 'User has been deleted successfully.');
            } catch (error: any) {
              console.error('[Admin Panel] Error deleting user:', error.message);
              Alert.alert('Error', `Failed to delete user: ${error.message}`);
            } finally {
              setIsLoading(false);
            }
          } 
        }
      ]
    );
  };
  
  const openEditUserModal = (user: UserType) => {
    setSelectedUser({ ...user, ...{ preferences: user.preferences } });
    setEditUserModalVisible(true);
  };
  
  const renderDashboard = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1,245</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3,782</Text>
          <Text style={styles.statLabel}>Conversations</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>856</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>92%</Text>
          <Text style={styles.statLabel}>Satisfaction</Text>
        </View>
      </View>
      
      <View style={styles.alertSection}>
        <View style={styles.alertHeader}>
          <AlertTriangle size={20} color={Colors.error} />
          <Text style={styles.alertTitle}>Pending Approvals</Text>
        </View>
        
        <View style={styles.alertContent}>
          <Text style={styles.alertCount}>{pendingDistressedDeals.length}</Text>
          <Text style={styles.alertText}>Distressed Deals Pending Approval</Text>
          <TouchableOpacity 
            style={styles.alertButton}
            onPress={() => setActiveTab('properties')}
          >
            <Text style={styles.alertButtonText}>Review Deals</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Realtor Visibility Requests Card */}
      <View style={[styles.alertSection, { backgroundColor: 'rgba(98, 0, 238, 0.05)'}]}>
         <View style={styles.alertHeader}>
          <Eye size={20} color={Colors.primary} />
          <Text style={[styles.alertTitle, { color: Colors.primary }]}>Visibility Requests</Text>
        </View>
        <View style={styles.alertContent}>
          {/* TODO: Fetch actual count of pending requests. Using placeholder 0 for now. */}
          <Text style={[styles.alertCount, { color: Colors.primary }]}>0</Text> 
          <Text style={styles.alertText}>Realtors/Sellers Pending Market Visibility</Text>
          <TouchableOpacity 
            style={styles.alertButton}
            onPress={() => router.push('/admin/realtor-visibility')} // Navigate to the new page
          >
            <Text style={styles.alertButtonText}>Review Requests</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.chartPlaceholder}>
        <BarChart size={40} color={Colors.primary} />
        <Text style={styles.chartTitle}>User Activity (Last 30 Days)</Text>
      </View>
      
      <View style={styles.recentActivityContainer}>
        <Text style={styles.subsectionTitle}>Recent Activity</Text>
        
        <View style={styles.activityItem}>
          <Text style={styles.activityTime}>10:45 AM</Text>
          <Text style={styles.activityText}>New user registered: Sarah Johnson</Text>
        </View>
        
        <View style={styles.activityItem}>
          <Text style={styles.activityTime}>09:32 AM</Text>
          <Text style={styles.activityText}>Property match created: Downtown Apartment</Text>
        </View>
        
        <View style={styles.activityItem}>
          <Text style={styles.activityTime}>Yesterday</Text>
          <Text style={styles.activityText}>System update completed: v1.2.4</Text>
        </View>
      </View>
    </View>
  );
  
  const renderUsers = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>User Management</Text>
      
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.usersList}>
        {filteredUsers.map(user => (
          <View key={user.id} style={styles.userItem}>
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{user.name}</Text>
                {user.role === 'admin' && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userDetails}>
                <Text style={styles.userDetailText}>
                  <Text style={styles.userDetailLabel}>Subscription: </Text>
                  <Text style={[
                    styles.userSubscription, 
                    user.subscription === 'premium' && styles.premiumText,
                    user.subscription === 'enterprise' && styles.enterpriseText
                  ]}>
                    {user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)}
                  </Text>
                </Text>
                <Text style={styles.userDetailText}>
                  <Text style={styles.userDetailLabel}>Messages: </Text>
                  {user.message_count} / {user.message_limit}
                </Text>
              </View>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity 
                style={styles.userActionButton}
                onPress={() => openEditUserModal(user)}
              >
                <Text style={styles.userActionText}>Edit</Text>
              </TouchableOpacity>
              
              {user.email !== 'propertyspro@gmail.com' && (
                <TouchableOpacity 
                  style={[styles.userActionButton, styles.deleteButton]}
                  onPress={() => handleDeleteUser(user.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        
        {filteredUsers.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No users found matching "{searchQuery}"</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setAddUserModalVisible(true)}
      >
        <UserPlus size={18} color="white" />
        <Text style={styles.addButtonText}>Add New User</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Filter chat sessions when search query changes
  useEffect(() => {
    if (!searchQuery.trim() || activeTab !== 'conversations') {
      setFilteredChatSessions(chatSessions);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = chatSessions.filter(session => 
      session.title?.toLowerCase().includes(query) || 
      session.user?.name?.toLowerCase().includes(query) ||
      session.user?.email?.toLowerCase().includes(query)
    );
    
    setFilteredChatSessions(filtered);
  }, [searchQuery, chatSessions, activeTab]);
  
  // Function to view chat session details
  const handleViewChatSession = async (session: ChatSession) => {
    setIsLoading(true);
    try {
      // Fetch messages for this session
      const messages = await fetchChatMessages(session.id);
      
      // Update the session with messages
      const updatedSession = {
        ...session,
        messages
      };
      
      setSelectedChatSession(updatedSession);
      setChatModalVisible(true);
    } catch (error) {
      console.error('[Admin Panel] Error fetching chat messages:', error);
      Alert.alert('Error', 'Failed to load chat messages.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
  
  const renderConversations = () => {
    const { isAdmin } = useAuth();
    const filteredSessions = isAdmin
      ? chatSessions
      : chatSessions.filter(session => !session.isAdminChat);
      
    console.log('[Admin Panel] isAdmin:', isAdmin);
    console.log('[Admin Panel] filteredSessions:', filteredSessions);

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Conversation Management</Text>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations by title or user..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isLoadingChats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <MessageSquare size={40} color={Colors.textLight} />
            <Text style={styles.noResultsText}>
              {searchQuery.trim() ?
                `No conversations found matching "${searchQuery}"` :
                'No conversations found'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {filteredSessions.map(session => (
              <View key={session.id} style={styles.conversationItem}>
                <View style={styles.conversationInfo}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationUser}>{session.user?.name || 'Unknown User'}</Text>
                    {session.isAdminChat && (
                      <View style={styles.adminChatBadge}>
                        <Text style={styles.adminChatBadgeText}>ADMIN CHAT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.conversationTitle}>{session.title}</Text>
                  <Text style={styles.conversationTime}>
                    {formatDate(session.updatedAt)} • {session.messageCount} messages
                  </Text>
                </View>
                <View style={styles.conversationActions}>
                  <TouchableOpacity
                    style={styles.conversationActionButton}
                    onPress={() => handleViewChatSession(session)}
                  >
                    <Text style={styles.conversationActionText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Chat Session Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={chatModalVisible && selectedChatSession !== null}
          onRequestClose={() => {
            setChatModalVisible(false);
            setSelectedChatSession(null);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            {selectedChatSession && (
              <View style={styles.chatModalContent}>
                <View style={styles.chatModalHeader}>
                  <View style={styles.chatModalHeaderInfo}>
                    <Text style={styles.chatModalTitle}>{selectedChatSession.title}</Text>
                    <Text style={styles.chatModalSubtitle}>
                      {selectedChatSession.user?.name} • {formatDate(selectedChatSession.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setChatModalVisible(false);
                      setSelectedChatSession(null);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <X size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.chatModalBody}>
                  {selectedChatSession.messages.length === 0 ? (
                    <View style={styles.noMessagesContainer}>
                      <Text style={styles.noMessagesText}>No messages in this conversation</Text>
                    </View>
                  ) : (
                    selectedChatSession.messages.map(message => (
                      <View
                        key={message.id}
                        style={[
                          styles.chatMessage,
                          message.role === 'user' ? styles.userMessage : styles.assistantMessage
                        ]}
                      >
                        <View style={styles.chatMessageHeader}>
                          <Text style={styles.chatMessageRole}>
                            {message.role === 'user' ? 'User' : 'Assistant'}
                          </Text>
                          <Text style={styles.chatMessageTime}>
                            {formatDate(message.createdAt)}
                          </Text>
                        </View>
                        <Text style={styles.chatMessageContent}>{message.content}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  };
  const [propertiesTab, setPropertiesTab] = useState('distressed');

  const renderProperties = () => {
    const filteredProperties = propertiesTab === 'distressed'
      ? properties.filter(property => property.isDistressed)
      : properties;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Property Management</Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, propertiesTab === 'distressed' && styles.activeTab]}
            onPress={() => setPropertiesTab('distressed')}
          >
            <Text style={[styles.tabText, propertiesTab === 'distressed' && styles.activeTabText]}>Distressed Deals</Text>
            {/* The badge should show the number of distressed deals from the database */}
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{properties.filter(property => property.isDistressed).length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, propertiesTab === 'all' && styles.activeTab]}
            onPress={() => setPropertiesTab('all')}
          >
            <Text style={[styles.tabText, propertiesTab === 'all' && styles.activeTabText]}>All Properties</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.subsectionTitle}>Properties</Text>

        <View style={styles.distressedDealsList}>
          {filteredProperties.map((property) => (
            <View key={property.id} style={styles.distressedDealItem}>
              <View style={styles.distressedDealHeader}>
                {property.isDistressed && (
                  <View style={styles.distressedBadge}>
                    <AlertTriangle size={14} color="white" />
                    <Text style={styles.distressedBadgeText}>DISTRESSED</Text>
                  </View>
                )}
                <View style={styles.submittedDate}>
                  <Clock size={14} color={Colors.textLight} />
                  <Text style={styles.submittedDateText}>Created: {property.created_at}</Text>
                </View>
              </View>

              <View style={styles.distressedDealContent}>
                <Image source={{ uri: property.images[0] }} style={styles.distressedDealImage} />

                <View style={styles.distressedDealInfo}>
                  <Text style={styles.distressedDealTitle}>{property.title}</Text>
                  <Text style={styles.distressedDealLocation}>{property.location}</Text>

                  <View style={styles.priceContainer}>
                    <Text style={styles.discountedPrice}>
                      {property.price.toLocaleString()} AED
                    </Text>
                  </View>

                  <View style={styles.reasonContainer}>
                    <Text style={styles.reasonLabel}>Type:</Text>
                    <Text style={styles.reasonText}>{property.type}</Text>
                  </View>

                  <View style={styles.durationContainer}>
                    <Calendar size={16} color={Colors.text} />
                    <Text style={styles.durationText}>
                      {property.bedrooms} bedrooms, {property.bathrooms} bathrooms
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };
  const renderSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>System Settings</Text>
      
      <Text style={styles.subsectionTitle}>General Settings</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>AI Response Time (seconds)</Text>
          <Text style={styles.settingDescription}>Control how quickly Ella responds to messages</Text>
        </View>
        <View style={styles.settingControl}>
          <TextInput
            style={styles.settingInput}
            value={aiResponseTime.toString()}
            onChangeText={(text) => setAiResponseTime(parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Maintenance Mode</Text>
          <Text style={styles.settingDescription}>Take the app offline for maintenance</Text>
        </View>
        <View style={styles.settingControl}>
          <Switch
            value={maintenanceMode}
            onValueChange={setMaintenanceMode}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={maintenanceMode ? Colors.primary : '#f4f3f4'}
          />
        </View>
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Distressed Deal Fee (AED/day)</Text>
          <Text style={styles.settingDescription}>Fee charged for listing a property as a distressed deal</Text>
        </View>
        <View style={styles.settingControl}>
          <TextInput
            style={styles.settingInput}
            value="100"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Database Backup</Text>
          <Text style={styles.settingDescription}>Create a backup of all system data</Text>
        </View>
        <View style={styles.settingControl}>
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>Backup Now</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Send System Notification</Text>
          <Text style={styles.settingDescription}>Send a notification to all users</Text>
        </View>
        <View style={styles.settingControl}>
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => setNotificationModalVisible(true)}
          >
            <Text style={styles.settingButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.subsectionTitle}>Support Information</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Support Email</Text>
          <Text style={styles.settingDescription}>Email address for customer support</Text>
        </View>
        <View style={styles.settingControl}>
          <TextInput
            style={[styles.settingInput, { width: 200 }]}
            value={supportInfo.email}
            onChangeText={(text) => updateSupportInfo({ email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Support Phone</Text>
          <Text style={styles.settingDescription}>Phone number for customer support</Text>
        </View>
        <View style={styles.settingControl}>
          <TextInput
            style={[styles.settingInput, { width: 200 }]}
            value={supportInfo.phone}
            onChangeText={(text) => updateSupportInfo({ phone: text })}
            keyboardType="phone-pad"
          />
        </View>
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Website</Text>
          <Text style={styles.settingDescription}>Company website URL</Text>
        </View>
        <View style={styles.settingControl}>
          <TextInput
            style={[styles.settingInput, { width: 200 }]}
            value={supportInfo.website}
            onChangeText={(text) => updateSupportInfo({ website: text })}
            autoCapitalize="none"
          />
        </View>
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Clear System Cache</Text>
          <Text style={styles.settingDescription}>Clear temporary data to improve performance</Text>
        </View>
        <View style={styles.settingControl}>
          <TouchableOpacity style={[styles.settingButton, styles.dangerButton]}>
            <Text style={styles.dangerButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'conversations':
        return renderConversations();
      case 'properties':
        return renderProperties();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <Stack.Screen 
        options={{
          title: 'Admin Panel',
          headerTitleStyle: { color: Colors.text },
        }}
      />
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]} 
          onPress={() => setActiveTab('dashboard')}
        >
          <BarChart size={24} color={activeTab === 'dashboard' ? Colors.primary : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'users' && styles.activeTabButton]} 
          onPress={() => setActiveTab('users')}
        >
          <Users size={24} color={activeTab === 'users' ? Colors.primary : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'conversations' && styles.activeTabButton]} 
          onPress={() => setActiveTab('conversations')}
        >
          <MessageSquare size={24} color={activeTab === 'conversations' ? Colors.primary : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'conversations' && styles.activeTabText]}>Chats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'properties' && styles.activeTabButton]} 
          onPress={() => setActiveTab('properties')}
        >
          <Home size={24} color={activeTab === 'properties' ? Colors.primary : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'properties' && styles.activeTabText]}>Properties</Text>
          {pendingDistressedDeals.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{pendingDistressedDeals.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'settings' && styles.activeTabButton]} 
          onPress={() => setActiveTab('settings')}
        >
          <Settings size={24} color={activeTab === 'settings' ? Colors.primary : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send System Notification</Text>
              <TouchableOpacity 
                onPress={() => setNotificationModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notification Type</Text>
                <View style={styles.typeButtonsContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.typeButton, 
                      notificationType === 'system' && styles.activeTypeButton
                    ]}
                    onPress={() => setNotificationType('system')}
                  >
                    <Info size={16} color={notificationType === 'system' ? 'white' : Colors.text} />
                    <Text style={[
                      styles.typeButtonText,
                      notificationType === 'system' && styles.activeTypeButtonText
                    ]}>System</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.typeButton, 
                      notificationType === 'alert' && styles.activeTypeButton
                    ]}
                    onPress={() => setNotificationType('alert')}
                  >
                    <AlertTriangle size={16} color={notificationType === 'alert' ? 'white' : Colors.text} />
                    <Text style={[
                      styles.typeButtonText,
                      notificationType === 'alert' && styles.activeTypeButtonText
                    ]}>Alert</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.typeButton, 
                      notificationType === 'property' && styles.activeTypeButton
                    ]}
                    onPress={() => setNotificationType('property')}
                  >
                    <Home size={16} color={notificationType === 'property' ? 'white' : Colors.text} />
                    <Text style={[
                      styles.typeButtonText,
                      notificationType === 'property' && styles.activeTypeButtonText
                    ]}>Property</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter notification title"
                  value={notificationTitle}
                  onChangeText={setNotificationTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Enter notification message"
                  value={notificationMessage}
                  onChangeText={setNotificationMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setNotificationModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.sendButton}
                  onPress={handleSendNotification}
                >
                  <Send size={16} color="white" />
                  <Text style={styles.sendButtonText}>Send Notification</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Add User Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addUserModalVisible}
        onRequestClose={() => setAddUserModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New User</Text>
              <TouchableOpacity 
                onPress={() => setAddUserModalVisible(false)}
                style={styles.modalCloseButton}
                disabled={isLoading}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <View style={styles.inputWithIcon}>
                  <User size={20} color={Colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter user's full name"
                    value={newUserName}
                    onChangeText={setNewUserName}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWithIcon}>
                  <Mail size={20} color={Colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter user's email address"
                    value={newUserEmail}
                    onChangeText={setNewUserEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWithIcon}>
                  <Lock size={20} color={Colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter password (min 6 characters)"
                    value={newUserPassword}
                    onChangeText={setNewUserPassword}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleButtonsContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.roleButton, 
                      newUserRole === 'user' && styles.activeRoleButton
                    ]}
                    onPress={() => setNewUserRole('user')}
                    disabled={isLoading}
                  >
                    <User size={16} color={newUserRole === 'user' ? 'white' : Colors.text} />
                    <Text style={[
                      styles.roleButtonText,
                      newUserRole === 'user' && styles.activeRoleButtonText
                    ]}>User</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.roleButton, 
                      newUserRole === 'admin' && styles.activeRoleButton
                    ]}
                    onPress={() => setNewUserRole('admin')}
                    disabled={isLoading}
                  >
                    <Shield size={16} color={newUserRole === 'admin' ? 'white' : Colors.text} />
                    <Text style={[
                      styles.roleButtonText,
                      newUserRole === 'admin' && styles.activeRoleButtonText
                    ]}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subscription</Text>
                <View style={styles.subscriptionButtonsContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.subscriptionButton, 
                      newUserSubscription === 'free' && styles.activeSubscriptionButton
                    ]}
                    onPress={() => setNewUserSubscription('free')}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.subscriptionButtonText,
                      newUserSubscription === 'free' && styles.activeSubscriptionButtonText
                    ]}>Free</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.subscriptionButton, 
                      newUserSubscription === 'premium' && styles.activeSubscriptionButton
                    ]}
                    onPress={() => setNewUserSubscription('premium')}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.subscriptionButtonText,
                      newUserSubscription === 'premium' && styles.activeSubscriptionButtonText
                    ]}>Premium</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.subscriptionButton, 
                      newUserSubscription === 'enterprise' && styles.activeSubscriptionButton
                    ]}
                    onPress={() => setNewUserSubscription('enterprise')}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.subscriptionButtonText,
                      newUserSubscription === 'enterprise' && styles.activeSubscriptionButtonText
                    ]}>Enterprise</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message Limit</Text>
                <View style={styles.inputWithIcon}>
                  <MessageSquare size={20} color={Colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter message limit"
                    value={newUserMessageLimit}
                    onChangeText={setNewUserMessageLimit}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setAddUserModalVisible(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.addUserButton, isLoading && styles.disabledButton]}
                  onPress={handleAddUser}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <UserPlus size={16} color="white" />
                      <Text style={styles.addUserButtonText}>Add User</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Edit User Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editUserModalVisible && selectedUser !== null}
        onRequestClose={() => {
          if (!isLoading) {
            setEditUserModalVisible(false);
            setSelectedUser(null);
          }
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          {selectedUser && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit User</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setEditUserModalVisible(false);
                    setSelectedUser(null);
                  }}
                  style={styles.modalCloseButton}
                  disabled={isLoading}
                >
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <View style={styles.inputWithIcon}>
                    <User size={20} color={Colors.textLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter user's full name"
                      value={selectedUser.name}
                      onChangeText={(text) => setSelectedUser({...selectedUser, name: text})}
                      editable={!isLoading && selectedUser.email !== 'propertyspro@gmail.com'}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWithIcon}>
                    <Mail size={20} color={Colors.textLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter user's email address"
                      value={selectedUser.email}
                      onChangeText={(text) => setSelectedUser({...selectedUser, email: text})}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading && selectedUser.email !== 'propertyspro@gmail.com'}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Role</Text>
                  <View style={styles.roleButtonsContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.roleButton, 
                        selectedUser.role === 'user' && styles.activeRoleButton
                      ]}
                      onPress={() => setSelectedUser({...selectedUser, role: 'user'})}
                      disabled={isLoading || selectedUser.email === 'propertyspro@gmail.com'}
                    >
                      <User size={16} color={selectedUser.role === 'user' ? 'white' : Colors.text} />
                      <Text style={[
                        styles.roleButtonText,
                        selectedUser.role === 'user' && styles.activeRoleButtonText
                      ]}>User</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.roleButton, 
                        selectedUser.role === 'admin' && styles.activeRoleButton
                      ]}
                      onPress={() => setSelectedUser({...selectedUser, role: 'admin'})}
                      disabled={isLoading || selectedUser.email === 'propertyspro@gmail.com'}
                    >
                      <Shield size={16} color={selectedUser.role === 'admin' ? 'white' : Colors.text} />
                      <Text style={[
                        styles.roleButtonText,
                        selectedUser.role === 'admin' && styles.activeRoleButtonText
                      ]}>Admin</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Subscription</Text>
                  <View style={styles.subscriptionButtonsContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.subscriptionButton, 
                        selectedUser.subscription === 'free' && styles.activeSubscriptionButton
                      ]}
                      onPress={() => setSelectedUser({...selectedUser, subscription: 'free'})}
                      disabled={isLoading || selectedUser.email === 'propertyspro@gmail.com'}
                    >
                      <Text style={[
                        styles.subscriptionButtonText,
                        selectedUser.subscription === 'free' && styles.activeSubscriptionButtonText
                      ]}>Free</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.subscriptionButton, 
                        selectedUser.subscription === 'premium' && styles.activeSubscriptionButton
                      ]}
                      onPress={() => setSelectedUser({...selectedUser, subscription: 'premium'})}
                      disabled={isLoading || selectedUser.email === 'propertyspro@gmail.com'}
                    >
                      <Text style={[
                        styles.subscriptionButtonText,
                        selectedUser.subscription === 'premium' && styles.activeSubscriptionButtonText
                      ]}>Premium</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.subscriptionButton, 
                        selectedUser.subscription === 'enterprise' && styles.activeSubscriptionButton
                      ]}
                      onPress={() => setSelectedUser({...selectedUser, subscription: 'enterprise'})}
                      disabled={isLoading || selectedUser.email === 'propertyspro@gmail.com'}
                    >
                      <Text style={[
                        styles.subscriptionButtonText,
                        selectedUser.subscription === 'enterprise' && styles.activeSubscriptionButtonText
                      ]}>Enterprise</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Message Limit</Text>
                  <View style={styles.inputWithIcon}>
                    <MessageSquare size={20} color={Colors.textLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter message limit"
                      value={selectedUser.message_limit.toString()}
                      onChangeText={(text) => setSelectedUser({...selectedUser, message_limit: parseInt(text) || 0})}
                      keyboardType="numeric"
                      editable={!isLoading && selectedUser.email !== 'propertyspro@gmail.com'}
                    />
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditUserModalVisible(false);
                      setSelectedUser(null);
                    }}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.saveButton, isLoading && styles.disabledButton]}
                    onPress={handleEditUser}
                    disabled={isLoading || selectedUser.email === 'propertyspro@gmail.com'}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Check size={16} color="white" />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Loading styles
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textLight,
    fontSize: 16,
  },
  
  // Conversation styles
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  adminChatBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminChatBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Chat modal styles
  chatModalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: '90%',
  },
  chatModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primaryLight,
  },
  chatModalHeaderInfo: {
    flex: 1,
  },
  chatModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  chatModalSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  chatModalBody: {
    padding: 16,
    maxHeight: 500,
  },
  noMessagesContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMessagesText: {
    color: Colors.textLight,
    fontSize: 16,
    textAlign: 'center',
  },
  chatMessage: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#E3F2FD',
    marginLeft: 20,
  },
  assistantMessage: {
    backgroundColor: Colors.primaryLight,
    marginRight: 20,
  },
  chatMessageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chatMessageRole: {
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.primary,
  },
  chatMessageTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  chatMessageContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: Colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#E3F2FD', // Changed from Colors.secondary to light blue
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  alertSection: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
    marginLeft: 8,
  },
  alertContent: {
    alignItems: 'center',
  },
  alertCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  alertButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  alertButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  chartPlaceholder: {
    backgroundColor: '#E3F2FD', // Changed from Colors.secondary to light blue
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
  },
  recentActivityContainer: {
    backgroundColor: '#E3F2FD', // Changed from Colors.secondary to light blue
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityTime: {
    width: 80,
    fontSize: 14,
    color: Colors.textLight,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD', // Changed from Colors.secondary to light blue
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: Colors.text,
  },
  usersList: {
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  userDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  userDetailText: {
    fontSize: 12,
    color: Colors.text,
    marginRight: 12,
  },
  userDetailLabel: {
    fontWeight: 'bold',
  },
  userSubscription: {
    color: Colors.text,
  },
  premiumText: {
    color: '#FFD700', // Gold color for premium
  },
  enterpriseText: {
    color: Colors.primary, // Purple for enterprise
  },
  userActions: {
    flexDirection: 'row',
  },
  userActionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  userActionText: {
    color: 'white',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: Colors.textLight,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  conversationsList: {
    marginBottom: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  conversationPreview: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  conversationActions: {
    flexDirection: 'row',
  },
  conversationActionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  conversationActionText: {
    color: 'white',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabBadge: {
    backgroundColor: Colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  distressedDealsList: {
    marginBottom: 16,
  },
  distressedDealItem: {
    backgroundColor: '#E3F2FD', // Changed from Colors.secondary to light blue
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  distressedDealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  distressedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  distressedBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  submittedDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submittedDateText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
  distressedDealContent: {
    flexDirection: 'row',
    padding: 12,
  },
  distressedDealImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  distressedDealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  distressedDealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  distressedDealLocation: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
  },
  discountBadge: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: 'bold',
  },
  reasonContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: 'bold',
    marginRight: 4,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.text,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
  },
  ownerText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  distressedDealActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  rejectButtonText: {
    color: Colors.error,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.primary,
  },
  approveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  settingControl: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  settingInput: {
    backgroundColor: Colors.input.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.text,
  },
  settingButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  settingButtonText: {
    color: 'white',
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  dangerButtonText: {
    color: Colors.error,
    fontSize: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primaryLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    marginHorizontal: 4,
  },
  activeTypeButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.text,
  },
  activeTypeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Role buttons
  roleButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    marginHorizontal: 4,
  },
  activeRoleButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.text,
  },
  activeRoleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Subscription buttons
  subscriptionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subscriptionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    marginHorizontal: 4,
  },
  activeSubscriptionButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subscriptionButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  activeSubscriptionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Add user button
  addUserButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addUserButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Save button
  saveButton: {
    backgroundColor: Colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Disabled button
  disabledButton: {
    opacity: 0.6,
  },
});
