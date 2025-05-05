import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notification } from '@/types/user';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/config/supabase';
import { v4 as uuidv4 } from 'uuid';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Load notifications from storage on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.id]);

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      // Optionally show a toast/alert: 'User not authenticated.'
      return;
    }

    setIsLoading(true);
    try {
      // Try to fetch from Supabase first
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('[Notification Store] Error fetching notifications from Supabase:', error.message);
          throw error;
        }

        if (data && data.length > 0) {
          setNotifications(data as Notification[]);
          return;
        }
      } catch (error) {
        console.error('[Notification Store] Supabase fetch failed, falling back to local storage');
      }

      // Fall back to AsyncStorage
      const storedNotifications = await AsyncStorage.getItem(`notifications_${user.id}`);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        // If no notifications found, initialize with sample notifications
        const sampleNotifications = getSampleNotifications(user.id);
        setNotifications(sampleNotifications);
        await AsyncStorage.setItem(`notifications_${user.id}`, JSON.stringify(sampleNotifications));
      }
    } catch (error) {
      console.error('[Notification Store] Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotificationsToStorage = async (updatedNotifications: Notification[]) => {
    if (!user) {
      // Optionally show a toast/alert: 'User not authenticated.'
      return;
    }

    try {
      // Try to save to Supabase first
      try {
        // This is a simplified approach - in a real app, you'd handle updates more carefully
        // For each notification, upsert it to Supabase
        for (const notification of updatedNotifications) {
          const { error } = await supabase
            .from('notifications')
            .upsert(notification, { onConflict: 'id' });

          if (error) {
            console.error('[Notification Store] Error saving notification to Supabase:', error.message);
          }
        }
      } catch (error) {
        console.error('[Notification Store] Supabase save failed, falling back to local storage');
      }

      // Always save to AsyncStorage as backup
      await AsyncStorage.setItem(`notifications_${user.id}`, JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('[Notification Store] Error saving notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) {
      // Optionally show a toast/alert: 'User not authenticated.'
      return;
    }

    try {
      const updatedNotifications = notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );

      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);

      // Try to update in Supabase
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id)
          .eq('userId', user.id);

        if (error) {
          console.error('[Notification Store] Error marking notification as read in Supabase:', error.message);
        }
      } catch (error) {
        console.error('[Notification Store] Supabase update failed');
      }
    } catch (error) {
      console.error('[Notification Store] Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) {
      // Optionally show a toast/alert: 'User not authenticated.'
      return;
    }

    try {
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));

      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);

      // Try to update in Supabase
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('userId', user.id);

        if (error) {
          console.error('[Notification Store] Error marking all notifications as read in Supabase:', error.message);
        }
      } catch (error) {
        console.error('[Notification Store] Supabase update failed');
      }
    } catch (error) {
      console.error('[Notification Store] Error marking all notifications as read:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!user) {
      // Optionally show a toast/alert: 'User not authenticated.'
      return;
    }

    try {
      // Ensure userId is always included when inserting into Supabase
      const newNotification: Notification = {
        ...notification,
        id: uuidv4(),
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      const updatedNotifications = [newNotification, ...notifications];
      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);

      // Try to add to Supabase
      try {
        const { error } = await supabase
          .from('notifications')
          .insert(newNotification);

        if (error) {
          console.error('[Notification Store] Error adding notification to Supabase:', error.message);
        }
      } catch (error) {
        console.error('[Notification Store] Supabase insert failed');
      }
    } catch (error) {
      console.error('[Notification Store] Error adding notification:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!user) {
      // Optionally show a toast/alert: 'User not authenticated.'
      return;
    }

    try {
      const updatedNotifications = notifications.filter(notification => notification.id !== id);
      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);

      // Try to delete from Supabase
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id)
          .eq('userId', user.id);

        if (error) {
          console.error('[Notification Store] Error deleting notification from Supabase:', error.message);
        }
      } catch (error) {
        console.error('[Notification Store] Supabase delete failed');
      }
    } catch (error) {
      console.error('[Notification Store] Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) {
      // Optionally show a toast/alert: 'User not authenticated.'
      return;
    }

    try {
      setNotifications([]);
      await AsyncStorage.removeItem(`notifications_${user.id}`);

      // Try to delete from Supabase
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('userId', user.id);

        if (error) {
          console.error('[Notification Store] Error clearing notifications from Supabase:', error.message);
        }
      } catch (error) {
        console.error('[Notification Store] Supabase delete failed');
      }
    } catch (error) {
      console.error('[Notification Store] Error clearing notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Helper function to generate sample notifications for new users
function getSampleNotifications(userId: string): Notification[] {
  const now = new Date();
  
  return [
    {
      id: uuidv4(),
      userId,
      type: 'system',
      title: 'Welcome to PropertyMatch',
      message: "Welcome to PropertyMatch! We're excited to help you find your perfect property match.",
      read: false,
      createdAt: now.toISOString(),
    },
    {
      id: uuidv4(),
      userId,
      type: 'property',
      title: 'New Property Matches',
      message: "We've found 5 new properties that match your search criteria. Check them out!",
      read: false,
      data: {
        route: '/(tabs)/discover'
      },
      createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    },
    {
      id: uuidv4(),
      userId,
      type: 'alert',
      title: 'Complete Your Profile',
      message: "Complete your profile to get better property recommendations tailored to your preferences.",
      read: false,
      data: {
        route: '/profile'
      },
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: uuidv4(),
      userId,
      type: 'message',
      title: 'Try Our AI Assistant',
      message: "Have questions about real estate? Our AI assistant is here to help! Start a conversation now.",
      read: true,
      data: {
        route: '/(tabs)/chat'
      },
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
  ];
}
