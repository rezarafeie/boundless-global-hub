
import { supabase } from '@/integrations/supabase/client';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Proper VAPID keys - these should be stored as Supabase secrets in production
const VAPID_PUBLIC_KEY = 'BMqXjGTzRzWgF2AnOXx7xX1YjNzOXyF2kYxM2ZcV3FqXqC8PqYpZsGxKrLmN4OuVwX5Y8ZaRbTcSdEfGhI9JkLmN';

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
      console.error('🔔 Error getting push subscription:', error);
      return null;
    }
  },

  // Subscribe to push notifications with improved error handling
  async subscribe(userId: number): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      console.warn('🔔 Push notifications not supported');
      throw new Error('Push notifications are not supported');
    }

    try {
      console.log('🔔 Starting push subscription for user:', userId);
      
      const registration = await navigator.serviceWorker.ready;
      console.log('🔔 Service worker ready');
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('🔔 Creating new push subscription...');
        
        // Create new subscription with proper VAPID key
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        console.log('🔔 Push subscription created successfully');
      } else {
        console.log('🔔 Using existing push subscription');
      }

      // Save subscription to database with retry logic
      const saveResult = await this.saveSubscriptionWithRetry(userId, subscription);
      
      if (!saveResult.success) {
        console.error('🔔 Failed to save subscription after retries:', saveResult.error);
        throw new Error(`Failed to save push subscription: ${saveResult.error}`);
      }
      
      console.log('🔔 Push subscription setup completed successfully');
      return subscription;
      
    } catch (error) {
      console.error('🔔 Error in push subscription process:', error);
      throw error;
    }
  },

  // Save subscription with retry logic
  async saveSubscriptionWithRetry(userId: number, subscription: PushSubscription, maxRetries: number = 3): Promise<{success: boolean, error?: string}> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔔 Attempt ${attempt}/${maxRetries} to save subscription for user ${userId}`);
        
        await this.saveSubscription(userId, subscription);
        console.log('🔔 Subscription saved successfully');
        return { success: true };
        
      } catch (error) {
        console.error(`🔔 Save attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
  },

  // Enhanced subscription saving with better error handling
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

      console.log('🔔 Saving subscription data for user:', userId, {
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
        console.error('🔔 Database error saving subscription:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.error('🔔 No user found with ID:', userId);
        throw new Error(`User with ID ${userId} not found`);
      }
      
      console.log('🔔 Subscription saved successfully for user:', userId, {
        hasToken: !!data[0].notification_token,
        enabled: data[0].notification_enabled
      });
      
    } catch (error) {
      console.error('🔔 Error in saveSubscription:', error);
      throw error;
    }
  },

  // Unsubscribe from push notifications
  async unsubscribe(userId: number): Promise<void> {
    try {
      console.log('🔔 Unsubscribing user:', userId);
      
      const subscription = await this.getCurrentSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('🔔 Browser subscription unsubscribed');
      }
      
      // Remove subscription from database
      await this.removeSubscription(userId);
      console.log('🔔 Database subscription removed');
      
    } catch (error) {
      console.error('🔔 Error unsubscribing:', error);
      throw error;
    }
  },

  // Remove subscription from database
  async removeSubscription(userId: number): Promise<void> {
    try {
      // Get session token for RLS
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
      
      console.log('🔔 Subscription removed from database');
    } catch (error) {
      console.error('🔔 Error removing subscription:', error);
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

      // Check if subscription is saved in database
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
        console.error('🔔 Error checking subscription status:', error);
        return { isSubscribed: false, subscription, hasValidToken: false, error: error.message };
      }

      const hasValidToken = !!(user?.notification_token && user?.notification_enabled);
      const isSubscribed = hasValidToken;
      
      console.log('🔔 Subscription status for user', userId, {
        hasSubscription: !!subscription,
        hasValidToken,
        isSubscribed,
        enabled: user?.notification_enabled
      });
      
      return { isSubscribed, subscription, hasValidToken };
      
    } catch (error) {
      console.error('🔔 Error in getSubscriptionStatus:', error);
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
        console.log('🔔 No notification token found for user:', userId);
        return false;
      }

      // Try to parse the token
      try {
        const subscriptionData: PushSubscriptionData = JSON.parse(user.notification_token);
        
        // Validate required fields
        if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
          console.log('🔔 Invalid subscription data format, cleaning up');
          await this.removeSubscription(userId);
          return false;
        }
        
        console.log('🔔 Subscription data is valid for user:', userId);
        return true;
        
      } catch (parseError) {
        console.log('🔔 Invalid JSON token format, cleaning up');
        await this.removeSubscription(userId);
        return false;
      }
      
    } catch (error) {
      console.error('🔔 Error testing subscription:', error);
      return false;
    }
  }
};
