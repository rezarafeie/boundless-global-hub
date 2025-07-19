
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

export const pushNotificationService = {
  async initOneSignal(): Promise<void> {
    return new Promise((resolve) => {
      if (window.OneSignal) {
        resolve();
        return;
      }
      
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.init({
          appId: "e221c080-7853-46e5-ba40-93796318d1a0",
          allowLocalhostAsSecureOrigin: true,
        });
        resolve();
      });
    });
  },

  async requestPermission(): Promise<boolean> {
    try {
      await this.initOneSignal();
      
      if (!window.OneSignal) {
        console.error('OneSignal not loaded');
        return false;
      }

      // Check if already subscribed
      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      if (isSubscribed) {
        console.log('✅ User already subscribed to OneSignal');
        return true;
      }

      // Request permission and subscribe
      await window.OneSignal.Slidedown.promptPush();
      const newSubscriptionState = await window.OneSignal.User.PushSubscription.optedIn;
      
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
        return null;
      }

      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      if (isSubscribed) {
        const subscriptionId = await window.OneSignal.User.PushSubscription.id;
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

      return await window.OneSignal.User.PushSubscription.optedIn;
    } catch (error) {
      console.error('❌ Error checking OneSignal subscription validity:', error);
      return false;
    }
  },

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
  },

  async getSubscriptionStatus(userId: number): Promise<{ isSubscribed: boolean; hasValidToken: boolean }> {
    try {
      const subscriptionId = await this.getSubscription();
      const isValid = await this.isSubscriptionValid();
      
      return {
        isSubscribed: !!subscriptionId,
        hasValidToken: isValid
      };
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      return { isSubscribed: false, hasValidToken: false };
    }
  },

  async subscribe(userId: number): Promise<boolean> {
    try {
      const success = await this.requestPermission();
      if (success) {
        const subscriptionId = await this.getSubscription();
        if (subscriptionId) {
          await this.saveSubscriptionToDatabase(userId, subscriptionId);
        }
      }
      return success;
    } catch (error) {
      console.error('❌ Error subscribing:', error);
      return false;
    }
  }
};
