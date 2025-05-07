import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, ChatSession, MessageRole, UserPreferences, Attachment } from '@/types/chat';
import { supabase } from '@/config/supabase';
import { Property } from '@/types/property';

interface ChatStore {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  preferences: UserPreferences;
  
  // Actions
  createChatSession: (title: string) => Promise<ChatSession>;
  createSessionWithProperty: (property: Property) => Promise<string>;
  setCurrentSession: (session: ChatSession) => void;
  clearCurrentSession: () => void;
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<ChatMessage>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;
  fetchChatSessions: () => Promise<ChatSession[]>;
  loadChatSession: (sessionId: string) => Promise<ChatSession>;
  clearMessages: () => void;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  language: 'en',
  darkMode: false,
  biometricAuth: false,
  notifications: {
    matches: true,
    marketUpdates: true,
    newListings: true
  }
};

// Create store
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,
      preferences: defaultPreferences,
      
      updatePreferences: (newPreferences: Partial<UserPreferences>) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
            notifications: {
              ...state.preferences.notifications,
              ...(newPreferences.notifications || {})
            }
          }
        }));
      },
      
      createChatSession: async (title: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Create a new session
          const newSession: ChatSession = {
            id: uuidv4(),
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0,
            messages: [],
          };
          
          // Try to save to Supabase if available
          try {
            // Get current user session
            const { data: { session: authSession } } = await supabase.auth.getSession();
            
            if (authSession?.user) {
              console.log('[Chat Store] Saving chat session to Supabase for user:', authSession.user.id);
              
              // Save to chat_sessions table
              const { data, error } = await supabase
                .from('chat_sessions')
                .insert({
                  id: newSession.id,
                  user_id: authSession.user.id,
                  title: newSession.title,
                  created_at: newSession.createdAt,
                  updated_at: newSession.updatedAt,
                  message_count: 0,
                  last_message: null,
                })
                .select();
              
              if (error) {
                console.error('[Chat Store] Error saving chat session to Supabase:', error.message);
                console.error('[Chat Store] Error details:', error);
                // Continue with local storage even if Supabase save fails
              } else {
                console.log('[Chat Store] Chat session saved to Supabase:', data);
              }
            } else {
              console.log('[Chat Store] No authenticated user found, skipping Supabase save');
            }
          } catch (error: any) {
            console.error('[Chat Store] Error saving to Supabase:', error.message);
            // Continue even if Supabase save fails
          }
          
          // Update store
          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSession: newSession,
            isLoading: false,
          }));
          
          return newSession;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      createSessionWithProperty: async (property: Property) => {
        try {
          set({ isLoading: true, error: null });
          
          // Create a new session with property context - chat with admin only
          const newSession: ChatSession = {
            id: uuidv4(),
            title: `Chat with Admin about ${property.title}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0,
            messages: [],
            isAdminChat: true, // Mark this as an admin chat
          };
          
          // Try to save to Supabase if available
          try {
            // Get current user session
            const { data: { session: authSession } } = await supabase.auth.getSession();
            
            if (authSession?.user) {
              console.log('[Chat Store] Saving chat session with property to Supabase for user:', authSession.user.id);
              
              // Save to chat_sessions table
              const { data, error } = await supabase
                .from('chat_sessions')
                .insert({
                  id: newSession.id,
                  user_id: authSession.user.id,
                  title: newSession.title,
                  created_at: newSession.createdAt,
                  updated_at: newSession.updatedAt,
                  message_count: 0,
                  last_message: null,
                  property_id: property.id,
                })
                .select();
              
              if (error) {
                console.error('[Chat Store] Error saving chat session to Supabase:', error.message);
                console.error('[Chat Store] Error details:', error);
                // Continue with local storage even if Supabase save fails
              } else {
                console.log('[Chat Store] Chat session saved to Supabase:', data);
              }
            } else {
              console.log('[Chat Store] No authenticated user found, skipping Supabase save');
            }
          } catch (error: any) {
            console.error('[Chat Store] Error saving to Supabase:', error.message);
            // Continue even if Supabase save fails
          }
          
          // Update store
          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSession: newSession,
            isLoading: false,
          }));
          
          return newSession.id;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      setCurrentSession: (session: ChatSession) => {
        set({ currentSession: session });
      },
      
      clearCurrentSession: () => {
        set({ currentSession: null });
      },
      
      sendMessage: async (content: string, attachments?: Attachment[]) => {
        let updatedSession: ChatSession;
        let assistantMessage: ChatMessage;

        try {
          set({ isLoading: true, error: null });
          
          const { currentSession } = get();
          
          if (!currentSession) {
            throw new Error('No active chat session');
          }
          
          // Create user message
          const userMessage: ChatMessage = {
            id: uuidv4(),
            content,
            role: 'user' as MessageRole,
            createdAt: new Date().toISOString(),
            attachments,
          };
          
          // Add user message to session
          // Send message to external webhook
          try {
            const response = await fetch('https://cemai.app.n8n.cloud/webhook/cemai', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                content,
                sessionId: currentSession.id,
                userMessageId: userMessage.id,
                createdAt: userMessage.createdAt,
                attachments
              })
            });

            console.log('[Chat Store] Webhook response status:', response.status);

            if (!response.ok) {
              console.error('[Chat Store] Webhook failed with status:', response.status);
              throw new Error(`Webhook failed with status ${response.status}`);
            }

            const text = await response.text();
            console.log('[Chat Store] Webhook response text:', text);

            if (!text) {
              console.error('[Chat Store] Webhook returned empty response');
              // Create a default assistant message
              assistantMessage = {
                id: uuidv4(),
                content: 'Sorry, I encountered an error processing your message.',
                role: 'assistant' as MessageRole,
                createdAt: new Date().toISOString(),
              };
              
              updatedSession = {
                ...currentSession,
                messages: [...currentSession.messages, userMessage, assistantMessage],
                messageCount: currentSession.messageCount + 2,
                updatedAt: new Date().toISOString()
              };
            } else {
              const data = JSON.parse(text);
              console.log('[Chat Store] Webhook response data:', data);

              // Create assistant message
              assistantMessage = {
                id: uuidv4(),
                content: data[0].output,
                role: 'assistant' as MessageRole,
                createdAt: new Date().toISOString(),
              };

              console.log('[Chat Store] Assistant message:', assistantMessage);

              updatedSession = {
                ...currentSession,
                messages: [...currentSession.messages, userMessage, assistantMessage],
                messageCount: currentSession.messageCount + 2,
                updatedAt: new Date().toISOString()
              };

              // Update store with user message
              set((state) => ({
                sessions: state.sessions.map((s) => 
                  s.id === updatedSession.id ? updatedSession : s
                ),
                currentSession: updatedSession,
                isLoading: false,
              }));
            }

          } catch (webhookError: any) {
            console.error('[Chat Store] Error sending message to webhook:', webhookError);
            set({ error: webhookError.message, isLoading: false });
            throw webhookError;
          }
          
          // Try to save message to Supabase if available
          try {
            // Get current user session
            const { data: { session: authSession } } = await supabase.auth.getSession();
            
            if (authSession?.user) {
              console.log('[Chat Store] Saving user message to Supabase for user:', authSession.user.id);
              
              // Save message to chat_messages table
              const { error: messageError } = await supabase
                .from('chat_messages')
                .insert({
                  id: userMessage.id,
                  session_id: currentSession.id,
                  user_id: authSession.user.id,
                  content: userMessage.content,
                  role: userMessage.role,
                  created_at: userMessage.createdAt,
                  attachments: userMessage.attachments,
                });
              
              if (messageError) {
                console.error('[Chat Store] Error saving user message to Supabase:', messageError.message);
                console.error('[Chat Store] Error details:', messageError);
              } else {
                console.log('[Chat Store] User message saved to Supabase successfully');
              }
              
              // Update chat session in Supabase
              const { error: sessionError } = await supabase
                .from('chat_sessions')
                .update({
                  updated_at: updatedSession.updatedAt,
                  message_count: updatedSession.messageCount,
                  last_message: userMessage.content,
                })
                .eq('id', updatedSession.id.toString());
              
              if (sessionError) {
                console.error('[Chat Store] Error updating chat session in Supabase:', sessionError.message);
                console.error('[Chat Store] Error details:', sessionError);
              } else {
                console.log('[Chat Store] Chat session updated in Supabase successfully');
              }
            } else {
              console.log('[Chat Store] No authenticated user found, skipping Supabase save');
            }
          } catch (error: any) {
            console.error('[Chat Store] Error saving to Supabase:', error.message);
            // Continue even if Supabase save fails
          }
          
          return userMessage;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      deleteSession: async (sessionId: string) => {
        try {
          const { currentSession } = get();
          
          // Try to delete from Supabase if available
          try {
            // Get current user session
            const { data: { session: authSession } } = await supabase.auth.getSession();
            
            if (authSession?.user) {
              console.log('[Chat Store] Deleting chat session from Supabase:', sessionId);
              
              // Delete messages first (foreign key constraint)
              const { error: messagesError } = await supabase
                .from('chat_messages')
                .delete()
                .eq('session_id', sessionId);
              
              if (messagesError) {
                console.error('[Chat Store] Error deleting chat messages from Supabase:', messagesError.message);
                console.error('[Chat Store] Error details:', messagesError);
              } else {
                console.log('[Chat Store] Chat messages deleted from Supabase successfully');
              }
              
              // Then delete the session
              const { error: sessionError } = await supabase
                .from('chat_sessions')
                .delete()
                .eq('id', sessionId);
              
              if (sessionError) {
                console.error('[Chat Store] Error deleting chat session from Supabase:', sessionError.message);
                console.error('[Chat Store] Error details:', sessionError);
              } else {
                console.log('[Chat Store] Chat session deleted from Supabase successfully');
              }
            } else {
              console.log('[Chat Store] No authenticated user found, skipping Supabase delete');
            }
          } catch (error: any) {
            console.error('[Chat Store] Error deleting from Supabase:', error.message);
            // Continue even if Supabase delete fails
          }
          
          // Update store
          set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            currentSession: currentSession?.id === sessionId ? null : currentSession,
          }));
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },
      
      clearAllSessions: async () => {
        try {
          // Try to delete all from Supabase if available
          try {
            // Get current user session
            const { data: { session: authSession } } = await supabase.auth.getSession();
            
            if (authSession?.user) {
              console.log('[Chat Store] Deleting all chat sessions from Supabase for user:', authSession.user.id);
              
              // Get all session IDs for this user
              const { data: sessionsData, error: sessionsError } = await supabase
                .from('chat_sessions')
                .select('id')
                .eq('user_id', authSession.user.id.toString());
              
              if (sessionsError) {
                console.error('[Chat Store] Error getting chat sessions from Supabase:', sessionsError.message);
                console.error('[Chat Store] Error details:', sessionsError);
              } else if (sessionsData && sessionsData.length > 0) {
                const sessionIds = sessionsData.map(session => session.id);
                
                // Delete messages first (foreign key constraint)
                const { error: messagesError } = await supabase
                  .from('chat_messages')
                  .delete()
                  .in('session_id', sessionIds);
                
                if (messagesError) {
                  console.error('[Chat Store] Error deleting chat messages from Supabase:', messagesError.message);
                  console.error('[Chat Store] Error details:', messagesError);
                } else {
                  console.log('[Chat Store] All chat messages deleted from Supabase successfully');
                }
                
                // Then delete the sessions
                const { error: sessionsDeleteError } = await supabase
                  .from('chat_sessions')
                  .delete()
                  .in('id', sessionIds);
                
                if (sessionsDeleteError) {
                  console.error('[Chat Store] Error deleting chat sessions from Supabase:', sessionsDeleteError.message);
                  console.error('[Chat Store] Error details:', sessionsDeleteError);
                } else {
                  console.log('[Chat Store] All chat sessions deleted from Supabase successfully');
                }
              } else {
                console.log('[Chat Store] No chat sessions found for user:', authSession.user.id);
              }
            } else {
              console.log('[Chat Store] No authenticated user found, skipping Supabase delete');
            }
          } catch (error: any) {
            console.error('[Chat Store] Error clearing all from Supabase:', error.message);
            // Continue even if Supabase delete fails
          }
          
          // Update store
          set({
            sessions: [],
            currentSession: null,
          });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },
      
      fetchChatSessions: async () => {
        try {
          set({ isLoading: true, error: null });
          
          let sessions: ChatSession[] = [];
          
          // Try to fetch from Supabase if available
          try {
            // Get current user session
            const { data: { session: authSession } } = await supabase.auth.getSession();
            
            if (authSession?.user) {
              console.log('[Chat Store] Fetching chat sessions from Supabase for user:', authSession.user.id);
              
              // Get all sessions for this user
              const { data: sessionsData, error: sessionsError } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', authSession.user.id)
                .order('updated_at', { ascending: false });
              
              if (sessionsError) {
                console.error('[Chat Store] Error fetching chat sessions from Supabase:', sessionsError.message);
                console.error('[Chat Store] Error details:', sessionsError);
              } else if (sessionsData && sessionsData.length > 0) {
                console.log('[Chat Store] Found', sessionsData.length, 'chat sessions in Supabase');
                
                // Convert to our ChatSession format
                const chatSessions: ChatSession[] = [];
                
                for (const sessionData of sessionsData) {
                  // Get messages for this session
                  const { data: messagesData, error: messagesError } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('session_id', sessionData.id.toString())
                    .order('created_at', { ascending: true });
                  
                  if (messagesError) {
                    console.error('[Chat Store] Error fetching chat messages from Supabase:', messagesError.message);
                    console.error('[Chat Store] Error details:', messagesError);
                    continue;
                  }
                  
                  // Convert to our ChatMessage format
                  const messages: ChatMessage[] = messagesData?.map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    role: msg.role as MessageRole,
                    createdAt: msg.created_at,
                  })) || [];
                  
                  // Create ChatSession
                  chatSessions.push({
                    id: sessionData.id,
                    title: sessionData.title,
                    createdAt: sessionData.created_at,
                    updatedAt: sessionData.updated_at,
                    messageCount: sessionData.message_count,
                    messages,
                  });
                }
                
                sessions = chatSessions;
              } else {
                console.log('[Chat Store] No chat sessions found for user:', authSession.user.id);
              }
            } else {
              console.log('[Chat Store] No authenticated user found, using local sessions');
            }
          } catch (error: any) {
            console.error('[Chat Store] Error fetching from Supabase:', error.message);
            // Continue with local sessions if Supabase fetch fails
          }
          
          // If no sessions from Supabase, use local sessions
          if (sessions.length === 0) {
            console.log('[Chat Store] Using local sessions');
            sessions = get().sessions;
          } else {
            // Update local sessions with Supabase data
            set({ sessions });
          }
          
          set({ isLoading: false });
          return sessions;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      loadChatSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          let session: ChatSession | null = null;
          
          // Try to fetch from Supabase if available
          try {
            // Get current user session
            const { data: { session: authSession } } = await supabase.auth.getSession();
            
            if (authSession?.user) {
              console.log('[Chat Store] Fetching chat session from Supabase:', sessionId);
              
              // Get session
              const { data: sessionData, error: sessionError } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();
              
              if (sessionError) {
                console.error('[Chat Store] Error fetching chat session from Supabase:', sessionError.message);
                console.error('[Chat Store] Error details:', sessionError);
              } else if (sessionData) {
                // Get messages for this session
                const { data: messagesData, error: messagesError } = await supabase
                  .from('chat_messages')
                  .select('*')
                  .eq('session_id', sessionId)
                  .order('created_at', { ascending: true });
                
                if (messagesError) {
                  console.error('[Chat Store] Error fetching chat messages from Supabase:', messagesError.message);
                  console.error('[Chat Store] Error details:', messagesError);
                } else {
                  // Convert to our ChatMessage format
                  const messages: ChatMessage[] = messagesData?.map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    role: msg.role as MessageRole,
                    createdAt: msg.created_at,
                  })) || [];
                  
                  // Create ChatSession
                  session = {
                    id: sessionData.id,
                    title: sessionData.title,
                    createdAt: sessionData.created_at,
                    updatedAt: sessionData.updatedAt,
                    messageCount: sessionData.message_count,
                    messages,
                  };
                }
              }
            } else {
              console.log('[Chat Store] No authenticated user found, using local session');
            }
          } catch (error: any) {
            console.error('[Chat Store] Error fetching from Supabase:', error.message);
            // Continue with local session if Supabase fetch fails
          }
          
          // If no session from Supabase, use local session
          if (!session) {
            console.log('[Chat Store] Using local session');
            const { sessions } = get();
            session = sessions.find(s => s.id === sessionId) || null;
          }
          
          if (!session) {
            throw new Error('Chat session not found');
          }
          
          set({ currentSession: session, isLoading: false });
          return session;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      clearMessages: () => {
        set({ currentSession: null });
      }
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist essential data
        preferences: state.preferences,
        // Store session metadata but not the full message history
        sessions: state.sessions.map(session => ({
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messageCount,
          // Limit stored messages to just the last one for context
          messages: session.messages.length > 0 ? [session.messages[session.messages.length - 1]] : []
        })),
        // Don't persist currentSession as it will be loaded when needed
        // currentSession: null
      }),
    }
  )
);


export default useChatStore;
