import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { marketplaceService } from '@/services/marketplace-service';
import { MarketplaceTransaction, MarketplaceMessage } from '@/types/property';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { formatPrice } from '@/utils/format';
import { PropertyImage } from '@/components/PropertyImage';

export default function MarketplaceTransactionPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<MarketplaceTransaction | null>(null);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (id) {
      loadTransaction(id);
      loadMessages(id);
    } else {
      setLoading(false);
      Alert.alert('Error', 'No transaction ID provided.');
      router.back();
    }
  }, [id, user]);

  const loadTransaction = async (transactionId: string) => {
    try {
      setLoading(true);
      const data = await marketplaceService.getMarketplaceTransaction(transactionId);
      
      // Check if user is part of this transaction
      if (data.buyerId !== user?.id && data.sellerId !== user?.id) {
        Alert.alert('Error', 'You do not have access to this transaction.');
        router.back();
        return;
      }
      
      setTransaction(data);
    } catch (error) {
      console.error('Error loading transaction:', error);
      Alert.alert('Error', 'Failed to load transaction details. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (transactionId: string) => {
    try {
      setMessagesLoading(true);
      const response = await marketplaceService.getMarketplaceMessages(transactionId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !transaction || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      await marketplaceService.sendMarketplaceMessage(
        transaction.id,
        user.id,
        newMessage.trim()
      );
      
      // Reload messages
      await loadMessages(transaction.id);
      
      // Clear input
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isUserBuyer = user && transaction && user.id === transaction.buyerId;
  const isUserSeller = user && transaction && user.id === transaction.sellerId;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading transaction details...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>Transaction not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImage = transaction.property?.images && transaction.property.images.length > 0 
    ? transaction.property.images[0] 
    : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80';

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen
        options={{
          title: 'Transaction Details',
        }}
      />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        ref={scrollViewRef}
      >
        <View style={styles.transactionCard}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionTitle}>Marketplace Purchase</Text>
            <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
          </View>
          
          <View style={styles.propertyCard}>
            {transaction.property && (
              <>
                <PropertyImage uri={displayImage} style={styles.propertyImage} />
                <View style={styles.propertyDetails}>
                  <Text style={styles.propertyTitle}>{transaction.property.title}</Text>
                  <Text style={styles.propertyLocation}>{transaction.property.location}</Text>
                </View>
              </>
            )}
          </View>
          
          <View style={styles.transactionDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID:</Text>
              <Text style={styles.detailValue}>{transaction.id.substring(0, 8)}...</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sale Price:</Text>
              <Text style={styles.detailValue}>{formatPrice(transaction.salePrice, 'AED')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Platform Fee:</Text>
              <Text style={styles.detailValue}>{formatPrice(transaction.platformFee, 'AED')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seller Earnings:</Text>
              <Text style={styles.detailValue}>{formatPrice(transaction.sellerEarning, 'AED')}</Text>
            </View>
          </View>
          
          <View style={styles.partiesContainer}>
            <View style={styles.partyCard}>
              <Text style={styles.partyLabel}>Buyer</Text>
              <View style={styles.partyInfo}>
                <Ionicons name="person-circle-outline" size={24} color={colors.textLight} />
                <Text style={styles.partyName}>{transaction.buyer?.name || 'Anonymous'}</Text>
                {isUserBuyer && <Text style={styles.youLabel}>(You)</Text>}
              </View>
            </View>
            
            <View style={styles.partyCard}>
              <Text style={styles.partyLabel}>Seller</Text>
              <View style={styles.partyInfo}>
                <Ionicons name="person-circle-outline" size={24} color={colors.textLight} />
                <Text style={styles.partyName}>{transaction.seller?.name || 'Anonymous'}</Text>
                {isUserSeller && <Text style={styles.youLabel}>(You)</Text>}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.messagesContainer}>
          <Text style={styles.messagesTitle}>Messages</Text>
          
          {messagesLoading ? (
            <View style={styles.messagesLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.messagesLoadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.noMessages}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.textLight} />
              <Text style={styles.noMessagesText}>No messages yet</Text>
              <Text style={styles.noMessagesSubtext}>Start a conversation with the {isUserBuyer ? 'seller' : 'buyer'}</Text>
            </View>
          ) : (
            <View style={styles.messagesList}>
              {messages.map((message) => (
                <View 
                  key={message.id} 
                  style={[
                    styles.messageItem,
                    message.senderId === user?.id ? styles.sentMessage : styles.receivedMessage
                  ]}
                >
                  <Text style={[
                    styles.messageContent,
                    message.senderId === user?.id ? styles.sentMessageText : styles.receivedMessageText
                  ]}>{message.content}</Text>
                  <Text style={[
                    styles.messageTime,
                    message.senderId === user?.id ? styles.sentMessageTime : styles.receivedMessageTime
                  ]}>{formatDate(message.createdAt)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={`Message the ${isUserBuyer ? 'seller' : 'buyer'}...`}
          placeholderTextColor={colors.input.placeholder}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.disabledButton]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sendingMessage}
        >
          {sendingMessage ? (
            <ActivityIndicator size="small" color={colors.button.text.primary} />
          ) : (
            <Ionicons name="send" size={20} color={colors.button.text.primary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.button.text.primary,
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primaryLight,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  propertyCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  propertyImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  propertyDetails: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: colors.textLight,
  },
  transactionDetails: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  partiesContainer: {
    padding: 16,
    flexDirection: 'row',
  },
  partyCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.input.background,
    marginHorizontal: 4,
  },
  partyLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  partyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  youLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  messagesContainer: {
    marginBottom: 24,
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  messagesLoading: {
    alignItems: 'center',
    padding: 20,
  },
  messagesLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textLight,
  },
  noMessages: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.input.background,
    borderRadius: 12,
  },
  noMessagesText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  noMessagesSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  messagesList: {
    marginBottom: 16,
  },
  messageItem: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.input.background,
  },
  messageContent: {
    fontSize: 14,
    marginBottom: 4,
  },
  sentMessageText: {
    color: colors.button.text.primary,
  },
  receivedMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedMessageTime: {
    color: colors.textLight,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.input.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    color: colors.input.text,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  disabledButton: {
    backgroundColor: colors.button.disabled,
  },
});
