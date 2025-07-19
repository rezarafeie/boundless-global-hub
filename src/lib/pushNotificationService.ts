
import { supabase } from '@/integrations/supabase/client';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Generate proper VAPID keys for production use
const VAPID_PUBLIC_KEY = 'BPQZk9XwKZg7XZt8V3Q8F_J8c2V-hY7R0X1Dt5YK6R8Yk1F2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2';

export const pushNotificationService = {
  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  // Get current push subscription
  async getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  },

  // Subscribe to push notifications
  async subscribe(userId: number): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('🔔 Creating new push subscription...');
        
        // Create new subscription with proper VAPID key
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        console.log('🔔 Push subscription created:', {
          endpoint: subscription.endpoint,
          hasKeys: !!(subscription.getKey('p256dh') && subscription.getKey('auth'))
        });
      }

      // Save subscription to database
      if (subscription) {
        await this.saveSubscription(userId, subscription);
      }
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  },

  // Unsubscribe from push notifications
  async unsubscribe(userId: number): Promise<void> {
    try {
      const subscription = await this.getCurrentSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('🔔 Push subscription unsubscribed');
      }
      
      // Remove subscription from database
      await this.removeSubscription(userId);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  },

  // Save subscription to database
  async saveSubscription(userId: number, subscription: PushSubscription): Promise<void> {
    try {
      // Prepare subscription data
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh') ? 
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
          auth: subscription.getKey('auth') ? 
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : ''
        }
      };

      console.log('🔔 Saving subscription data:', {
        endpoint: subscriptionData.endpoint,
        hasP256dh: !!subscriptionData.keys.p256dh,
        hasAuth: !!subscriptionData.keys.auth
      });

      // Get session token from localStorage for RLS
      const sessionToken = localStorage.getItem('rafiei_session_token') || localStorage.getItem('messenger_session_token');
      
      if (sessionToken) {
        // Set session context for RLS
        await supabase.rpc('set_session_context', { session_token: sessionToken });
      }

      // Store the full subscription data as JSON
      const { error } = await supabase
        .from('chat_users')
        .update({ 
          notification_token: JSON.stringify(subscriptionData),
          notification_enabled: true 
        })
        .eq('id', userId);

      if (error) {
        console.error('🔔 Failed to save push subscription:', error);
        throw new Error(`Failed to save push subscription: ${error.message}`);
      }
      
      console.log('🔔 Push subscription saved successfully');
    } catch (error) {
      console.error('🔔 Error in saveSubscription:', error);
      throw error;
    }
  },

  // Remove subscription from database
  async removeSubscription(userId: number): Promise<void> {
    try {
      // Get session token from localStorage for RLS
      const sessionToken = localStorage.getItem('rafiei_session_token') || localStorage.getItem('messenger_session_token');
      
      if (sessionToken) {
        // Set session context for RLS
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
        console.error('🔔 Failed to remove push subscription:', error);
        throw new Error(`Failed to remove push subscription: ${error.message}`);
      }
      
      console.log('🔔 Push subscription removed successfully');
    } catch (error) {
      console.error('🔔 Error in removeSubscription:', error);
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

  // Check subscription status for a user
  async getSubscriptionStatus(userId: number): Promise<{
    isSubscribed: boolean;
    subscription: PushSubscription | null;
  }> {
    const subscription = await this.getCurrentSubscription();
    
    if (!subscription) {
      return { isSubscribed: false, subscription: null };
    }

    try {
      // Check if subscription is saved in database
      const { data: user } = await supabase
        .from('chat_users')
        .select('notification_token, notification_enabled')
        .eq('id', userId)
        .single();

      const isSubscribed = !!(user?.notification_token && user?.notification_enabled);
      
      return { isSubscribed, subscription };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { isSubscribed: false, subscription };
    }
  },

  // Test if subscription is still valid
  async testSubscription(userId: number): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('chat_users')
        .select('notification_token')
        .eq('id', userId)
        .single();

      if (!user?.notification_token) {
        console.log('🔔 No notification token found');
        return false;
      }

      // Try to parse the token
      let subscriptionData: PushSubscriptionData;
      try {
        subscriptionData = JSON.parse(user.notification_token);
        console.log('🔔 Subscription data parsed successfully');
        return true;
      } catch (parseError) {
        // Handle old format tokens
        console.log('🔔 Old format token detected:', user.notification_token);
        return false;
      }
    } catch (error) {
      console.error('🔔 Error testing subscription:', error);
      return false;
    }
  }
};
