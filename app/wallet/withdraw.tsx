import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { walletService } from '@/services/wallet-service';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { formatPrice } from '@/utils/format';

export default function WithdrawPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'paypal' | 'crypto'>('bank');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Bank transfer details
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  
  // PayPal details
  const [paypalEmail, setPaypalEmail] = useState('');
  
  // Crypto details
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState('BTC');

  useEffect(() => {
    if (user) {
      loadWalletBalance();
    } else {
      router.replace('/auth/login');
    }
  }, [user]);

  const loadWalletBalance = async () => {
    try {
      setInitialLoading(true);
      if (!user) return;

      const wallet = await walletService.getWallet(user.id);
      setWalletBalance(wallet.balance);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      Alert.alert('Error', 'Failed to load wallet balance. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handleWithdraw = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to withdraw funds.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    if (parseFloat(amount) > walletBalance) {
      Alert.alert('Error', 'Withdrawal amount exceeds your wallet balance.');
      return;
    }

    // Validate payment details based on selected method
    if (selectedPaymentMethod === 'bank' && (!accountName || !accountNumber || !bankName)) {
      Alert.alert('Error', 'Please fill in all bank account details.');
      return;
    } else if (selectedPaymentMethod === 'paypal' && !paypalEmail) {
      Alert.alert('Error', 'Please enter your PayPal email address.');
      return;
    } else if (selectedPaymentMethod === 'crypto' && !walletAddress) {
      Alert.alert('Error', 'Please enter your crypto wallet address.');
      return;
    }

    // Confirm withdrawal
    Alert.alert(
      'Confirm Withdrawal',
      `Are you sure you want to withdraw ${formatPrice(parseFloat(amount), 'AED')} from your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: processWithdrawal }
      ]
    );
  };

  const processWithdrawal = async () => {
    try {
      setLoading(true);
      
      // Prepare payment details based on selected method
      let paymentDetails = {};
      
      if (selectedPaymentMethod === 'bank') {
        paymentDetails = {
          method: 'bank',
          accountName,
          accountNumber,
          bankName,
          swiftCode
        };
      } else if (selectedPaymentMethod === 'paypal') {
        paymentDetails = {
          method: 'paypal',
          email: paypalEmail
        };
      } else if (selectedPaymentMethod === 'crypto') {
        paymentDetails = {
          method: 'crypto',
          walletAddress,
          currency: cryptoCurrency
        };
      }
      
      // Request withdrawal
      await walletService.requestWithdrawal(user!.id, parseFloat(amount), paymentDetails);
      
      Alert.alert(
        'Withdrawal Request Submitted',
        'Your withdrawal request has been submitted and is pending approval. You will be notified once it is processed.',
        [
          { text: 'View Wallet', onPress: () => router.replace('/(tabs)/wallet') }
        ]
      );
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Withdrawal Failed', 'There was an error processing your withdrawal request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodOption = (method: 'bank' | 'paypal' | 'crypto', label: string, icon: string) => (
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

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading wallet data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Withdraw Funds',
        }}
      />

      <View style={styles.content}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatPrice(walletBalance, 'AED')}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.label}>Amount to Withdraw</Text>
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
          <TouchableOpacity
            style={styles.maxButton}
            onPress={() => setAmount(walletBalance.toString())}
          >
            <Text style={styles.maxButtonText}>MAX</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.paymentMethodContainer}>
          <Text style={styles.label}>Withdrawal Method</Text>
          <View style={styles.paymentMethodOptions}>
            {renderPaymentMethodOption('bank', 'Bank Transfer', 'business-outline')}
            {renderPaymentMethodOption('paypal', 'PayPal', 'logo-paypal')}
            {renderPaymentMethodOption('crypto', 'Cryptocurrency', 'logo-bitcoin')}
          </View>
        </View>

        {selectedPaymentMethod === 'bank' && (
          <View style={styles.detailsContainer}>
            <Text style={styles.label}>Bank Account Details</Text>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.textInput}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="John Doe"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Account Number</Text>
              <TextInput
                style={styles.textInput}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="1234567890"
                keyboardType="number-pad"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Bank Name</Text>
              <TextInput
                style={styles.textInput}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Emirates NBD"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Swift Code (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={swiftCode}
                onChangeText={setSwiftCode}
                placeholder="EBILAEAD"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>
          </View>
        )}

        {selectedPaymentMethod === 'paypal' && (
          <View style={styles.detailsContainer}>
            <Text style={styles.label}>PayPal Details</Text>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>PayPal Email</Text>
              <TextInput
                style={styles.textInput}
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>
          </View>
        )}

        {selectedPaymentMethod === 'crypto' && (
          <View style={styles.detailsContainer}>
            <Text style={styles.label}>Cryptocurrency Details</Text>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Cryptocurrency</Text>
              <View style={styles.cryptoSelector}>
                {['BTC', 'ETH', 'USDT'].map(crypto => (
                  <TouchableOpacity
                    key={crypto}
                    style={[
                      styles.cryptoOption,
                      cryptoCurrency === crypto && styles.selectedCryptoOption
                    ]}
                    onPress={() => setCryptoCurrency(crypto)}
                  >
                    <Text
                      style={[
                        styles.cryptoOptionText,
                        cryptoCurrency === crypto && styles.selectedCryptoOptionText
                      ]}
                    >
                      {crypto}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Wallet Address</Text>
              <TextInput
                style={styles.textInput}
                value={walletAddress}
                onChangeText={setWalletAddress}
                placeholder="Enter your wallet address"
                autoCapitalize="none"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.withdrawButton,
            (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance || loading) && styles.disabledButton
          ]}
          onPress={handleWithdraw}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.button.text.primary} />
          ) : (
            <>
              <Ionicons name="cash-outline" size={20} color={colors.button.text.primary} />
              <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Withdrawal requests are typically processed within 1-3 business days.
          A minimum withdrawal amount of AED 100 is required. Withdrawal fees may apply depending on your chosen method.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textLight,
  },
  balanceContainer: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  amountContainer: {
    marginBottom: 24,
    position: 'relative',
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
  maxButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
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
  detailsContainer: {
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
  cryptoSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cryptoOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginRight: 8,
  },
  selectedCryptoOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cryptoOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedCryptoOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  withdrawButton: {
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
  withdrawButtonText: {
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
