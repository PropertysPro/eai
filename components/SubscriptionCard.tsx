import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import SubscriptionPlan from '../app/subscription';
import { colors as Colors } from '@/constants/colors';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: (planId: string) => void;
}

export default function SubscriptionCard({ plan, isSelected, onSelect }: SubscriptionCardProps) {
  const getDurationText = () => {
    switch (plan.duration) {
      case 'month': return '/month';
      case '6months': return '/6 months';
      case 'year': return '/year';
      default: return '';
    }
  };
  
  // Format price with appropriate currency symbol
  const formatPrice = () => {
    if (plan.price === 0) return 'Free';
    
    const currencySymbol = plan.currency === 'USD' ? '$' : 'AED ';
    return `${currencySymbol}${plan.price}`;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        plan.isPopular && styles.popularContainer,
      ]}
      onPress={() => onSelect(plan.id)}
    >
      {plan.isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Popular</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.planName}>{plan.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice()}</Text>
          {plan.price > 0 && (
            <Text style={styles.duration}>{getDurationText()}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Check size={16} color={Colors.primary} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={[
          styles.selectButton,
          isSelected ? styles.selectedButton : null
        ]}
        onPress={() => onSelect(plan.id)}
      >
        <Text style={[
          styles.selectButtonText,
          isSelected ? styles.selectedButtonText : null
        ]}>
          {isSelected ? 'Current Plan' : 'Select Plan'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedContainer: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  popularContainer: {
    borderColor: Colors.primary,
    borderWidth: 1,
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
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  duration: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 2,
    marginBottom: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  selectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: Colors.primary,
  },
  selectButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  selectedButtonText: {
    color: 'white',
  },
});
