import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Send, 
  Globe, 
  Home, 
  Building, 
  TrendingUp, 
  Search, 
  MessageSquare, 
  Info, 
  Mic,
  Bell, 
  Plus, 
  ChevronRight, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  Heart 
} from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import AnimatedBubble from '@/components/AnimatedBubble';
import MenuButton from '@/components/MenuButton';
import MenuDrawer from '@/components/MenuDrawer';
import LanguageSelector from '@/components/LanguageSelector';
import PropertyCard from '@/components/PropertyCard';
import { useChatStore } from '@/store/chat-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, ChatSession, MessageRole } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { APP_NAME } from '@/constants/logo';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const unstable_settings = {
  headerShown: false,
};

// Sample data for featured properties
const SAMPLE_PROPERTIES = [
  {
    id: '1',
    title: 'Modern Apartment with Sea View',
    price: 1200000,
    currency: 'AED',
    location: 'Dubai Marina, Dubai',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    areaUnit: 'sqft',
    type: 'Apartment',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
    ]
  },
  {
    id: '2',
    title: 'Luxury Villa with Private Pool',
    price: 5500000,
    currency: 'AED',
    location: 'Palm Jumeirah, Dubai',
    bedrooms: 4,
    bathrooms: 5,
    area: 4500,
    areaUnit: 'sqft',
    type: 'Villa',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
    ]
  },
  {
    id: '3',
    title: 'Cozy Studio in Downtown',
    price: 750000,
    currency: 'AED',
    location: 'Downtown Dubai, Dubai',
    bedrooms: 1,
    bathrooms: 1,
    area: 650,
    areaUnit: 'sqft',
    type: 'Studio',
    images: [
      'https://images.unsplash.com/photo-1560448075-bb485b067938?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
    ]
  }
];

// Sample data for market insights
const MARKET_INSIGHTS = [
  { label: 'Avg. Price', value: '1.2M AED', icon: DollarSign, color: Colors.info },
  { label: 'Listings', value: '+15%', icon: TrendingUp, color: Colors.success },
  { label: 'Avg. Days', value: '45', icon: Calendar, color: Colors.warning }
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { 
    sendMessage, 
    createChatSession,
    setCurrentSession
  } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [bubbleActive, setBubbleActive] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  
  // Animation values
  const inputContainerTranslateY = useRef(new Animated.Value(50)).current;
  const inputContainerOpacity = useRef(new Animated.Value(0)).current;
  const inputContainerScale = useRef(new Animated.Value(1)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const welcomeTextOpacity = useRef(new Animated.Value(0)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const propertiesOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animate welcome text
    Animated.sequence([
      Animated.timing(welcomeTextOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Then animate stats
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Then animate features
      Animated.timing(featuresOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Then animate properties
      Animated.timing(propertiesOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Then animate input container
      Animated.parallel([
        Animated.timing(inputContainerTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(inputContainerOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    
    // Check if admin and redirect to admin panel
    if (isAdmin) {
      router.push('/admin');
    }
    
    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Shrink bubble when keyboard appears
        Animated.timing(bubbleScale, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        // Restore bubble size when keyboard hides
        Animated.timing(bubbleScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isAdmin]);
  
  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;

    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'You must log in or sign up to use our services.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In / Sign Up', onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    try {
      setIsProcessing(true);
      setBubbleActive(true);
      
      // Animate bubble when sending
      Animated.sequence([
        Animated.timing(bubbleScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Create a session title from the input text
      const sessionTitle = inputText.length > 30 ? `${inputText.substring(0, 30)}...` : inputText;
      
      try {
        console.log("Creating chat session with title:", sessionTitle);
        // Create a new chat session
        const session = await createChatSession(sessionTitle);
        console.log("Chat session created:", session);
        
        // Send the message
        await sendMessage(inputText);
        
        // Navigate to chat screen
        setTimeout(() => {
          router.push('/chat');
          setInputText('');
          setBubbleActive(false);
          setIsProcessing(false);
        }, 800);
      } catch (error: any) {
        console.error("Error with chat session or message:", error);
        
        // Create a mock session as fallback
        const mockSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: sessionTitle,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 1,
          messages: [
            {
              id: uuidv4(),
              content: inputText,
              role: 'user' as MessageRole,
              createdAt: new Date().toISOString(),
            }
          ]
        };
        
        // Store the mock session
        await AsyncStorage.setItem('current_chat_session', JSON.stringify(mockSession));
        setCurrentSession(mockSession);
        
        // Create a mock response after a delay
        setTimeout(async () => {
          const mockResponse: ChatMessage = {
            id: uuidv4(),
            content: `I'd be happy to help you with "${inputText}". Here's some information about real estate in that area...`,
            role: 'assistant' as MessageRole,
            createdAt: new Date().toISOString(),
          };
          
          // Add the response to the session
          mockSession.messages.push(mockResponse);
          mockSession.messageCount = 2;
          await AsyncStorage.setItem('current_chat_session', JSON.stringify(mockSession));
          setCurrentSession(mockSession);
          
          // Navigate to chat screen
          router.push('/chat');
          setInputText('');
          setBubbleActive(false);
          setIsProcessing(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setBubbleActive(false);
      setIsProcessing(false);
    }
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleLanguageSelector = () => {
    setIsLanguageSelectorOpen(!isLanguageSelectorOpen);
  };
  
  const handleQuickPromptPress = (prompt: string) => {
    setInputText(prompt);
    // Focus the input
    Keyboard.dismiss();
    // Small delay to ensure keyboard is dismissed
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const navigateToDiscover = () => {
    router.push('/(tabs)/discover');
  };
  
  const navigateToHowWeWork = () => {
    router.push('/how-we-work');
  };
  
  const handleSaveProperty = (propertyId: string) => {
    setSavedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };
  
  const renderPropertyItem = ({ item }: { item: any }) => (
    <PropertyCard 
      property={item} 
      onSave={handleSaveProperty}
      savedProperties={savedProperties}
    />
  );
  
  const renderInsightItem = ({ item }: { item: any }) => (
    <View style={styles.insightCard}>
      <View style={[styles.insightIconContainer, { backgroundColor: `${item.color}15` }]}>
        <item.icon size={20} color={item.color} />
      </View>
      <Text style={styles.insightValue}>{item.value}</Text>
      <Text style={styles.insightLabel}>{item.label}</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MenuButton onPress={toggleMenu} />
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={toggleLanguageSelector}
          >
            <Globe size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={22} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.howItWorksButton}
            onPress={navigateToHowWeWork}
          >
            <Info size={18} color={Colors.primary} />
            <Text style={styles.howItWorksText}>How it works</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Menu Drawer */}
      <MenuDrawer 
        isVisible={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
      
      {/* Language Selector */}
      {isLanguageSelectorOpen && (
        <LanguageSelector 
          onClose={() => setIsLanguageSelectorOpen(false)} 
        />
      )}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section with Gradient Background */}
        <LinearGradient
          colors={['rgba(98, 0, 238, 0.1)', 'rgba(98, 0, 238, 0.02)']}
          style={styles.welcomeGradient}
        >
          <Animated.View style={[styles.welcomeSection, { opacity: welcomeTextOpacity }]}>
            <Text style={styles.welcomeText}>
              {isAuthenticated && user?.name 
                ? `Welcome back, ${user.name}!` 
                : `Welcome to ${APP_NAME}`}
            </Text>
            <Text style={styles.welcomeSubtext}>
              Your AI-powered real estate assistant
            </Text>
            
            {/* Quick Action Buttons */}
            <View style={styles.quickActionContainer}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push('/add-edit-property')}
              >
                <View style={styles.quickActionIconContainer}>
                  <Plus size={18} color="#fff" />
                </View>
                <Text style={styles.quickActionText}>Add Property</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={navigateToDiscover}
              >
                <View style={[styles.quickActionIconContainer, { backgroundColor: Colors.info }]}>
                  <Search size={18} color="#fff" />
                </View>
                <Text style={styles.quickActionText}>Find Property</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push('/chat')}
              >
                <View style={[styles.quickActionIconContainer, { backgroundColor: Colors.success }]}>
                  <MessageSquare size={18} color="#fff" />
                </View>
                <Text style={styles.quickActionText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          {/* AI Assistant Bubble - Smaller and to the side */}
          <Animated.View 
            style={[
              styles.bubbleContainer,
              { transform: [{ scale: bubbleScale }] }
            ]}
          >
            <AnimatedBubble isActive={bubbleActive} size={width * 0.18} />
          </Animated.View>
        </LinearGradient>
        
        {/* Market Insights Section */}
        {isAuthenticated && (
          <Animated.View style={[styles.insightsContainer, { opacity: statsOpacity }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Market Insights</Text>
              <TouchableOpacity onPress={() => router.push('/how-we-work')}>
                <Text style={styles.seeAllText}>See More</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={MARKET_INSIGHTS}
              renderItem={renderInsightItem}
              keyExtractor={(item) => item.label}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.insightsList}
            />
          </Animated.View>
        )}
        
        {/* Feature Cards - Now Horizontal */}
        <Animated.View style={[styles.featureCardsContainer, { opacity: featuresOpacity }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Services</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuresScrollContent}
          >
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={navigateToDiscover}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                <Search size={24} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Discover</Text>
              <Text style={styles.featureDescription}>Find matched properties</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => router.push('/distressed-deals')}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: `${Colors.error}15` }]}>
                <TrendingUp size={24} color={Colors.error} />
              </View>
              <Text style={styles.featureTitle}>Deals</Text>
              <Text style={styles.featureDescription}>Below market value</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => router.push('/my-properties')}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: `${Colors.info}15` }]}>
                <Building size={24} color={Colors.info} />
              </View>
              <Text style={styles.featureTitle}>My Properties</Text>
              <Text style={styles.featureDescription}>Manage listings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => router.push('/subscription')}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: `${Colors.warning}15` }]}>
                <Briefcase size={24} color={Colors.warning} />
              </View>
              <Text style={styles.featureTitle}>Premium</Text>
              <Text style={styles.featureDescription}>Upgrade account</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
        
        {/* Featured Properties Section */}
        <Animated.View style={[styles.featuredPropertiesContainer, { opacity: propertiesOpacity }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <TouchableOpacity onPress={navigateToDiscover}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={SAMPLE_PROPERTIES}
            renderItem={renderPropertyItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.propertiesList}
          />
        </Animated.View>
        
        {/* Recent Activity Section - Redesigned */}
        {isAuthenticated && (
          <View style={styles.recentActivitySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => router.push('/chat')}
            >
              <View style={[styles.activityIconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                <MessageSquare size={20} color={Colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Continue your conversation</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <ChevronRight size={18} color={Colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => router.push('/(tabs)/discover')}
            >
              <View style={[styles.activityIconContainer, { backgroundColor: `${Colors.info}15` }]}>
                <Home size={20} color={Colors.info} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New properties in your area</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
              <ChevronRight size={18} color={Colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => router.push('/(tabs)/saved')}
            >
              <View style={[styles.activityIconContainer, { backgroundColor: `${Colors.error}15` }]}>
                <Heart size={20} color={Colors.error} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Property saved to favorites</Text>
                <Text style={styles.activityTime}>2 days ago</Text>
              </View>
              <ChevronRight size={18} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* Input Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputSection}
      >
        <Animated.View 
          style={[
            styles.inputContainer,
            { 
              transform: [
                { translateY: inputContainerTranslateY },
                { scale: inputContainerScale }
              ],
              opacity: inputContainerOpacity,
              borderColor: isInputFocused ? Colors.primary : `${Colors.primary}20`,
            }
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Ask about buying, selling, renting..."
            placeholderTextColor={Colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={200}
            onSubmitEditing={handleSend}
            editable={!isProcessing}
            onFocus={() => {
              setIsInputFocused(true);
              Animated.timing(inputContainerScale, {
                toValue: 1.02,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }}
            onBlur={() => {
              setIsInputFocused(false);
              Animated.timing(inputContainerScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }}
          />
          {inputText.trim() ? (
            <TouchableOpacity 
              style={[
                styles.sendButton,
                isProcessing && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.micButton,
                isRecording && styles.micButtonActive
              ]}
              onPress={() => {
                setIsRecording(!isRecording);
                // TODO: Implement voice recording
                console.log('Voice recording:', !isRecording);
              }}
              disabled={isProcessing}
            >
              <Mic size={20} color={isRecording ? '#fff' : Colors.textLight} />
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {!keyboardVisible && (
          <View style={styles.suggestionContainer}>
            <SuggestionChip 
              label="Buy a property" 
              onPress={() => handleQuickPromptPress("I want to buy a property")}
              disabled={isProcessing}
            />
            <SuggestionChip 
              label="Rent a home" 
              onPress={() => handleQuickPromptPress("I'm looking to rent a home")}
              disabled={isProcessing}
            />
            <SuggestionChip 
              label="Sell my house" 
              onPress={() => handleQuickPromptPress("I want to sell my house")}
              disabled={isProcessing}
            />
            <SuggestionChip 
              label="Investment advice" 
              onPress={() => handleQuickPromptPress("I need investment advice for real estate")}
              disabled={isProcessing}
            />
          </View>
        )}
        
        {!isAuthenticated && !keyboardVisible && (
          <View style={styles.authPromptContainer}>
            <Text style={styles.authPromptText}>
              Sign in to use the chat feature and get personalized recommendations
            </Text>
            <TouchableOpacity 
              style={styles.authButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.authButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface SuggestionChipProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ label, onPress, disabled }) => {
  return (
    <TouchableOpacity 
      style={[styles.suggestionChip, disabled && styles.suggestionChipDisabled]} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.suggestionText, disabled && styles.suggestionTextDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  howItWorksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 10,
  },
  howItWorksText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  notificationButton: {
    padding: 5,
  },
  languageButton: {
    marginLeft: 20,
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  welcomeGradient: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  quickActionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  quickActionButton: {
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 6,
    fontWeight: '500',
  },
  insightsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  insightsList: {
    paddingVertical: 8,
  },
  insightCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: width * 0.28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  featureCardsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  featuresScrollContent: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  featureCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: width * 0.35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  featuredPropertiesContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  propertiesList: {
    paddingVertical: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  recentActivitySection: {
    marginTop: 16,
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  inputSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.input.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.button.disabled,
  },
  micButton: {
    backgroundColor: Colors.input.background,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Colors.input.border,
  },
  micButtonActive: {
    backgroundColor: Colors.error,
  },
  suggestionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  suggestionChipDisabled: {
    backgroundColor: `${Colors.button.disabled}20`,
    borderColor: `${Colors.button.disabled}30`,
  },
  suggestionText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionTextDisabled: {
    color: Colors.button.text.disabled,
  },
  bubbleContainer: {
    width: width * 0.18,
    height: width * 0.18,
    position: 'absolute',
    right: 16,
    top: 16,
  },
  authPromptContainer: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authPromptText: {
    color: Colors.text,
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  authButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  authButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
