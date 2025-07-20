// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { messengerService, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';
import { pushNotificationService } from '@/lib/pushNotificationService';

interface NotificationPermissionState {
  oneSignalReady: boolean;
  oneSignalSubscribed: boolean;
  supported: boolean;
}

interface NotificationServiceOptions {
  currentUser: MessengerUser | null;
  sessionToken: string | null;
}

export const useNotificationService = ({ currentUser, sessionToken }: NotificationServiceOptions) => {
  console.log('🔔 [Android] useNotificationService initialized with user:', currentUser?.id, 'sessionToken:', !!sessionToken);
  
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    oneSignalReady: false,
    oneSignalSubscribed: false,
    supported: pushNotificationService.isSupported()
  });
  
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(true);
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);
  const channelRef = useRef<any>(null);

  // Initialize notification state
  useEffect(() => {
    console.log('🔔 [Android] useNotificationService - Init with user:', currentUser?.name);
    
    if (!permissionState.supported || !currentUser) {
      console.log('🔔 [Android] Notifications not supported or no user');
      return;
    }

    const checkSubscriptionStatus = async () => {
      console.log('🔔 [Android] Checking OneSignal subscription status...');
      
      try {
        const subscriptionStatus = await pushNotificationService.getSubscriptionStatus(currentUser.id);
        
        console.log('🔔 [Android] OneSignal status:', subscriptionStatus);
        
        setPermissionState(prev => ({
          ...prev,
          oneSignalReady: pushNotificationService.isInitialized,
          oneSignalSubscribed: subscriptionStatus.hasValidToken
        }));

        // Show banner if not fully subscribed
        const shouldShowBanner = !subscriptionStatus.hasValidToken;
        updateBannerVisibility(shouldShowBanner);
        
        // Load user's notification preference
        loadNotificationPreference();
      } catch (error) {
        console.warn('🔔 [Android] Error checking subscription status:', error);
        // Show banner on error
        updateBannerVisibility(true);
      }
    };

    checkSubscriptionStatus();
  }, [currentUser?.id]);

  // Set up real-time message listener
  useEffect(() => {
    if (!currentUser || !sessionToken || !permissionState.oneSignalSubscribed) {
      console.log('🔔 [Android] Skipping listener setup - missing requirements');
      return;
    }

    console.log('🔔 [Android] Setting up message listener...');
    setupMessageListener();

    return () => {
      console.log('🔔 [Android] Cleaning up message listener');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id, sessionToken, permissionState.oneSignalSubscribed]);

  const updateBannerVisibility = (shouldShow: boolean) => {
    if (!currentUser) return;

    console.log('🔔 [Android] updateBannerVisibility - Should show:', shouldShow);

    // Check if user has permanently dismissed the banner recently
    const dismissalTime = localStorage.getItem(`notification_banner_dismissed_${currentUser.id}`);
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (dismissalTime && (now - parseInt(dismissalTime)) < oneDayInMs && shouldShow) {
      console.log('🔔 [Android] Banner was recently dismissed, not showing');
      setShowPermissionBanner(false);
      return;
    }

    console.log('🔔 [Android] Setting banner visibility to:', shouldShow);
    setShowPermissionBanner(shouldShow);
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
    console.log('🔔 [Android] Banner activate button clicked - Starting permission request...');
    
    if (!permissionState.supported) {
      console.warn('🔔 [Android] Notifications not supported in this browser');
      return false;
    }

    if (!currentUser) {
      console.warn('🔔 [Android] No current user for permission request');
      return false;
    }

    try {
      // Set session context for RLS
      if (sessionToken) {
        await supabase.rpc('set_session_context', { session_token: sessionToken });
      }
      
      // Request OneSignal permission (this will initialize if needed)
      console.log('🔔 [Android] Requesting OneSignal subscription...');
      const success = await pushNotificationService.subscribe(currentUser.id);
      
      console.log('🔔 [Android] Permission request result:', success);
      
      if (success) {
        // Update state
        const subscriptionStatus = await pushNotificationService.getSubscriptionStatus(currentUser.id);
        
        setPermissionState(prev => ({
          ...prev,
          oneSignalReady: true,
          oneSignalSubscribed: subscriptionStatus.hasValidToken
        }));

        // Update banner visibility
        updateBannerVisibility(!subscriptionStatus.hasValidToken);

        // Update notification preference
        await updateNotificationPreference(true);
        
        // Update user presence
        try {
          await supabase.rpc('update_user_presence', { 
            p_user_id: currentUser.id, 
            p_is_online: true 
          });
        } catch (error) {
          console.warn('🔔 [Android] Could not update user presence:', error);
        }
      }

      return success;
    } catch (error) {
      console.error('🔔 [Android] Error requesting notification permission:', error);
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
        console.error('🔔 [Android] Error updating notification preference:', error);
        throw error;
      }
      
      console.log('🔔 [Android] Successfully updated notification preference to:', enabled);
    } catch (error) {
      console.error('🔔 [Android] Error updating notification preference:', error);
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
    if (!currentUser || !notificationEnabled || !permissionState.oneSignalSubscribed) {
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
    if (!currentUser || !notificationEnabled || !permissionState.oneSignalSubscribed) {
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
    if (!permissionState.oneSignalReady) {
      console.log('🔔 Cannot show notification - OneSignal not ready');
      return;
    }

    if (!permissionState.oneSignalSubscribed) {
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
    console.log('🔔 [Android] User dismissed notification banner');
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
