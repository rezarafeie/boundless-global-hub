import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { messengerService, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';
import { pushNotificationService } from '@/lib/pushNotificationService';

interface NotificationPermissionState {
  granted: boolean;
  permission: NotificationPermission;
  supported: boolean;
  pushSupported: boolean;
  pushSubscribed: boolean;
}

interface NotificationServiceOptions {
  currentUser: MessengerUser | null;
  sessionToken: string | null;
}

export const useNotificationService = ({ currentUser, sessionToken }: NotificationServiceOptions) => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    granted: false,
    permission: 'default',
    supported: typeof window !== 'undefined' && 'Notification' in window,
    pushSupported: pushNotificationService.isSupported(),
    pushSubscribed: false
  });
  
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(true);
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);
  const channelRef = useRef<any>(null);

  // Initialize notification permission state
  useEffect(() => {
    console.log('🔔 useNotificationService - Init with user:', currentUser?.name);
    
    if (!permissionState.supported || !currentUser) {
      console.log('🔔 Notifications not supported or no user');
      return;
    }

    const initializeNotifications = async () => {
      const permission = Notification.permission;
      const granted = permission === 'granted';
      
      console.log('🔔 Current permission:', permission, 'Granted:', granted);
      
      // Check push subscription status
      let pushSubscribed = false;
      if (granted && pushNotificationService.isSupported()) {
        try {
          const { isSubscribed } = await pushNotificationService.getSubscriptionStatus(currentUser.id);
          pushSubscribed = isSubscribed;
          console.log('🔔 Push subscription status:', pushSubscribed);
        } catch (error) {
          console.warn('Error checking push subscription:', error);
        }
      }
      
      setPermissionState({
        granted,
        permission,
        supported: true,
        pushSupported: pushNotificationService.isSupported(),
        pushSubscribed
      });

      // Show banner if permission not granted and not recently dismissed
      updateBannerVisibility(permission);

      // Load user's notification preference from localStorage and Supabase
      loadNotificationPreference();
    };

    initializeNotifications();
  }, [currentUser?.id]);

  // Set up real-time message listener
  useEffect(() => {
    console.log('🔔 Setting up listener - User:', currentUser?.name, 'Session:', !!sessionToken, 'Permission:', permissionState.granted);
    
    if (!currentUser || !sessionToken || !permissionState.granted) {
      console.log('🔔 Skipping listener setup - missing requirements');
      return;
    }

    console.log('🔔 Setting up message listener...');
    setupMessageListener();

    return () => {
      console.log('🔔 Cleaning up message listener');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id, sessionToken, permissionState.granted]);

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
      
      let pushSubscribed = false;
      
      // If permission granted, set up push notifications
      if (granted && currentUser && pushNotificationService.isSupported()) {
        try {
          console.log('🔔 Setting up push notifications...');
          const subscription = await pushNotificationService.subscribe(currentUser.id);
          pushSubscribed = !!subscription;
          console.log('🔔 Push subscription result:', pushSubscribed);
          
          // Update user presence when online
          await supabase.rpc('update_user_presence', { 
            p_user_id: currentUser.id, 
            p_is_online: true 
          });
          
        } catch (error) {
          console.error('Error setting up push notifications:', error);
        }
      }
      
      setPermissionState({
        granted,
        permission,
        supported: true,
        pushSupported: pushNotificationService.isSupported(),
        pushSubscribed
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
      // Update preference in database
      await supabase
        .from('chat_users')
        .update({ notification_enabled: enabled })
        .eq('id', currentUser.id);
        
      // If disabling notifications, unsubscribe from push
      if (!enabled && permissionState.pushSubscribed) {
        try {
          await pushNotificationService.unsubscribe(currentUser.id);
          setPermissionState(prev => ({
            ...prev,
            pushSubscribed: false
          }));
        } catch (error) {
          console.error('Error unsubscribing from push notifications:', error);
        }
      }
      
      // If enabling notifications and permission granted, subscribe to push
      if (enabled && permissionState.granted && !permissionState.pushSubscribed && pushNotificationService.isSupported()) {
        try {
          const subscription = await pushNotificationService.subscribe(currentUser.id);
          setPermissionState(prev => ({
            ...prev,
            pushSubscribed: !!subscription
          }));
        } catch (error) {
          console.error('Error subscribing to push notifications:', error);
        }
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
    }
  };

  const setupMessageListener = () => {
    if (!currentUser || channelRef.current) {
      console.log('🔔 Skipping listener setup - No user or channel already exists');
      return;
    }

    console.log('🔔 Creating Supabase channel for message notifications...');
    
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
          console.log('🔔 New messenger message received:', payload.new);
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
          console.log('🔔 New private message received:', payload.new);
          handleNewPrivateMessage(payload.new as any);
        }
      )
      .subscribe((status) => {
        console.log('🔔 Channel subscription status:', status);
      });
  };

  const handleNewMessage = async (message: MessengerMessage) => {
    console.log('🔔 Processing new message - User:', currentUser?.name, 'Enabled:', notificationEnabled, 'Permission:', permissionState.granted);
    
    if (!currentUser || !notificationEnabled || !permissionState.granted) {
      console.log('🔔 Skipping notification - requirements not met');
      return;
    }
    
    // Don't notify for own messages
    if (message.sender_id === currentUser.id) {
      console.log('🔔 Skipping notification - own message');
      return;
    }

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
          
          console.log('🔔 Showing room notification:', roomName, senderName);
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
    console.log('🔔 Processing new private message - User:', currentUser?.name, 'Enabled:', notificationEnabled, 'Permission:', permissionState.granted);
    
    if (!currentUser || !notificationEnabled || !permissionState.granted) {
      console.log('🔔 Skipping private notification - requirements not met');
      return;
    }
    
    // Don't notify for own messages
    if (message.sender_id === currentUser.id) {
      console.log('🔔 Skipping private notification - own message');
      return;
    }

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
        
        console.log('🔔 Showing private message notification:', senderName);
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