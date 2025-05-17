import React, { useEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useChatStore } from '@/store/chat-store';
import { useAuth } from '@/hooks/use-auth';
import { createOrGetChatSession } from '@/services/supabase-service';

export default function ChatRedirect() {
  const { user } = useAuth();
  const { setCurrentSession } = useChatStore();
  const { userId: realtorId } = useLocalSearchParams();

  useEffect(() => {
    const initializeChat = async () => {
      if (user && realtorId) {
        try {
          const session = await createOrGetChatSession(user.id, String(realtorId));
          setCurrentSession(session);
        } catch (error) {
          console.error('Error creating/getting chat session:', error);
          // Handle error appropriately, maybe redirect to an error page
        }
      }
    };

    initializeChat();
  }, [user, realtorId, setCurrentSession]);

  return <Redirect href="/(tabs)/chat" />;
}
