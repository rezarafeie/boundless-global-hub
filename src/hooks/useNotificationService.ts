import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { messengerService, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';

interface NotificationPermissionState {
  granted: boolean;
  permission: NotificationPermission;
  supported: boolean;
}

interface NotificationServiceOptions {
  currentUser: MessengerUser | null;
  sessionToken: string | null;
}

export const useNotificationService = ({ currentUser, sessionToken }: NotificationServiceOptions) => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    granted: false,
    permission: 'default',
    supported: typeof window !== 'undefined' && 'Notification' in window
  });
  
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);
  const channelRef = useRef<any>(null);

  // Initialize notification permission state
  useEffect(() => {
    console.log('🔔 useNotificationService - Init with user:', currentUser?.name);
    
    if (!permissionState.supported || !currentUser) {
      console.log('🔔 Notifications not supported or no user');
      return;
    }

    const permission = Notification.permission;
    const granted = permission === 'granted';
    
    console.log('🔔 Current permission:', permission, 'Granted:', granted);
    
    setPermissionState({
      granted,
      permission,
      supported: true
    });

    // Show banner if permission not granted and not recently dismissed
    updateBannerVisibility(permission);

    // Load user's notification preference from localStorage and Supabase
    loadNotificationPreference();
  }, [currentUser?.id]);

  // Set up real-time message listener
  useEffect(() => {
    if (!currentUser || !sessionToken || !notificationEnabled || !permissionState.granted) {
      return;
    }

    setupMessageListener();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUser?.id, sessionToken, notificationEnabled, permissionState.granted]);

  const updateBannerVisibility = (permission: NotificationPermission) => {
    if (!currentUser) return;

    console.log('🔔 updateBannerVisibility - Permission:', permission, 'Current user:', currentUser.name);

    // FORCE SHOW banner for ALL users when permission is not granted
    // Only hide when permission is explicitly granted
    if (permission === 'granted') {
      console.log('🔔 Hiding banner - permission granted');
      setShowPermissionBanner(false);
    } else {
      // Force show for all users when permission is NOT granted
      console.log('🔔 Showing banner - permission not granted');
      setShowPermissionBanner(true);
    }
  };

  const loadNotificationPreference = async () => {
    if (!currentUser) return;

    // First check localStorage for quick access
    const localPref = localStorage.getItem(`notification_enabled_${currentUser.id}`);
    if (localPref !== null) {
      const enabled = localPref === 'true';
      setNotificationEnabled(enabled);
    }

    // Then sync with Supabase
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('notification_enabled')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        const enabled = data.notification_enabled ?? true;
        setNotificationEnabled(enabled);
        localStorage.setItem(`notification_enabled_${currentUser.id}`, enabled.toString());
      }
    } catch (error) {
      console.warn('Could not load notification preference:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!permissionState.supported) {
      console.warn('🔔 Notifications not supported in this browser');
      return false;
    }

    try {
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      console.log('🔔 Permission result:', permission, 'Granted:', granted);
      
      setPermissionState({
        granted,
        permission,
        supported: true
      });

      // Update banner visibility based on new permission
      updateBannerVisibility(permission);

      if (granted) {
        await updateNotificationPreference(true);
        setShowPermissionBanner(false);
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const updateNotificationPreference = async (enabled: boolean): Promise<void> => {
    if (!currentUser) return;

    setNotificationEnabled(enabled);
    localStorage.setItem(`notification_enabled_${currentUser.id}`, enabled.toString());

    try {
      await supabase
        .from('chat_users')
        .update({ notification_enabled: enabled })
        .eq('id', currentUser.id);
    } catch (error) {
      console.error('Error updating notification preference:', error);
    }
  };

  const setupMessageListener = () => {
    if (!currentUser || channelRef.current) return;

    // Listen to all messenger messages
    channelRef.current = supabase
      .channel('messenger-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messenger_messages'
        },
        (payload) => {
          handleNewMessage(payload.new as MessengerMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages'
        },
        (payload) => {
          handleNewPrivateMessage(payload.new as any);
        }
      )
      .subscribe();
  };

  const handleNewMessage = async (message: MessengerMessage) => {
    if (!currentUser || !notificationEnabled || !permissionState.granted) return;
    
    // Don't notify for own messages
    if (message.sender_id === currentUser.id) return;

    try {
      // Check if user has access to this room
      if (message.room_id) {
        const rooms = await messengerService.getRooms(sessionToken!);
        const hasAccess = rooms.some(room => room.id === message.room_id);
        
        if (hasAccess) {
          // Get sender info
          const sender = await messengerService.getUserById(message.sender_id!);
          const senderName = sender?.name || 'کاربر ناشناس';
          
          // Get room info
          const room = await messengerService.getRoomById(message.room_id);
          const roomName = room?.name || 'گروه';
          
          showNotification(
            `پیام جدید در ${roomName}`,
            `${senderName}: ${message.message}`,
            `/hub/messenger?room=${message.room_id}`
          );
        }
      }
    } catch (error) {
      console.error('Error handling new message notification:', error);
    }
  };

  const handleNewPrivateMessage = async (message: any) => {
    if (!currentUser || !notificationEnabled || !permissionState.granted) return;
    
    // Don't notify for own messages
    if (message.sender_id === currentUser.id) return;

    try {
      // Check if this message is in a conversation involving current user
      const { data: conversation } = await supabase
        .from('private_conversations')
        .select('user1_id, user2_id')
        .eq('id', message.conversation_id)
        .single();

      if (conversation && 
          (conversation.user1_id === currentUser.id || conversation.user2_id === currentUser.id)) {
        
        // Get sender info
        const sender = await messengerService.getUserById(message.sender_id);
        const senderName = sender?.name || 'کاربر ناشناس';
        
        showNotification(
          `پیام خصوصی جدید از ${senderName}`,
          message.message,
          `/hub/messenger?user=${message.sender_id}`
        );
      }
    } catch (error) {
      console.error('Error handling new private message notification:', error);
    }
  };

  const showNotification = (title: string, body: string, url?: string) => {
    if (!permissionState.granted) return;

    try {
      const notification = new Notification(title, {
        body: body.length > 100 ? body.substring(0, 100) + '...' : body,
        icon: '/favicon.ico',
        tag: `chat-${Date.now()}`,
        requireInteraction: false,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        if (url) {
          window.location.href = url;
        }
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const dismissPermissionBanner = () => {
    console.log('🔔 User attempted to dismiss banner, requesting permission instead...');
    // Force users to interact with permission - don't allow dismissal
    // Only hide when they grant or deny permission
    requestNotificationPermission();
  };

  return {
    permissionState,
    notificationEnabled,
    showPermissionBanner,
    requestNotificationPermission,
    updateNotificationPreference,
    dismissPermissionBanner
  };
};