
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/lib/notificationService';
import type { Notification } from '@/types/notifications';

interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchNotifications = async () => {
      try {
        setError(null);
        const data = await notificationService.getAll();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Single real-time subscription for the entire app
    const channel = supabase
      .channel('notifications_master_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new as Notification, ...prev]);
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => prev.map(n => 
                n.id === payload.new.id ? payload.new as Notification : n
              ));
            }
          } catch (error) {
            console.error('Error handling real-time notification update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, loading, error }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to consume all notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Hook to consume only active notifications
export const useActiveNotifications = () => {
  const { notifications, loading, error } = useNotifications();
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!loading && !error) {
      const now = new Date().toISOString();
      const filtered = notifications.filter(notification => {
        if (!notification.is_active) return false;
        
        // Check start date
        if (notification.start_date && notification.start_date > now) return false;
        
        // Check end date
        if (notification.end_date && notification.end_date < now) return false;
        
        return true;
      });
      
      setActiveNotifications(filtered);
    }
  }, [notifications, loading, error]);

  return { 
    notifications: activeNotifications, 
    loading, 
    error 
  };
};
