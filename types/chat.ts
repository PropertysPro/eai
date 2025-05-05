export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  createdAt: string;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  messages: ChatMessage[];
  category?: string;
  tags?: string[];
  isAdminChat?: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'location';
  url: string;
  name?: string;
  size?: number;
  metadata?: any;
}

export interface PropertyMatch {
  id: string;
  propertyId: string;
  userId: string;
  matchScore: number;
  matchReason: string;
  viewed: boolean;
  saved: boolean;
  createdAt: string;
}

export interface UserPreferences {
  language: string;
  darkMode: boolean;
  biometricAuth: boolean;
  notifications: {
    matches: boolean;
    marketUpdates: boolean;
    newListings: boolean;
  };
}

export interface ChatAnalytics {
  totalSessions: number;
  totalMessages: number;
  averageMessagesPerSession: number;
  mostActiveDay: string;
  topCategories: {
    category: string;
    count: number;
  }[];
  messagesByDay: {
    date: string;
    count: number;
  }[];
}

export interface ChatFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  tags?: string[];
  hasAttachments?: boolean;
  searchTerm?: string;
}

export interface ChatSettings {
  autoSave: boolean;
  deleteAfterDays: number;
  notifyNewMatches: boolean;
  shareAnalytics: boolean;
}
