import React from 'react';
import { Redirect } from 'expo-router';
import { useChatStore } from '@/store/chat-store';

export default function ChatRedirect() {
  const { currentSession } = useChatStore();
  if (!currentSession) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(tabs)/chat" />;
}