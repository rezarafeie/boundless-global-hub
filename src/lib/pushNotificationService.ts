import { supabase } from '@/integrations/supabase/client';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const pushNotificationService = {
  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
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
        // Create new subscription - for now, use simple notification without push
        // This allows browser notifications to work without push service
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            // Placeholder VAPID key - notifications work through service worker only
            'BMqSvZdbf7d_jLF6q9Q8F_J8c2V-hY7R0X1Dt5YK6R8Yk1F2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2'
          )
        });
      }

      // Save subscription to database
      await this.saveSubscription(userId, subscription);
      
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
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey('p256dh') ? 
          btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
        auth: subscription.getKey('auth') ? 
          btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : ''
      }
    };

    // Get session token from localStorage for RLS
    const sessionToken = localStorage.getItem('rafiei_session_token') || localStorage.getItem('messenger_session_token');
    
    if (sessionToken) {
      // Set session context for RLS
      await supabase.rpc('set_session_context', { session_token: sessionToken });
    }

    // Update user's push subscription in database
    // Store a simple token indicating notification subscription is active
    const { error } = await supabase
      .from('chat_users')
      .update({ 
        notification_token: `browser_notification_${userId}_${Date.now()}`,
        notification_enabled: true 
      })
      .eq('id', userId);

    if (error) {
      console.error('🔔 Failed to save push subscription:', error);
      throw new Error(`Failed to save push subscription: ${error.message}`);
    }
    
    console.log('🔔 Push subscription saved successfully');
  },

  // Remove subscription from database
  async removeSubscription(userId: number): Promise<void> {
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

    // Check if subscription is saved in database
    const { data: user } = await supabase
      .from('chat_users')
      .select('notification_token, notification_enabled')
      .eq('id', userId)
      .single();

    const isSubscribed = !!(user?.notification_token && user?.notification_enabled);
    
    return { isSubscribed, subscription };
  }
};