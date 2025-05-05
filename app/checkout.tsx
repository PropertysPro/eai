import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard, Calendar, Lock, Check } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/use-auth';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { planId, planName, price } = useLocalSearchParams<{ planId: string, planName: string, price: string }>();
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };
  
  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted.substring(0, 19)); // Limit to 16 digits + 3 spaces
  };
  
  const handleExpiryDateChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    setExpiryDate(formatted.substring(0, 5)); // Limit to MM/YY format
  };
  
  const handleCvvChange = (text: string) => {
    const v = text.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    setCvv(v.substring(0, 3)); // Limit to 3 digits
  };
  
  const validateForm = () => {
    if (!cardNumber || cardNumber.replace(/\s+/g, '').length < 16) {
      Alert.alert('Invalid Card Number', 'Please enter a valid 16-digit card number.');
      return false;
    }
    
    if (!cardName) {
      Alert.alert('Missing Information', 'Please enter the cardholder name.');
      return false;
    }
    
    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert('Invalid Expiry Date', 'Please enter a valid expiry date (MM/YY).');
      return false;
    }
    
    const [month, year] = expiryDate.split('/');
    const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of year
    const currentMonth = new Date().getMonth() + 1; // Months are 0-indexed
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      Alert.alert('Card Expired', 'The card expiration date has passed. Please use a valid card.');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid 3-digit CVV code.');
      return false;
    }
    
    return true;
  };
  
  // Save subscription to Supabase
  const saveSubscription = async () => {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      // Create a new subscription record with the minimal required fields
      // Using the correct column names from the database schema
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: user.id,
            plan_id: planId,
            status: 'active',
            is_active: true,
            cancel_at_period_end: false,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          }
        ])
        .select();

      if (subscriptionError) {
        console.error('Subscription error details:', subscriptionError);
        throw subscriptionError;
      }

      // Update user profile with new subscription status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription: planId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error details:', profileError);
        throw profileError;
      }

      // Store payment details in a separate table if needed
      // This would require creating a payments table in your schema
      // For now, we'll just log the payment details
      console.log('Payment processed successfully:', {
        user_id: user.id,
        plan_id: planId,
        amount: parseFloat(price),
        currency: 'USD',
        payment_method: 'credit_card',
        card_last4: cardNumber.slice(-4),
        card_holder: cardName
      });

      return subscriptionData;
    } catch (error: any) {
      console.error('Error saving subscription:', error.message);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Process payment (simulated for now)
      // In a real app, you would integrate with a payment gateway here
      
      // Save subscription data to Supabase
      await saveSubscription();
      
      setIsSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.replace({
          pathname: '/(tabs)',
          params: { subscriptionSuccess: 'true' }
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to process payment. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <Stack.Screen 
        options={{
          title: 'Checkout',
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
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {isSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Check size={40} color="#fff" />
              </View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successMessage}>
                Thank you for your purchase. Your subscription has been activated.
              </Text>
              <Text style={styles.redirectingText}>
                Redirecting to home...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Payment Failed</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity 
                style={styles.tryAgainButton}
                onPress={() => setError(null)}
              >
                <Text style={styles.tryAgainButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.orderSummary}>
                <Text style={styles.orderSummaryTitle}>Order Summary</Text>
                <View style={styles.orderItem}>
                  <Text style={styles.orderItemName}>{planName} Plan</Text>
                  <Text style={styles.orderItemPrice}>${price}/month</Text>
                </View>
                <View style={styles.orderTotal}>
                  <Text style={styles.orderTotalLabel}>Total</Text>
                  <Text style={styles.orderTotalAmount}>${price}/month</Text>
                </View>
              </View>
              
              <View style={styles.paymentForm}>
                <Text style={styles.paymentFormTitle}>Payment Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <View style={styles.inputContainer}>
                    <CreditCard size={20} color={Colors.textLight} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor={Colors.textLight}
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      keyboardType="number-pad"
                      maxLength={19}
                    />
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cardholder Name</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, styles.inputWithoutIcon]}
                      placeholder="John Doe"
                      placeholderTextColor={Colors.textLight}
                      value={cardName}
                      onChangeText={setCardName}
                    />
                  </View>
                </View>
                
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <View style={styles.inputContainer}>
                      <Calendar size={20} color={Colors.textLight} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        placeholderTextColor={Colors.textLight}
                        value={expiryDate}
                        onChangeText={handleExpiryDateChange}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={20} color={Colors.textLight} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor={Colors.textLight}
                        value={cvv}
                        onChangeText={handleCvvChange}
                        keyboardType="number-pad"
                        maxLength={3}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </View>
                
                <Text style={styles.secureText}>
                  <Lock size={14} color={Colors.textLight} /> Your payment information is secure and encrypted
                </Text>
              </View>
            </>
          )}
        </ScrollView>
        
        {!isSuccess && !error && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.payButton}
              onPress={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>Pay ${price}/month</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.termsText}>
              By completing this purchase, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
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
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  tryAgainButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  orderSummary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderItemName: {
    fontSize: 16,
    color: Colors.text,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  orderTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentForm: {
    marginBottom: 24,
  },
  paymentFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input.background,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  inputWithoutIcon: {
    paddingLeft: 12,
  },
  secureText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  redirectingText: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
});
