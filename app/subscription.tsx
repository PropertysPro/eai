import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Check, X, CreditCard, Shield, Zap, MessageSquare, Building, Search } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    description: 'Basic access to real estate assistant',
    features: [
      'Up to 10 messages per day',
      'Basic property search',
      'Limited property listings',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9.99',
    description: 'Enhanced features for serious buyers',
    features: [
      'Unlimited messages',
      'Advanced property search',
      'Full property listings',
      'Market analysis reports',
      'Priority email support'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '19.99',
    description: 'Complete solution for real estate professionals',
    features: [
      'All Pro features',
      'Investment property analysis',
      'Neighborhood insights',
      'Market trend predictions',
      'Dedicated support agent',
      'Custom property alerts'
    ]
  }
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };
  
  const handleSubscribe = () => {
    if (!selectedPlan) {
      Alert.alert('Please Select a Plan', 'Please select a subscription plan to continue.');
      return;
    }
    
    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    
    if (selectedPlan === 'free') {
      // For free plan, just go back to home
      Alert.alert('Free Plan Selected', 'You are now on the Free plan.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
      return;
    }
    
    // For paid plans, go to checkout
    router.push({
      pathname: '/checkout',
      params: {
        planId: plan?.id,
        planName: plan?.name,
        price: plan?.price
      }
    });
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <Stack.Screen 
        options={{
          title: 'Subscription Plans',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Upgrade to unlock premium features and get the most out of your real estate assistant
          </Text>
        </View>
        
        <View style={styles.plansContainer}>
          {subscriptionPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlanCard,
                plan.popular && styles.popularPlanCard
              ]}
              onPress={() => handleSelectPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceCurrency}>$</Text>
                  <Text style={styles.priceAmount}>{plan.price}</Text>
                  <Text style={styles.priceInterval}>/month</Text>
                </View>
              </View>
              
              <Text style={styles.planDescription}>{plan.description}</Text>
              
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={16} color={Colors.primary} style={styles.featureIcon} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.selectContainer}>
                <View 
                  style={[
                    styles.radioButton,
                    selectedPlan === plan.id && styles.radioButtonSelected
                  ]}
                >
                  {selectedPlan === plan.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text 
                  style={[
                    styles.selectText,
                    selectedPlan === plan.id && styles.selectTextSelected
                  ]}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>All Plans Include</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Shield size={24} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Secure Messaging</Text>
              <Text style={styles.featureDescription}>
                End-to-end encrypted conversations with our AI assistant
              </Text>
            </View>
          </View>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <MessageSquare size={24} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Expert Advice</Text>
              <Text style={styles.featureDescription}>
                Get professional real estate guidance and recommendations
              </Text>
            </View>
          </View>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Building size={24} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Property Insights</Text>
              <Text style={styles.featureDescription}>
                Detailed information about properties and neighborhoods
              </Text>
            </View>
          </View>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Search size={24} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Property Search</Text>
              <Text style={styles.featureDescription}>
                Find properties that match your criteria and preferences
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.guaranteeSection}>
          <View style={styles.guaranteeIconContainer}>
            <Zap size={24} color="#fff" />
          </View>
          <View style={styles.guaranteeContent}>
            <Text style={styles.guaranteeTitle}>30-Day Money-Back Guarantee</Text>
            <Text style={styles.guaranteeDescription}>
              If you're not satisfied with our service, we'll refund your subscription within 30 days.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.subscribeButton}
          onPress={handleSubscribe}
          disabled={!selectedPlan}
        >
          <Text style={styles.subscribeButtonText}>
            {selectedPlan === 'free' ? 'Continue with Free Plan' : 'Subscribe Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    lineHeight: 22,
  },
  plansContainer: {
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(106, 13, 173, 0.05)',
  },
  popularPlanCard: {
    borderColor: Colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 4,
  },
  priceInterval: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textLight,
  },
  selectTextSelected: {
    color: Colors.primary,
  },
  featuresSection: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(106, 13, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  guaranteeSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(106, 13, 173, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  guaranteeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  guaranteeDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 20,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});