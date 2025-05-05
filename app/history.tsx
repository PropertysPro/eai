import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Trash2 } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useChatStore } from '@/store/chat-store';
import { ChatSession } from '@/types/chat';
import { formatTimestamp } from '@/utils/helpers';

export default function HistoryScreen() {
  const router = useRouter();
  const { 
    sessions, 
    fetchChatSessions, 
    loadChatSession, 
    deleteSession,
    clearAllSessions,
    isLoading 
  } = useChatStore();
  
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadSessions();
  }, []);
  
  const loadSessions = async () => {
    try {
      setRefreshing(true);
      await fetchChatSessions();
    } catch (error) {
      console.error('Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load chat history. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleSessionPress = async (session: ChatSession) => {
    try {
      await loadChatSession(session.id);
      router.push('/chat');
    } catch (error) {
      console.error('Error loading session:', error);
      Alert.alert('Error', 'Failed to load chat session. Please try again.');
    }
  };
  
  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(sessionId);
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete chat. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleClearAll = () => {
    if (sessions.length === 0) {
      Alert.alert('No Chats', 'You have no chat history to clear.');
      return;
    }
    
    Alert.alert(
      'Clear All Chats',
      'Are you sure you want to delete all your chat history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllSessions();
            } catch (error) {
              console.error('Error clearing sessions:', error);
              Alert.alert('Error', 'Failed to clear chat history. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const renderSessionItem = ({ item }: { item: ChatSession }) => {
    // Format the timestamp using our helper function
    const formattedTime = formatTimestamp(item.updatedAt);
    
    return (
      <TouchableOpacity
        style={styles.sessionItem}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionIcon}>
          <MessageSquare size={24} color={Colors.primary} />
        </View>
        
        <View style={styles.sessionContent}>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.sessionDate}>
            {formattedTime}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteSession(item.id)}
        >
          <Trash2 size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Chat History</Text>
        
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClearAll}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      {/* Sessions List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={loadSessions}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Chat History</Text>
              <Text style={styles.emptyText}>
                Your chat history will appear here. Start a new chat to begin.
              </Text>
              <TouchableOpacity
                style={styles.newChatButton}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.newChatButtonText}>Start New Chat</Text>
              </TouchableOpacity>
            </View>
          }
        />
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
    justifyContent: 'space-between',
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
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(106, 13, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  newChatButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});