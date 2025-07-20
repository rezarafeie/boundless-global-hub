
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

export const pushNotificationService = {
  async initOneSignal(): Promise<void> {
    console.log('🔔 Initializing OneSignal...');
    return new Promise((resolve, reject) => {
      if (window.OneSignal) {
        console.log('🔔 OneSignal already loaded');
        resolve();
        return;
      }
      
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error('🔔 OneSignal initialization timeout');
        reject(new Error('OneSignal initialization timeout'));
      }, 10000);
      
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          console.log('🔔 OneSignal SDK loaded, initializing...');
          await OneSignal.init({
            appId: "e221c080-7853-46e5-ba40-93796318d1a0",
            allowLocalhostAsSecureOrigin: true,
          });
          console.log('🔔 OneSignal initialized successfully');
          clearTimeout(timeout);
          resolve();
        } catch (error) {
          console.error('🔔 OneSignal initialization error:', error);
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  },

  async requestPermission(): Promise<boolean> {
    try {
      console.log('🔔 Starting permission request...');
      await this.initOneSignal();
      
      if (!window.OneSignal) {
        console.error('🔔 OneSignal not loaded');
        return false;
      }

      // Check current subscription status
      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 Current subscription status:', isSubscribed);
      
      if (isSubscribed) {
        console.log('✅ User already subscribed to OneSignal');
        return true;
      }

      // Force permission request using OneSignal's native prompt
      console.log('🔔 Requesting OneSignal permission...');
      await window.OneSignal.User.PushSubscription.optIn();
      
      // Wait a moment for subscription to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSubscriptionState = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 New subscription state:', newSubscriptionState);
      
      if (newSubscriptionState) {
        console.log('✅ OneSignal permission granted and subscribed');
        return true;
      } else {
        console.log('❌ OneSignal permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting OneSignal permission:', error);
      return false;
    }
  },

  async getSubscription(): Promise<string | null> {
    try {
      await this.initOneSignal();
      
      if (!window.OneSignal) {
        console.log('🔔 OneSignal not available for subscription check');
        return null;
      }

      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 Subscription check - opted in:', isSubscribed);
      
      if (isSubscribed) {
        const subscriptionId = await window.OneSignal.User.PushSubscription.id;
        console.log('🔔 OneSignal subscription ID:', subscriptionId ? 'found' : 'null');
        return subscriptionId;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting OneSignal subscription:', error);
      return null;
    }
  },

  async saveSubscriptionToDatabase(userId: number, subscriptionId: string): Promise<void> {
    try {
      console.log('🔔 Saving subscription to database for user:', userId);
      const { error } = await supabase
        .from('chat_users')
        .update({ 
          notification_token: subscriptionId
        })
        .eq('id', userId);

      if (error) throw error;
      console.log('✅ OneSignal subscription saved to database');
    } catch (error) {
      console.error('❌ Error saving OneSignal subscription:', error);
      throw error;
    }
  },

  async unsubscribe(): Promise<void> {
    try {
      await this.initOneSignal();
      
      if (!window.OneSignal) {
        console.error('OneSignal not loaded');
        return;
      }

      await window.OneSignal.User.PushSubscription.optOut();
      console.log('✅ Unsubscribed from OneSignal notifications');
    } catch (error) {
      console.error('❌ Error unsubscribing from OneSignal:', error);
      throw error;
    }
  },

  async isSubscriptionValid(): Promise<boolean> {
    try {
      await this.initOneSignal();
      
      if (!window.OneSignal) {
        return false;
      }

      const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 Subscription validity check:', isOptedIn);
      return isOptedIn;
    } catch (error) {
      console.error('❌ Error checking OneSignal subscription validity:', error);
      return false;
    }
  },

  isSupported(): boolean {
    const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
    console.log('🔔 Push notifications supported:', supported);
    return supported;
  },

  async getSubscriptionStatus(userId: number): Promise<{ isSubscribed: boolean; hasValidToken: boolean }> {
    try {
      console.log('🔔 Getting subscription status for user:', userId);
      const subscriptionId = await this.getSubscription();
      const isValid = await this.isSubscriptionValid();
      
      const status = {
        isSubscribed: !!subscriptionId,
        hasValidToken: isValid
      };
      
      console.log('🔔 Subscription status:', status);
      return status;
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      return { isSubscribed: false, hasValidToken: false };
    }
  },

  async subscribe(userId: number): Promise<boolean> {
    try {
      console.log('🔔 Starting subscription process for user:', userId);
      const success = await this.requestPermission();
      if (success) {
        const subscriptionId = await this.getSubscription();
        if (subscriptionId) {
          await this.saveSubscriptionToDatabase(userId, subscriptionId);
          console.log('✅ Subscription process completed successfully');
        } else {
          console.warn('⚠️ Permission granted but no subscription ID found');
        }
      }
      return success;
    } catch (error) {
      console.error('❌ Error subscribing:', error);
      return false;
    }
  }
};
