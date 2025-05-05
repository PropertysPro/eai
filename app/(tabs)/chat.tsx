import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Send, ArrowLeft, Mic, Image as ImageIcon, X } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useChatStore } from '@/store/chat-store';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/auth-context';
import TypingIndicator from '@/components/TypingIndicator';
import { ChatMessage } from '@/types/chat';
import * as ImagePicker from 'expo-image-picker';

export default function ChatScreen() {
  const router = useRouter();
  const { user, checkMessageLimits, updateMessageUsage } = useAuth();
  const { 
    currentSession, 
    sendMessage, 
    isLoading,
    clearCurrentSession,
    createChatSession
  } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (currentSession?.messages && currentSession.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    
    // Simulate typing indicator for assistant messages
    if (isLoading) {
      setIsTyping(true);
    } else {
      // Hide typing indicator after a delay
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentSession?.messages, isLoading]);
  
  const handleAttachFile = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAttachedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to attach image. Please try again.');
    }
  };
  
  const handleSend = async () => {
    if ((!inputText.trim() && !attachedImage) || isLoading) return;
    
    try {
      let session = currentSession;
      
      // If no session exists, create a new one
      if (!session) {
        const sessionTitle = inputText.length > 30 ? `${inputText.substring(0, 30)}...` : inputText;
        session = await createChatSession(sessionTitle);
      }
      
      // Check message limits before sending
      if (user) {
        const result = await checkMessageLimits();
        if (!result.canSend) {
          Alert.alert(
            'Message Limit Reached',
            `You have reached your message limit (${result.limit} messages). Upgrade your plan to send more messages.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Upgrade', 
                onPress: () => router.push('/subscription')
              }
            ]
          );
          return;
        }
      }
      
      // Create attachments array if there's an image
      const attachments = attachedImage ? [{
        id: uuidv4(),
        type: 'image',
        url: attachedImage,
      }] : undefined;
      
      // Send message with attachments
      await sendMessage(inputText, attachments);
      const chatError = useChatStore.getState().error;
      if (chatError) {
        Alert.alert('Error', chatError || 'Failed to send message. Please try again.');
        return;
      }
      
      setInputText('');
      setAttachedImage(null);
      
      // Update message usage count if user is logged in
      if (user) {
        try {
          await updateMessageUsage();
        } catch (error) {
          console.error("Error updating message usage:", error);
        }
      }
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const storeError = useChatStore.getState().error;
      Alert.alert('Error', storeError || 'Failed to send message. Please try again.');
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const handleNewChat = () => {
    clearCurrentSession();
    router.replace('/(tabs)');
  };
  
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const imageAttachment = item.attachments?.find(att => att.type === 'image');
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.assistantMessageBubble
        ]}>
          {imageAttachment && (
            <Image 
              source={{ uri: imageAttachment.url }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentSession?.title || 'Chat'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={handleNewChat}
        >
          <X size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={currentSession?.messages || []}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />
      
      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <TypingIndicator />
        </View>
      )}
      
      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleAttachFile}
          >
            <ImageIcon size={20} color={Colors.textLight} />
          </TouchableOpacity>
          
          {attachedImage && (
            <View style={styles.attachedImageContainer}>
              <Image 
                source={{ uri: attachedImage }} 
                style={styles.attachedImage}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setAttachedImage(null)}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          
          {(inputText.trim() || attachedImage) ? (
            <TouchableOpacity 
              style={[
                styles.sendButton,
                isLoading && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={isLoading}
            >
              {isLoading ? (
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
              disabled={isLoading}
            >
              <Mic size={20} color={isRecording ? '#fff' : Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  newChatButton: {
    padding: 8,
  },
  messagesContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: Colors.textLight,
    fontSize: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
  },
  assistantMessageBubble: {
    backgroundColor: Colors.card.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: Colors.text,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.background,
    borderRadius: 24,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sendButton: {
    backgroundColor: Colors.info,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: Colors.card.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  micButtonActive: {
    backgroundColor: Colors.info,
    borderColor: Colors.info,
  },
  attachedImageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  attachedImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
});