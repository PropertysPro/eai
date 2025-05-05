import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, Home, MessageCircle, Search, Heart } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import AnimatedBubble from '@/components/AnimatedBubble';

const { width } = Dimensions.get('window');

// Define the type for onboarding steps
interface OnboardingStep {
  title: string;
  description: string;
  key: string;
  icon: React.ComponentType<any>;
}

const OnboardingScreen = () => {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [bubbleActive, setBubbleActive] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList<OnboardingStep>>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Activate bubble animation on load and step change
  useEffect(() => {
    setBubbleActive(true);
    const timer = setTimeout(() => setBubbleActive(false), 1500);
    return () => clearTimeout(timer);
  }, [currentStep]);
  
  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Welcome to PropertyMatch",
      description: "Your AI-powered real estate assistant that helps you find your perfect property match.",
      key: "welcome",
      icon: Home
    },
    {
      title: "Smart Property Matching",
      description: "Our AI analyzes thousands of listings to find properties that match your preferences and budget.",
      key: "matching",
      icon: Search
    },
    {
      title: "Chat with AI Assistant",
      description: "Ask questions about properties, neighborhoods, or the buying process. Our AI assistant is here to help.",
      key: "chat",
      icon: MessageCircle
    },
    {
      title: "Save and Compare",
      description: "Save properties you like and compare them side by side to make the best decision.",
      key: "save",
      icon: Heart
    }
  ];
  
  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      slidesRef.current?.scrollToIndex({
        index: currentStep + 1,
        animated: true
      });
    } else {
      handleComplete();
    }
  };
  
  const handleSkip = async () => {
    try {
      console.log('[Onboarding] Skipping onboarding');
      await completeOnboarding();
    } catch (error) {
      console.error('[Onboarding] Error skipping onboarding:', error);
      Alert.alert('Error', 'Failed to skip onboarding. Please try again.');
    }
  };
  
  const handleComplete = async () => {
    try {
      console.log('[Onboarding] Completing onboarding');
      setIsLoading(true);
      
      // Check if we have a valid user first
      if (!user) {
        console.error('[Onboarding] No user found in context');
        Alert.alert('Error', 'Please sign in again to continue.');
        router.replace('/login');
        return;
      }

      await completeOnboarding();
      // Direct users to complete their profile
      router.replace('/profile?firstTime=true');
    } catch (error: any) {
      console.error('[Onboarding] Error completing onboarding:', error);
      
      // Handle specific error cases
      if (error.message.includes('No active session')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please sign in again.',
          [
            {
              text: 'Sign In',
              onPress: () => router.replace('/login')
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to complete onboarding. Please try again.',
          [
            {
              text: 'Try Again',
              onPress: handleComplete
            }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => {
    const isActive = index === currentStep;
    const Icon = item.icon;
    
    return (
      <View 
        style={[
          styles.stepContainer,
          { width }
        ]}
      >
        <View style={styles.iconContainer}>
          <Icon size={32} color={Colors.primary} style={styles.stepIcon} />
        </View>
        
        <View style={styles.bubbleContainer}>
          <AnimatedBubble isActive={isActive && bubbleActive} size={180} />
        </View>
        
        <Text style={styles.stepTitle}>{item.title}</Text>
        <Text style={styles.stepDescription}>{item.description}</Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        ref={slidesRef}
        data={onboardingSteps}
        renderItem={renderStep}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        style={styles.scrollView}
      />
      
      <View style={styles.footer}>
        <View style={styles.indicators}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentStep && styles.activeIndicator
              ]}
            />
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              {currentStep === onboardingSteps.length - 1 ? (
                <Check size={20} color="#fff" />
              ) : (
                <ArrowRight size={20} color="#fff" />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepIcon: {
    opacity: 0.9,
  },
  bubbleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: '100%',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default OnboardingScreen;
