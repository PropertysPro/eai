import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { walletService } from '@/services/wallet-service';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { formatPrice } from '@/utils/format';

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000];

export default function DepositPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'bank' | 'paypal'>('card');
  const [loading, setLoading] = useState(false);

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const filtered = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = filtered.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts.length > 1 && parts[1].length > 2) {
      return;
    }
    
    setAmount(filtered);
  };

  const selectPresetAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleDeposit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to deposit funds.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    // Simulate payment gateway integration
    Alert.alert(
      'Confirm Deposit',
      `Are you sure you want to deposit ${formatPrice(parseFloat(amount), 'AED')} to your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: processDeposit }
      ]
    );
  };

  const processDeposit = async () => {
    try {
      setLoading(true);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process the deposit
      await walletService.depositFunds(user!.id, parseFloat(amount));
      
      Alert.alert(
        'Deposit Successful',
        `${formatPrice(parseFloat(amount), 'AED')} has been added to your wallet.`,
        [
          { text: 'View Wallet', onPress: () => router.replace('/(tabs)/wallet') }
        ]
      );
    } catch (error) {
      console.error('Error processing deposit:', error);
      Alert.alert('Deposit Failed', 'There was an error processing your deposit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodOption = (method: 'card' | 'bank' | 'paypal', label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.paymentMethodOption,
        selectedPaymentMethod === method && styles.selectedPaymentMethod
      ]}
      onPress={() => setSelectedPaymentMethod(method)}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={selectedPaymentMethod === method ? colors.primary : colors.textLight}
      />
      <Text
        style={[
          styles.paymentMethodLabel,
          selectedPaymentMethod === method && styles.selectedPaymentMethodLabel
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Add Funds',
        }}
      />

      <View style={styles.content}>
        <View style={styles.amountContainer}>
          <Text style={styles.label}>Amount to Deposit</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>AED</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.input.placeholder}
            />
          </View>
        </View>

        <View style={styles.presetAmountsContainer}>
          <Text style={styles.presetLabel}>Quick Select</Text>
          <View style={styles.presetButtons}>
            {PRESET_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.presetButton,
                  amount === value.toString() && styles.selectedPresetButton
                ]}
                onPress={() => selectPresetAmount(value)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    amount === value.toString() && styles.selectedPresetButtonText
                  ]}
                >
                  {formatPrice(value, 'AED')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.paymentMethodContainer}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentMethodOptions}>
            {renderPaymentMethodOption('card', 'Credit Card', 'card-outline')}
            {renderPaymentMethodOption('bank', 'Bank Transfer', 'business-outline')}
            {renderPaymentMethodOption('paypal', 'PayPal', 'logo-paypal')}
          </View>
        </View>

        {selectedPaymentMethod === 'card' && (
          <View style={styles.cardDetailsContainer}>
            <Text style={styles.label}>Card Details</Text>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Card Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1234 5678 9012 3456"
                keyboardType="number-pad"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="MM/YY"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.input.placeholder}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>CVV</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="123"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.input.placeholder}
                  secureTextEntry
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="John Doe"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>
          </View>
        )}

        {selectedPaymentMethod === 'bank' && (
          <View style={styles.bankDetailsContainer}>
            <Text style={styles.label}>Bank Transfer Details</Text>
            <Text style={styles.bankInstructions}>
              Please transfer the amount to the following bank account and upload the receipt:
            </Text>
            <View style={styles.bankDetails}>
              <Text style={styles.bankDetailItem}>Bank: Emirates NBD</Text>
              <Text style={styles.bankDetailItem}>Account Name: Property Marketplace LLC</Text>
              <Text style={styles.bankDetailItem}>Account Number: 1234567890</Text>
              <Text style={styles.bankDetailItem}>IBAN: AE123456789012345678901</Text>
              <Text style={styles.bankDetailItem}>Swift Code: EBILAEAD</Text>
            </View>
            <TouchableOpacity style={styles.uploadButton}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.button.text.secondary} />
              <Text style={styles.uploadButtonText}>Upload Receipt</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedPaymentMethod === 'paypal' && (
          <View style={styles.paypalContainer}>
            <Text style={styles.label}>PayPal</Text>
            <Text style={styles.paypalInstructions}>
              You will be redirected to PayPal to complete your payment.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.depositButton, (!amount || loading) && styles.disabledButton]}
          onPress={handleDeposit}
          disabled={!amount || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.button.text.primary} />
          ) : (
            <>
              <Ionicons name="wallet-outline" size={20} color={colors.button.text.primary} />
              <Text style={styles.depositButtonText}>Deposit Funds</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By proceeding with this deposit, you agree to our Terms of Service and Privacy Policy.
          Funds will be available in your wallet immediately after the payment is processed.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  amountContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    backgroundColor: colors.input.background,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.input.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: colors.input.text,
    paddingVertical: 12,
  },
  presetAmountsContainer: {
    marginBottom: 24,
  },
  presetLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: colors.background,
  },
  selectedPresetButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedPresetButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  paymentMethodContainer: {
    marginBottom: 24,
  },
  paymentMethodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedPaymentMethod: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  paymentMethodLabel: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textLight,
  },
  selectedPaymentMethodLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  cardDetailsContainer: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: 8,
    backgroundColor: colors.input.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.input.text,
  },
  row: {
    flexDirection: 'row',
  },
  bankDetailsContainer: {
    marginBottom: 24,
  },
  bankInstructions: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  bankDetails: {
    backgroundColor: colors.input.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bankDetailItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  uploadButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  paypalContainer: {
    marginBottom: 24,
  },
  paypalInstructions: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  depositButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: colors.button.disabled,
  },
  depositButtonText: {
    color: colors.button.text.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
});
