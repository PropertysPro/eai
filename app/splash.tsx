import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Image, 
  Animated,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/config/supabase';
import AnimatedBubble from '@/components/AnimatedBubble';
import { colors as Colors } from '@/constants/colors';
import { APP_NAME, APP_TAGLINE } from '@/constants/logo';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [bubbleActive, setBubbleActive] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Activate bubble animation on load and start other animations
  useEffect(() => {
    setBubbleActive(true);
    const timer = setTimeout(() => setBubbleActive(false), 2000);
    
    // Sequence of animations
    Animated.sequence([
      // Fade in and slide up the app name and tagline
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Then fade in the button
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is already logged in
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        console.log("User is already logged in, navigating to home");
        router.replace('/(tabs)');
      } else {
        console.log("No active session, navigating to login");
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error("Error checking session:", error);
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        
        <View style={styles.content}>
          <View style={styles.bubbleContainer}>
            <AnimatedBubble isActive={bubbleActive} size={180} />
          </View>
          
          <Animated.View 
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.handwrittenTagline}>Buy Sell Rent Intelligently</Text>
            <Text style={styles.subTagline}>{APP_TAGLINE}</Text>
          </Animated.View>
          
          <Animated.View style={{ opacity: buttonFadeAnim, width: '100%' }}>
            <TouchableOpacity 
              style={styles.button}
              onPress={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Let's Start</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>AI-Powered Matching</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Distressed Deals</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Smart Recommendations</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bubbleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  handwrittenTagline: {
    fontSize: 32,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive',
    fontWeight: '400',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    transform: [{ rotate: '-1deg' }],
  },
  subTagline: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: width > 400 ? 300 : width - 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  featuresContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  featureText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
});
