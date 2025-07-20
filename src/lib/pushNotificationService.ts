declare global {
  interface Window {
    OneSignal?: any;
  }
}

export const pushNotificationService = {
  isInitialized: false,
  initializationPromise: null as Promise<void> | null,

  async initOneSignal(): Promise<void> {
    console.log('🔔 [Android] Starting OneSignal initialization...');
    
    // Return existing initialization promise if already in progress
    if (this.initializationPromise) {
      console.log('🔔 [Android] Using existing initialization promise');
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized && window.OneSignal) {
      console.log('🔔 [Android] OneSignal already initialized');
      return Promise.resolve<void>();
    }

    this.initializationPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('🔔 [Android] OneSignal initialization timeout');
        reject(new Error('OneSignal initialization timeout'));
      }, 15000);

      const checkAndInit = async () => {
        try {
          if (typeof window.OneSignal === 'undefined') {
            console.log('🔔 [Android] OneSignal not loaded yet, waiting...');
            setTimeout(checkAndInit, 500);
            return;
          }

          console.log('🔔 [Android] OneSignal SDK loaded, initializing...');
          
          await window.OneSignal.init({
            appId: "e221c080-7853-46e5-ba40-93796318d1a0",
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerPath: '/OneSignalSDKWorker.js',
            serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
            autoRegister: true,
            autoResubscribe: true,
            notificationClickHandlerAction: 'focus',
            persistNotification: false
          });

          console.log('🔔 [Android] OneSignal initialized successfully');
          this.isInitialized = true;
          clearTimeout(timeout);
          resolve();
        } catch (error) {
          console.error('🔔 [Android] OneSignal initialization error:', error);
          clearTimeout(timeout);
          reject(error);
        }
      };

      checkAndInit();
    });

    return this.initializationPromise;
  },

  async requestPermissionWithUserGesture(): Promise<boolean> {
    try {
      console.log('🔔 [Android] Starting permission request with user gesture...');
      
      // Initialize OneSignal first
      await this.initOneSignal();
      
      if (!window.OneSignal) {
        console.error('🔔 [Android] OneSignal not available after initialization');
        return false;
      }

      // Check if already subscribed
      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 [Android] Current subscription status:', isSubscribed);
      
      if (isSubscribed) {
        console.log('✅ [Android] User already subscribed');
        return true;
      }

      // Request permission with user gesture
      console.log('🔔 [Android] Requesting OneSignal permission...');
      
      // Use slidedown prompt for better mobile UX
      await window.OneSignal.Slidedown.promptPush();
      
      // Wait for user response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check final subscription status
      const finalSubscriptionState = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 [Android] Final subscription state:', finalSubscriptionState);
      
      if (finalSubscriptionState) {
        console.log('✅ [Android] Permission granted and subscribed');
        return true;
      } else {
        console.log('❌ [Android] Permission denied or subscription failed');
        return false;
      }
    } catch (error) {
      console.error('❌ [Android] Error requesting permission:', error);
      return false;
    }
  },

  async getSubscription(): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        console.log('🔔 [Android] OneSignal not initialized, cannot get subscription');
        return null;
      }

      if (!window.OneSignal) {
        console.log('🔔 [Android] OneSignal not available');
        return null;
      }

      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 [Android] Subscription check - opted in:', isSubscribed);
      
      if (isSubscribed) {
        const subscriptionId = await window.OneSignal.User.PushSubscription.id;
        console.log('🔔 [Android] OneSignal subscription ID:', subscriptionId ? 'found' : 'null');
        return subscriptionId;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [Android] Error getting subscription:', error);
      return null;
    }
  },

  async isSubscriptionValid(): Promise<boolean> {
    try {
      if (!this.isInitialized || !window.OneSignal) {
        return false;
      }

      const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn;
      const subscriptionId = await window.OneSignal.User.PushSubscription.id;
      
      const isValid = isOptedIn && !!subscriptionId;
      console.log('🔔 [Android] Subscription validity check:', { isOptedIn, hasId: !!subscriptionId, isValid });
      return isValid;
    } catch (error) {
      console.error('❌ [Android] Error checking subscription validity:', error);
      return false;
    }
  },

  async getSubscriptionStatus(userId: number): Promise<{ isSubscribed: boolean; hasValidToken: boolean }> {
    try {
      console.log('🔔 [Android] Getting subscription status for user:', userId);
      
      const subscriptionId = await this.getSubscription();
      const isValid = await this.isSubscriptionValid();
      
      const status = {
        isSubscribed: !!subscriptionId,
        hasValidToken: isValid
      };
      
      console.log('🔔 [Android] Subscription status:', status);
      return status;
    } catch (error) {
      console.error('❌ [Android] Error getting subscription status:', error);
      return { isSubscribed: false, hasValidToken: false };
    }
  },

  async subscribe(userId: number): Promise<boolean> {
    try {
      console.log('🔔 [Android] Starting subscription process for user:', userId);
      
      const success = await this.requestPermissionWithUserGesture();
      
      if (success) {
        const subscriptionId = await this.getSubscription();
        if (subscriptionId) {
          console.log('✅ [Android] Subscription process completed successfully');
          // Note: Database saving should be handled by the calling code
        } else {
          console.warn('⚠️ [Android] Permission granted but no subscription ID found');
        }
      }
      
      return success;
    } catch (error) {
      console.error('❌ [Android] Error subscribing:', error);
      return false;
    }
  },

  isSupported(): boolean {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasNotification = 'Notification' in window;
    const hasSecureContext = window.isSecureContext;
    
    const supported = hasServiceWorker && hasNotification && hasSecureContext;
    
    console.log('🔔 [Android] Support check:', {
      isMobile,
      hasServiceWorker,
      hasNotification,
      hasSecureContext,
      supported
    });
    
    return supported;
  }
};
