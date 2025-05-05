import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Brain, MessageSquare, Home, Search, Shield, ArrowRight } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import AnimatedBubble from '@/components/AnimatedBubble';

const { width } = Dimensions.get('window');

export default function HowWeWorkScreen() {
  const router = useRouter();
  const [bubbleActive, setBubbleActive] = useState(true);
  
  // Activate bubble animation on load
  useEffect(() => {
    setBubbleActive(true);
    const timer = setTimeout(() => setBubbleActive(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <Stack.Screen 
        options={{
          title: 'How We Work',
          headerTitleStyle: { color: Colors.text },
          headerStyle: { backgroundColor: Colors.background },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <View style={styles.heroBackground} />
          <View style={styles.bubbleContainer}>
            <AnimatedBubble isActive={bubbleActive} size={150} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>EAI</Text>
            <Text style={styles.heroSubtitle}>Your AI-powered real estate assistant</Text>
          </View>
        </View>
        
        <Text style={styles.title}>How EAI Works</Text>
        <Text style={styles.subtitle}>
          EAI uses advanced artificial intelligence to help you find your perfect property
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Brain size={28} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI-Powered Matching</Text>
              <Text style={styles.featureDescription}>
                Our advanced AI analyzes thousands of properties and matches them to your preferences, 
                saving you time and helping you find exactly what you're looking for.
              </Text>
            </View>
          </View>
        
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <MessageSquare size={28} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Natural Conversations</Text>
              <Text style={styles.featureDescription}>
                Simply chat with EAI as you would with a real estate agent. Ask questions, 
                describe what you're looking for, and get personalized recommendations.
              </Text>
            </View>
          </View>
        
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Home size={28} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Property Management</Text>
              <Text style={styles.featureDescription}>
                List your properties, track inquiries, and manage viewings all in one place. 
                EAI helps you stay organized whether you're buying, selling, or renting.
              </Text>
            </View>
          </View>
        
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Search size={28} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Search</Text>
              <Text style={styles.featureDescription}>
                Our intelligent search understands context and learns from your preferences over time, 
                making each search more accurate than the last.
              </Text>
            </View>
          </View>
        
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Shield size={28} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Privacy & Security</Text>
              <Text style={styles.featureDescription}>
                Your data is secure with us. We use industry-standard encryption and never share your 
                personal information without your consent.
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Our Technology</Text>
          <Text style={styles.infoText}>
            EAI is built on state-of-the-art natural language processing and machine learning 
            technologies. Our AI is continuously trained on real estate data to provide the most 
            accurate and helpful assistance possible.
            {"\n\n"}
            We combine the power of artificial intelligence with human expertise to create a 
            seamless real estate experience that saves you time and helps you make better decisions.
          </Text>
        </View>
        
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>Ready to find your perfect property?</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <Text style={styles.ctaButtonText}>Start Exploring</Text>
            <ArrowRight size={20} color="#FFFFFF" style={styles.ctaButtonIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginLeft: 8,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 0,
    paddingBottom: 40,
  },
  heroSection: {
    height: 320,
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${Colors.primary}10`,
  },
  bubbleContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    top: 20, // Position bubble at the top
  },
  heroContent: {
    alignItems: 'center',
    marginTop: 180, // Increased to position text below the bubble
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: 32,
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 32,
    paddingHorizontal: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 20,
    marginBottom: 16,
    backgroundColor: Colors.card.background,
    borderRadius: 16,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: `${Colors.primary}15`,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
  },
  infoContainer: {
    margin: 16,
    padding: 24,
    backgroundColor: `${Colors.primary}08`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}15`,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 22,
  },
  ctaContainer: {
    margin: 16,
    padding: 24,
    backgroundColor: Colors.card.background,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width > 400 ? 250 : width - 80,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  ctaButtonIcon: {
    marginLeft: 4,
  },
});
