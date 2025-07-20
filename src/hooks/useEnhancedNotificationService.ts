import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { messengerService, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';
import { enhancedPushNotificationService } from '@/lib/enhancedPushNotificationService';
import type { MobileDeviceInfo } from '@/lib/mobilePushDetection';

interface EnhancedNotificationPermissionState {
  oneSignalReady: boolean;
  oneSignalSubscribed: boolean;
  supported: boolean;
  deviceInfo: MobileDeviceInfo;
}

interface EnhancedNotificationServiceOptions {
  currentUser: MessengerUser | null;
  sessionToken: string | null;
}

export const useEnhancedNotificationService = ({ currentUser, sessionToken }: EnhancedNotificationServiceOptions) => {
  console.log('🔔 [Enhanced Hook] useEnhancedNotificationService initialized with user:', currentUser?.id);
  
  const [permissionState, setPermissionState] = useState<EnhancedNotificationPermissionState>({
    oneSignalReady: false,
    oneSignalSubscribed: false,
    supported: false,
    deviceInfo: enhancedPushNotificationService.getDeviceInfo()
  });
  
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(true);
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);
  const channelRef = useRef<any>(null);

  // Initialize notification state
  useEffect(() => {
    console.log('🔔 [Enhanced Hook] Init with user:', currentUser?.name);
    
    const deviceInfo = enhancedPushNotificationService.getDeviceInfo();
    
    if (!deviceInfo.supportsWebPush || !currentUser) {
      console.log('🔔 [Enhanced Hook] Notifications not supported or no user');
      setPermissionState(prev => ({ ...prev, supported: false, deviceInfo }));
      
      // Show banner with limitations info if user exists but web push not supported
      if (currentUser && !deviceInfo.supportsWebPush) {
        updateBannerVisibility(true);
      }
      return;
    }

    const checkSubscriptionStatus = async () => {
      console.log('🔔 [Enhanced Hook] Checking subscription status...');
      
      try {
        const subscriptionStatus = await enhancedPushNotificationService.getSubscriptionStatus(currentUser.id);
        
        console.log('🔔 [Enhanced Hook] Subscription status:', subscriptionStatus);
        
        setPermissionState(prev => ({
          ...prev,
          oneSignalReady: enhancedPushNotificationService['isInitialized'],
          oneSignalSubscribed: subscriptionStatus.hasValidToken,
          supported: true,
          deviceInfo
        }));

        // Show banner if not fully subscribed
        const shouldShowBanner = !subscriptionStatus.hasValidToken;
        updateBannerVisibility(shouldShowBanner);
        
        // Load user's notification preference
        loadNotificationPreference();
      } catch (error) {
        console.warn('🔔 [Enhanced Hook] Error checking subscription status:', error);
        // Show banner on error
        updateBannerVisibility(true);
      }
    };

    checkSubscriptionStatus();
  }, [currentUser?.id]);

  // Set up real-time message listener
  useEffect(() => {
    if (!currentUser || !sessionToken || !permissionState.oneSignalSubscribed) {
      console.log('🔔 [Enhanced Hook] Skipping listener setup - missing requirements');
      return;
    }

    console.log('🔔 [Enhanced Hook] Setting up message listener...');
    setupMessageListener();

    return () => {
      console.log('🔔 [Enhanced Hook] Cleaning up message listener');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id, sessionToken, permissionState.oneSignalSubscribed]);

  const updateBannerVisibility = (shouldShow: boolean) => {
    if (!currentUser) return;

    console.log('🔔 [Enhanced Hook] updateBannerVisibility - Should show:', shouldShow);

    // Check if user has permanently dismissed the banner recently
    const dismissalTime = localStorage.getItem(`enhanced_notification_banner_dismissed_${currentUser.id}`);
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (dismissalTime && (now - parseInt(dismissalTime)) < oneDayInMs && shouldShow) {
      console.log('🔔 [Enhanced Hook] Banner was recently dismissed, not showing');
      setShowPermissionBanner(false);
      return;
    }

    console.log('🔔 [Enhanced Hook] Setting banner visibility to:', shouldShow);
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

  const saveNotificationToken = async (subscriptionId: string): Promise<boolean> => {
    if (!currentUser || !sessionToken) {
      console.warn('🔔 [Enhanced Hook] Cannot save token - no user or session');
      return false;
    }

    try {
      console.log('🔔 [Enhanced Hook] Saving subscription ID to database...');
      
      // Set session context for RLS
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { error } = await supabase
        .from('chat_users')
        .update({ 
          notification_token: subscriptionId,
          notification_enabled: true
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('🔔 [Enhanced Hook] Error saving notification token:', error);
        return false;
      }

      console.log('✅ [Enhanced Hook] Successfully saved subscription ID to database');
      return true;
    } catch (error) {
      console.error('🔔 [Enhanced Hook] Error in saveNotificationToken:', error);
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    console.log('🔔 [Enhanced Hook] Permission request started...');
    
    if (!currentUser) {
      console.warn('🔔 [Enhanced Hook] No current user for permission request');
      return false;
    }

    const deviceInfo = enhancedPushNotificationService.getDeviceInfo();
    
    if (!deviceInfo.supportsWebPush) {
      console.log('🔔 [Enhanced Hook] Web push not supported on this device');
      return false;
    }

    try {
      // Set session context for RLS
      if (sessionToken) {
        await supabase.rpc('set_session_context', { session_token: sessionToken });
      }
      
      // Request permission using enhanced service
      console.log('🔔 [Enhanced Hook] Requesting enhanced subscription...');
      const success = await enhancedPushNotificationService.subscribe(currentUser.id);
      
      console.log('🔔 [Enhanced Hook] Permission request result:', success);
      
      if (success) {
        // Get the subscription ID
        const subscriptionId = await enhancedPushNotificationService.getSubscription();
        console.log('🔔 [Enhanced Hook] Obtained subscription ID:', subscriptionId);
        
        if (subscriptionId) {
          // Save the subscription ID to the database
          const tokenSaved = await saveNotificationToken(subscriptionId);
          console.log('🔔 [Enhanced Hook] Token saved to database:', tokenSaved);
          
          if (tokenSaved) {
            // Update state
            const subscriptionStatus = await enhancedPushNotificationService.getSubscriptionStatus(currentUser.id);
            
            setPermissionState(prev => ({
              ...prev,
              oneSignalReady: true,
              oneSignalSubscribed: subscriptionStatus.hasValidToken
            }));

            // Update banner visibility
            updateBannerVisibility(!subscriptionStatus.hasValidToken);

            // Update notification preference
            await updateNotificationPreference(true);
            
            return true;
          } else {
            console.error('🔔 [Enhanced Hook] Failed to save token to database');
            return false;
          }
        } else {
          console.error('🔔 [Enhanced Hook] No subscription ID obtained');
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('🔔 [Enhanced Hook] Error requesting notification permission:', error);
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
        console.error('🔔 [Enhanced Hook] Error updating notification preference:', error);
        throw error;
      }
      
      console.log('🔔 [Enhanced Hook] Successfully updated notification preference to:', enabled);
    } catch (error) {
      console.error('🔔 [Enhanced Hook] Error updating notification preference:', error);
    }
  };

  const setupMessageListener = () => {
    if (!currentUser || channelRef.current) {
      console.log('🔔 Skipping listener setup - No user or channel already exists');
      return;
    }

    console.log('🔔 Creating Supabase channel for message notifications...');
    
    channelRef.current = supabase
      .channel('enhanced-messenger-notifications')
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
        console.log('🔔 Enhanced channel subscription status:', status);
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
    if (!permissionState.oneSignalReady || !permissionState.oneSignalSubscribed) {
      console.log('🔔 Cannot show notification - not ready or not subscribed');
      return;
    }

    try {
      console.log('🔔 Showing enhanced notification:', title, body);
      const notification = new Notification(title, {
        body: body.length > 100 ? body.substring(0, 100) + '...' : body,
        icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
        tag: `enhanced-chat-${Date.now()}`,
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
      
      console.log('🔔 Enhanced notification displayed successfully');
    } catch (error) {
      console.error('🔔 Error showing enhanced notification:', error);
    }
  };

  const dismissPermissionBanner = () => {
    console.log('🔔 [Enhanced Hook] User dismissed notification banner');
    setShowPermissionBanner(false);
    
    if (currentUser) {
      localStorage.setItem(`enhanced_notification_banner_dismissed_${currentUser.id}`, Date.now().toString());
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
