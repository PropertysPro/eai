import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { ChatMessage } from '@/types/chat';
import { getAllChatMessages, deleteChatMessage, getUserProfile, getUsersWithChatSessions } from '@/services/supabase-service';
import { Alert, ActivityIndicator, TextInput, Dimensions } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/config/supabase';
import { Property } from '@/types/property';
import { getAllProperties } from '@/services/supabase-service';
import { ScrollView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

export default function AdminChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any>({});
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'chat' | 'properties'>('chat');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.replace('/');
      return;
    }

    const fetchChatUsers = async () => {
      setLoading(true);
      try {
        const users = await getUsersWithChatSessions();
        setChatUsers(users);
      } catch (error) {
        console.error('Error fetching chat users:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMessagesAndProfiles = async () => {
      setLoading(true);
      try {
        let allMessages = [];
        if (selectedUser) {
          allMessages = await getAllChatMessages();
          allMessages = allMessages.filter(message => message.user_id === selectedUser);
        }
        setMessages(allMessages);

        // Fetch user profiles for all messages
        const profilePromises = allMessages.map(async (message: any) => {
          if (!userProfiles[message.user_id]) {
            try {
              const profile = await getUserProfile(message.user_id);
              return { [message.user_id]: profile };
            } catch (error) {
              console.error('Error fetching user profile:', error);
              return { [message.user_id]: { name: 'Unknown', role: 'user' } }; // Provide a default profile
            }
          }
          return null;
        });

        const profiles = await Promise.all(profilePromises);
        const newProfiles = Object.assign({}, userProfiles, ...profiles.filter(p => p !== null));
        setUserProfiles(newProfiles);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProperties = async () => {
      setLoading(true);
      try {
        const propertiesData = await getAllProperties();
        setProperties(propertiesData || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatUsers();
    if (selectedUser) {
      fetchMessagesAndProfiles();
    }
    fetchProperties();
  }, [user, selectedUser, selectedTab]);

  const handleBack = () => {
    router.back();
  };

  const handleDeleteMessage = async (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteChatMessage(messageId);
              setMessages(messages.filter((message) => message.id !== messageId));
            } catch (error) {
              console.error('Error deleting message:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleSendReply = async (messageId: string) => {
    if (!replyText.trim()) return;

    try {
      // Create a new message object
      const newMessage = {
        id: Math.random().toString(36).substring(2, 15), // Generate a random ID
        content: replyText,
        role: 'assistant', // Set the role to assistant for admin replies
        user_id: user?.id, // Set the user ID to the admin's ID
        createdAt: new Date().toISOString(),
        session_id: messageId, // Assuming messageId is the session ID
      };

      // Add the new message to the messages state
      setMessages([...messages, newMessage]);

      // Clear the reply text input
      setReplyText('');

      // Send the new message to Supabase
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert([
            {
              id: newMessage.id,
              content: newMessage.content,
              role: newMessage.role,
              user_id: newMessage.user_id,
              created_at: newMessage.createdAt,
              session_id: messageId,
            },
          ]);

        if (error) {
          console.error('Error sending reply to Supabase:', error);
        } else {
          console.log('Reply sent to Supabase:', data);
        }
      } catch (error) {
        console.error('Error sending reply:', error);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const userProfile = userProfiles[item.user_id] || { name: 'Unknown', role: 'user' };

    return (
      <View style={styles.messageContainer}>
        <View style={[
          styles.messageBubble,
          item.role === 'assistant' ? styles.assistantMessageBubble : styles.userMessageBubble
        ]}>
          <Text style={styles.messageUser}>
            {userProfile.name} ({userProfile.role})
          </Text>
          <Text style={[
            styles.messageContent,
            item.role === 'assistant' ? styles.assistantMessageText : styles.userMessageText
          ]}>{item.content}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteMessage(item.id)}>
          <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <View style={styles.propertyContainer}>
      <Text style={styles.propertyTitle}>{item.title}</Text>
      <Text style={styles.propertyLocation}>{item.location}</Text>
      <Text style={styles.propertyPrice}>{item.price}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'chat' && styles.activeTabButton,
          ]}
          onPress={() => setSelectedTab('chat')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'chat' && styles.activeTabText,
          ]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'properties' && styles.activeTabButton,
          ]}
          onPress={() => setSelectedTab('properties')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'properties' && styles.activeTabText,
          ]}>Properties</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView>
          {selectedTab === 'chat' && (
            <>
              {/* Chat Users */}
              <FlatList
                data={chatUsers}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setSelectedUser(item.user_id)}>
                    <Text>{item.user_id}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.user_id}
                contentContainerStyle={styles.messagesContainer}
              />

              {/* Chat Messages */}
              <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesContainer}
              />

              {/* Reply Input */}
              <View style={styles.replyContainer}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Type your reply..."
                  value={replyText}
                  onChangeText={setReplyText}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => handleSendReply('123')} // Replace '123' with the actual message ID
                >
                  <Send size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {selectedTab === 'properties' && (
            <FlatList
              data={properties}
              renderItem={renderProperty}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.propertiesContainer}
            />
          )}
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.text,
  },
  activeTabText: {
    color: '#fff',
  },
  messagesContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageUser: {
    fontWeight: 'bold',
  },
  deleteButton: {
    color: 'red',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: Colors.text,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
  },
  assistantMessageBubble: {
    backgroundColor: Colors.secondary,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertiesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  propertyContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  propertyLocation: {
    fontSize: 14,
    color: Colors.text,
  },
  propertyPrice: {
    fontSize: 14,
    color: Colors.primary,
  },
});
