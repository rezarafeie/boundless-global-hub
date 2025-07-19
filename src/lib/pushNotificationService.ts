import { supabase } from '@/integrations/supabase/client';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Real VAPID public key from Supabase secrets
const VAPID_PUBLIC_KEY = 'BLIXLspXnGfJZCnXJFk-JM_PfURbW0UkuswePV_4sOOeTg1b8G_PuOs2LqwfH9r8KRaL9jFgSVP4tYTEkpHZIFY';

// Mobile detection utilities
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOSSafari = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isAndroid = () => /Android/i.test(navigator.userAgent);

export const pushNotificationService = {
  // Check if push notifications are supported with mobile considerations
  isSupported(): boolean {
    const basicSupport = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    
    if (!basicSupport) return false;
    
    // Additional mobile checks
    if (isIOSSafari()) {
      // iOS Safari has limited support
      const iosVersion = navigator.userAgent.match(/OS (\d+)_/);
      if (iosVersion && parseInt(iosVersion[1]) < 16) {
        console.warn('🔔 iOS version may have limited push notification support');
      }
    }
    
    return basicSupport;
  },

  // Get current push subscription with mobile error handling
  async getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    
    try {
      // Add timeout for mobile browsers
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 
          isMobile() ? 10000 : 5000)
      );
      
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise
      ]);
      
      if (!registration) return null;
      
      return await registration.pushManager.getSubscription();
      
    } catch (error) {
      console.error('🔔 Error getting push subscription (Mobile: ' + isMobile() + '):', error);
      return null;
    }
  },

  // Subscribe to push notifications with mobile-optimized handling
  async subscribe(userId: number): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      console.warn('🔔 Push notifications not supported on this device');
      throw new Error('Push notifications are not supported');
    }

    try {
      console.log('🔔 Starting push subscription for user:', userId, '(Mobile: ' + isMobile() + ')');
      
      // Wait for service worker with mobile timeout
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration>((_, reject) => 
          setTimeout(() => reject(new Error('Service worker timeout')), 
            isMobile() ? 15000 : 10000)
        )
      ]);
      
      console.log('🔔 Service worker ready for mobile device');
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('🔔 Creating new push subscription for mobile...');
        
        // Mobile-specific subscription options
        const subscribeOptions: PushSubscriptionOptions = {
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        };
        
        // Add delay for mobile browsers to process
        if (isMobile()) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        subscription = await registration.pushManager.subscribe(subscribeOptions);
        console.log('🔔 Push subscription created successfully on mobile');
      } else {
        console.log('🔔 Using existing push subscription on mobile');
      }

      // Save subscription with mobile-optimized retry logic
      const saveResult = await this.saveSubscriptionWithRetry(userId, subscription, isMobile() ? 5 : 3);
      
      if (!saveResult.success) {
        console.error('🔔 Failed to save subscription after retries (Mobile):', saveResult.error);
        throw new Error(`Failed to save push subscription: ${saveResult.error}`);
      }
      
      console.log('🔔 Push subscription setup completed successfully on mobile');
      return subscription;
      
    } catch (error) {
      console.error('🔔 Error in push subscription process (Mobile: ' + isMobile() + '):', error);
      
      // Provide mobile-specific error messages
      if (isIOSSafari()) {
        throw new Error('iOS Safari has limited push notification support. Consider adding to home screen.');
      } else if (isAndroid() && error.message.includes('not allowed')) {
        throw new Error('Android requires site engagement before allowing notifications.');
      }
      
      throw error;
    }
  },

  // Save subscription with mobile-optimized retry logic
  async saveSubscriptionWithRetry(userId: number, subscription: PushSubscription, maxRetries: number = 3): Promise<{success: boolean, error?: string}> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔔 Attempt ${attempt}/${maxRetries} to save subscription for user ${userId} (Mobile: ${isMobile()})`);
        
        await this.saveSubscription(userId, subscription);
        console.log('🔔 Subscription saved successfully on mobile');
        return { success: true };
        
      } catch (error) {
        console.error(`🔔 Save attempt ${attempt} failed (Mobile):`, error);
        
        if (attempt === maxRetries) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
        
        // Longer wait for mobile devices
        const waitTime = Math.pow(2, attempt) * (isMobile() ? 1500 : 1000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
  },

  // Save subscription with retry logic
  async saveSubscription(userId: number, subscription: PushSubscription): Promise<void> {
    try {
      // Validate subscription data
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      if (!p256dhKey || !authKey) {
        throw new Error('Invalid subscription: missing encryption keys');
      }

      // Prepare subscription data
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey)))
        }
      };

      console.log('🔔 Saving subscription data for user (Mobile: ' + isMobile() + '):', userId, {
        endpoint: subscriptionData.endpoint.substring(0, 50) + '...',
        hasP256dh: !!subscriptionData.keys.p256dh,
        hasAuth: !!subscriptionData.keys.auth
      });

      // Get session token for RLS
      const sessionToken = localStorage.getItem('rafiei_session_token') || localStorage.getItem('messenger_session_token');
      
      if (!sessionToken) {
        console.warn('🔔 No session token found, proceeding without RLS context');
      } else {
        console.log('🔔 Setting session context with token:', sessionToken.substring(0, 8) + '...');
        // Set session context for RLS
        const { error: contextError } = await supabase.rpc('set_session_context', { session_token: sessionToken });
        if (contextError) {
          console.warn('🔔 Failed to set session context:', contextError);
        }
      }

      // Store the subscription data as JSON
      const { data, error } = await supabase
        .from('chat_users')
        .update({ 
          notification_token: JSON.stringify(subscriptionData),
          notification_enabled: true 
        })
        .eq('id', userId)
        .select('id, notification_token, notification_enabled');

      if (error) {
        console.error('🔔 Database error saving subscription (Mobile):', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.error('🔔 No user found with ID:', userId);
        throw new Error(`User with ID ${userId} not found`);
      }
      
      console.log('🔔 Subscription saved successfully for user on mobile:', userId, {
        hasToken: !!data[0].notification_token,
        enabled: data[0].notification_enabled
      });
      
    } catch (error) {
      console.error('🔔 Error in saveSubscription (Mobile):', error);
      throw error;
    }
  },

  // Unsubscribe from push notifications
  async unsubscribe(userId: number): Promise<void> {
    try {
      console.log('🔔 Unsubscribing user (Mobile: ' + isMobile() + '):', userId);
      
      const subscription = await this.getCurrentSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('🔔 Browser subscription unsubscribed on mobile');
      }
      
      await this.removeSubscription(userId);
      console.log('🔔 Database subscription removed on mobile');
      
    } catch (error) {
      console.error('🔔 Error unsubscribing (Mobile):', error);
      throw error;
    }
  },

  // Remove subscription from database
  async removeSubscription(userId: number): Promise<void> {
    try {
      const sessionToken = localStorage.getItem('rafiei_session_token') || localStorage.getItem('messenger_session_token');
      
      if (sessionToken) {
        await supabase.rpc('set_session_context', { session_token: sessionToken });
      }

      const { error } = await supabase
        .from('chat_users')
        .update({ 
          notification_token: null,
          notification_enabled: false 
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to remove subscription: ${error.message}`);
      }
      
      console.log('🔔 Subscription removed from database (Mobile)');
    } catch (error) {
      console.error('🔔 Error removing subscription (Mobile):', error);
      throw error;
    }
  },

  // Convert VAPID key
  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  // Enhanced subscription status check
  async getSubscriptionStatus(userId: number): Promise<{
    isSubscribed: boolean;
    subscription: PushSubscription | null;
    hasValidToken: boolean;
    error?: string;
  }> {
    try {
      const subscription = await this.getCurrentSubscription();
      
      if (!subscription) {
        return { isSubscribed: false, subscription: null, hasValidToken: false };
      }

      const sessionToken = localStorage.getItem('rafiei_session_token') || localStorage.getItem('messenger_session_token');
      
      if (sessionToken) {
        await supabase.rpc('set_session_context', { session_token: sessionToken });
      }

      const { data: user, error } = await supabase
        .from('chat_users')
        .select('notification_token, notification_enabled')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('🔔 Error checking subscription status (Mobile):', error);
        return { isSubscribed: false, subscription, hasValidToken: false, error: error.message };
      }

      const hasValidToken = !!(user?.notification_token && user?.notification_enabled);
      const isSubscribed = hasValidToken;
      
      console.log('🔔 Subscription status for user on mobile', userId, {
        hasSubscription: !!subscription,
        hasValidToken,
        isSubscribed,
        enabled: user?.notification_enabled
      });
      
      return { isSubscribed, subscription, hasValidToken };
      
    } catch (error) {
      console.error('🔔 Error in getSubscriptionStatus (Mobile):', error);
      return { 
        isSubscribed: false, 
        subscription: null, 
        hasValidToken: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Test subscription validity and clean up invalid ones
  async testAndCleanupSubscription(userId: number): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('chat_users')
        .select('notification_token')
        .eq('id', userId)
        .single();

      if (!user?.notification_token) {
        console.log('🔔 No notification token found for user (Mobile):', userId);
        return false;
      }

      try {
        const subscriptionData: PushSubscriptionData = JSON.parse(user.notification_token);
        
        if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
          console.log('🔔 Invalid subscription data format on mobile, cleaning up');
          await this.removeSubscription(userId);
          return false;
        }
        
        console.log('🔔 Subscription data is valid for user on mobile:', userId);
        return true;
        
      } catch (parseError) {
        console.log('🔔 Invalid JSON token format on mobile, cleaning up');
        await this.removeSubscription(userId);
        return false;
      }
      
    } catch (error) {
      console.error('🔔 Error testing subscription (Mobile):', error);
      return false;
    }
  }
};
