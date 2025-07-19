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
      const permission = Notification.permission;
      const granted = permission === 'granted';
      
      console.log('🔔 Current permission:', permission, 'Granted:', granted);
      
      // Check push subscription status
      let pushSubscribed = false;
      if (granted && pushNotificationService.isSupported()) {
        try {
          const subscriptionId = await pushNotificationService.getSubscription();
          const hasValidSubscription = subscriptionId ? await pushNotificationService.isSubscriptionValid() : false;
          pushSubscribed = hasValidSubscription;
          console.log('🔔 Push subscription status:', {
            subscriptionId,
            hasValidSubscription
          });
        } catch (error) {
          console.warn('🔔 Error checking push subscription:', error);
        }
      }
      
      setPermissionState({
        granted,
        permission,
        supported: true,
        pushSupported: pushNotificationService.isSupported(),
        pushSubscribed
      });

      // Update banner visibility
      updateBannerVisibility(permission, granted && pushSubscribed);

      // Load user's notification preference
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

  const updateBannerVisibility = (permission: NotificationPermission, hasValidSubscription: boolean = false) => {
    if (!currentUser) return;

    console.log('🔔 updateBannerVisibility - Permission:', permission, 'Valid subscription:', hasValidSubscription);

    // Check if user has dismissed the banner temporarily
    const dismissalTime = localStorage.getItem(`notification_banner_dismissed_${currentUser.id}`);
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (dismissalTime && (now - parseInt(dismissalTime)) < oneDayInMs) {
      console.log('🔔 Banner was recently dismissed, not showing');
      setShowPermissionBanner(false);
      return;
    }

    // Check if user has permanently hidden the banner
    const permanentlyHidden = localStorage.getItem(`notification_banner_hidden_${currentUser.id}`);
    if (permanentlyHidden === 'true' && permission === 'granted' && hasValidSubscription) {
      console.log('🔔 Banner permanently hidden - permission granted and subscription valid');
      setShowPermissionBanner(false);
      return;
    }

    // Show banner if permission is not granted or subscription is invalid
    if (permission === 'granted' && hasValidSubscription) {
      console.log('🔔 Hiding banner - permission granted and subscription valid');
      setShowPermissionBanner(false);
      localStorage.setItem(`notification_banner_hidden_${currentUser.id}`, 'true');
    } else {
      console.log('🔔 Showing banner - permission not granted or subscription invalid');
      setShowPermissionBanner(true);
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

    try {
      console.log('🔔 Requesting notification permission...');
      const granted = await pushNotificationService.requestPermission();
      
      console.log('🔔 Permission result:', granted);
      
      let pushSubscribed = false;
      
      if (granted && currentUser && sessionToken) {
        try {
          console.log('🔔 Setting up push notifications...');
          
          // Set session context for RLS
          await supabase.rpc('set_session_context', { session_token: sessionToken });
          
          // Set up push subscription
          const subscriptionId = await pushNotificationService.getSubscription();
          if (subscriptionId) {
            await pushNotificationService.saveSubscriptionToDatabase(currentUser.id, subscriptionId);
            pushSubscribed = true;
            console.log('🔔 Push subscription result:', pushSubscribed);
          }
          
          // Update user presence
          await supabase.rpc('update_user_presence', { 
            p_user_id: currentUser.id, 
            p_is_online: true 
          });
          
        } catch (error) {
          console.error('🔔 Error setting up push notifications:', error);
        }
      }
      
      setPermissionState({
        granted,
        permission: granted ? 'granted' : 'denied',
        supported: true,
        pushSupported: pushNotificationService.isSupported(),
        pushSubscribed
      });

      updateBannerVisibility(granted ? 'granted' : 'denied', pushSubscribed);

      if (granted) {
        await updateNotificationPreference(true);
        if (pushSubscribed && currentUser) {
          localStorage.setItem(`notification_banner_hidden_${currentUser.id}`, 'true');
        }
      }

      return granted;
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
          localStorage.removeItem(`notification_banner_hidden_${currentUser.id}`);
          setShowPermissionBanner(true);
        } catch (error) {
          console.error('🔔 Error unsubscribing from push notifications:', error);
        }
      }
      
      if (enabled && permissionState.granted && !permissionState.pushSubscribed && pushNotificationService.isSupported()) {
        try {
          const success = await pushNotificationService.requestPermission();
          if (success) {
            const subscriptionId = await pushNotificationService.getSubscription();
            if (subscriptionId) {
              await pushNotificationService.saveSubscriptionToDatabase(currentUser.id, subscriptionId);
              setPermissionState(prev => ({ ...prev, pushSubscribed: true }));
              updateBannerVisibility(permissionState.permission, true);
            }
          }
        } catch (error) {
          console.error('🔔 Error subscribing to push notifications:', error);
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
    console.log('🔔 Processing new message - User:', currentUser?.name, 'Enabled:', notificationEnabled, 'Permission:', permissionState.granted);
    
    if (!currentUser || !notificationEnabled || !permissionState.granted) {
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
    console.log('🔔 Processing new private message - User:', currentUser?.name, 'Enabled:', notificationEnabled, 'Permission:', permissionState.granted);
    
    if (!currentUser || !notificationEnabled || !permissionState.granted) {
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