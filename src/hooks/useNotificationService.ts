// @ts-nocheck
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
      console.log('🔔 Initializing notification service...');
      
      // Check OneSignal subscription status instead of browser permission
      let pushSubscribed = false;
      let granted = false;
      
      if (pushNotificationService.isSupported()) {
        try {
          const subscriptionStatus = await pushNotificationService.getSubscriptionStatus(currentUser.id);
          pushSubscribed = subscriptionStatus.hasValidToken;
          granted = subscriptionStatus.isSubscribed;
          
          console.log('🔔 OneSignal status:', {
            subscribed: pushSubscribed,
            granted: granted
          });
        } catch (error) {
          console.warn('🔔 Error checking OneSignal subscription:', error);
        }
      }
      
      const browserPermission = Notification.permission;
      console.log('🔔 Browser permission:', browserPermission);
      
      setPermissionState({
        granted: granted && browserPermission === 'granted',
        permission: browserPermission,
        supported: true,
        pushSupported: pushNotificationService.isSupported(),
        pushSubscribed
      });

      // Show banner if not properly subscribed
      updateBannerVisibility(granted, pushSubscribed);
      
      // Load user's notification preference
      loadNotificationPreference();
    };

    initializeNotifications();
  }, [currentUser?.id]);

  // Set up real-time message listener
  useEffect(() => {
    if (!currentUser || !sessionToken || !permissionState.granted || !permissionState.pushSubscribed) {
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
  }, [currentUser?.id, sessionToken, permissionState.granted, permissionState.pushSubscribed]);

  const updateBannerVisibility = (hasPermission: boolean, hasValidSubscription: boolean) => {
    if (!currentUser) return;

    console.log('🔔 updateBannerVisibility - Permission:', hasPermission, 'Valid subscription:', hasValidSubscription);

    // Show banner if either permission is missing OR subscription is invalid
    const shouldShowBanner = !hasPermission || !hasValidSubscription;
    
    // Check if user has permanently dismissed the banner
    const dismissalTime = localStorage.getItem(`notification_banner_dismissed_${currentUser.id}`);
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (dismissalTime && (now - parseInt(dismissalTime)) < oneDayInMs && shouldShowBanner) {
      console.log('🔔 Banner was recently dismissed, not showing');
      setShowPermissionBanner(false);
      return;
    }

    console.log('🔔 Setting banner visibility to:', shouldShowBanner);
    setShowPermissionBanner(shouldShowBanner);
    
    // If fully subscribed, mark as permanently handled
    if (hasPermission && hasValidSubscription) {
      localStorage.setItem(`notification_banner_hidden_${currentUser.id}`, 'true');
    } else {
      localStorage.removeItem(`notification_banner_hidden_${currentUser.id}`);
    }
  };

  const loadNotificationPreference = async () => {
    if (!currentUser) return;

    // First check localStorage
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

    if (!currentUser) {
      console.warn('🔔 No current user for permission request');
      return false;
    }

    try {
      console.log('🔔 Starting permission request process...');
      
      // Set session context for RLS
      if (sessionToken) {
        await supabase.rpc('set_session_context', { session_token: sessionToken });
      }
      
      // Request OneSignal permission
      const success = await pushNotificationService.subscribe(currentUser.id);
      
      console.log('🔔 Permission request result:', success);
      
      if (success) {
        // Update state
        const subscriptionStatus = await pushNotificationService.getSubscriptionStatus(currentUser.id);
        
        setPermissionState(prev => ({
          ...prev,
          granted: true,
          permission: 'granted',
          pushSubscribed: subscriptionStatus.hasValidToken
        }));

        // Update banner visibility
        updateBannerVisibility(true, subscriptionStatus.hasValidToken);

        // Update notification preference
        await updateNotificationPreference(true);
        
        // Update user presence
        try {
          await supabase.rpc('update_user_presence', { 
            p_user_id: currentUser.id, 
            p_is_online: true 
          });
        } catch (error) {
          console.warn('🔔 Could not update user presence:', error);
        }
      }

      return success;
    } catch (error) {
      console.error('🔔 Error requesting notification permission:', error);
      return false;
    }
  };

  const updateNotificationPreference = async (enabled: boolean): Promise<void> => {
    if (!currentUser || !sessionToken) return;

    setNotificationEnabled(enabled);
    localStorage.setItem(`notification_enabled_${currentUser.id}`, enabled.toString());

    try {
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { error } = await supabase
        .from('chat_users')
        .update({ notification_enabled: enabled })
        .eq('id', currentUser.id);
        
      if (error) {
        console.error('🔔 Error updating notification preference:', error);
        throw error;
      }
      
      console.log('🔔 Successfully updated notification preference to:', enabled);
        
      if (!enabled && permissionState.pushSubscribed) {
        try {
          await pushNotificationService.unsubscribe();
          setPermissionState(prev => ({ ...prev, pushSubscribed: false }));
          updateBannerVisibility(false, false);
        } catch (error) {
          console.error('🔔 Error unsubscribing from push notifications:', error);
        }
      }
    } catch (error) {
      console.error('🔔 Error updating notification preference:', error);
    }
  };

  const setupMessageListener = () => {
    if (!currentUser || channelRef.current) {
      console.log('🔔 Skipping listener setup - No user or channel already exists');
      return;
    }

    console.log('🔔 Creating Supabase channel for message notifications...');
    
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
    if (!currentUser || !notificationEnabled || !permissionState.granted || !permissionState.pushSubscribed) {
      console.log('🔔 Skipping notification - requirements not met');
      return;
    }
    
    if (message.sender_id === currentUser.id) {
      console.log('🔔 Skipping notification - own message');
      return;
    }

    try {
      if (message.room_id) {
        const rooms = await messengerService.getRooms(sessionToken!);
        const hasAccess = rooms.some(room => room.id === message.room_id);
        
        if (hasAccess) {
          const sender = await messengerService.getUserById(message.sender_id!);
          const senderName = sender?.name || 'کاربر ناشناس';
          
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
      console.error('🔔 Error handling new message notification:', error);
    }
  };

  const handleNewPrivateMessage = async (message: any) => {
    if (!currentUser || !notificationEnabled || !permissionState.granted || !permissionState.pushSubscribed) {
      console.log('🔔 Skipping private notification - requirements not met');
      return;
    }
    
    if (message.sender_id === currentUser.id) {
      console.log('🔔 Skipping private notification - own message');
      return;
    }

    try {
      const { data: conversation } = await supabase
        .from('private_conversations')
        .select('user1_id, user2_id')
        .eq('id', message.conversation_id)
        .single();

      if (conversation && 
          (conversation.user1_id === currentUser.id || conversation.user2_id === currentUser.id)) {
        
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
      console.error('🔔 Error handling new private message notification:', error);
    }
  };

  const showNotification = (title: string, body: string, url?: string) => {
    if (!permissionState.granted) {
      console.log('🔔 Cannot show notification - permission not granted');
      return;
    }

    try {
      console.log('🔔 Showing notification:', title, body);
      const notification = new Notification(title, {
        body: body.length > 100 ? body.substring(0, 100) + '...' : body,
        icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
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

      setTimeout(() => {
        notification.close();
      }, 8000);
      
      console.log('🔔 Notification displayed successfully');
    } catch (error) {
      console.error('🔔 Error showing notification:', error);
    }
  };

  const dismissPermissionBanner = () => {
    console.log('🔔 User dismissed notification banner');
    setShowPermissionBanner(false);
    
    if (currentUser) {
      localStorage.setItem(`notification_banner_dismissed_${currentUser.id}`, Date.now().toString());
    }
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
