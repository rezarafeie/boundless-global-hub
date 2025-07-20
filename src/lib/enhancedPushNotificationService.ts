
import { detectMobileCapabilities, getOneSignalConfig, type MobileDeviceInfo } from './mobilePushDetection';

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

export class EnhancedPushNotificationService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private deviceInfo: MobileDeviceInfo;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.deviceInfo = detectMobileCapabilities();
    console.log('🔔 [Enhanced] Device capabilities detected:', this.deviceInfo);
  }

  getDeviceInfo(): MobileDeviceInfo {
    return this.deviceInfo;
  }

  async ensureOneSignalLoaded(): Promise<boolean> {
    // Check if OneSignal is already loaded
    if (typeof window.OneSignal !== 'undefined') {
      console.log('🔔 [Enhanced] OneSignal already loaded');
      return true;
    }

    // Try to load OneSignal SDK manually if not loaded
    console.log('🔔 [Enhanced] OneSignal not detected, attempting manual load...');
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      
      script.onload = () => {
        console.log('🔔 [Enhanced] OneSignal SDK loaded manually');
        // Wait a bit for SDK to initialize
        setTimeout(() => {
          resolve(typeof window.OneSignal !== 'undefined');
        }, 1000);
      };
      
      script.onerror = () => {
        console.error('🔔 [Enhanced] Failed to load OneSignal SDK');
        resolve(false);
      };
      
      document.head.appendChild(script);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        resolve(typeof window.OneSignal !== 'undefined');
      }, 10000);
    });
  }

  async initOneSignal(): Promise<void> {
    console.log('🔔 [Enhanced] Starting OneSignal initialization...');
    
    // Return existing initialization promise if already in progress
    if (this.initializationPromise) {
      console.log('🔔 [Enhanced] Using existing initialization promise');
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized && window.OneSignal) {
      console.log('🔔 [Enhanced] OneSignal already initialized');
      return Promise.resolve();
    }

    // Check if web push is supported on this device
    if (!this.deviceInfo.supportsWebPush) {
      const error = new Error(`Web push not supported: ${this.deviceInfo.limitations.join(', ')}`);
      console.error('🔔 [Enhanced]', error.message);
      throw error;
    }

    this.initializationPromise = new Promise<void>(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('🔔 [Enhanced] OneSignal initialization timeout after 30 seconds');
        reject(new Error('OneSignal initialization timeout'));
      }, 30000);

      try {
        // Ensure OneSignal SDK is loaded
        const sdkLoaded = await this.ensureOneSignalLoaded();
        if (!sdkLoaded) {
          throw new Error('Failed to load OneSignal SDK');
        }

        // Wait for OneSignal to be available
        await this.waitForOneSignal();

        console.log('🔔 [Enhanced] OneSignal SDK detected, attempting initialization...');
        
        // Use OneSignalDeferred pattern for proper initialization
        if (!window.OneSignalDeferred) {
          window.OneSignalDeferred = [];
        }

        window.OneSignalDeferred.push(async (OneSignal: any) => {
          console.log('🔔 [Enhanced] OneSignal deferred initialization started');
          
          try {
            const config = getOneSignalConfig(this.deviceInfo);
            console.log('🔔 [Enhanced] Using config for device:', config);

            await OneSignal.init(config);

            // Wait for OneSignal to be fully ready
            await this.waitForOneSignalReady(OneSignal);

            console.log('🔔 [Enhanced] OneSignal initialized successfully');
            this.isInitialized = true;
            clearTimeout(timeout);
            resolve();
          } catch (initError) {
            console.error('🔔 [Enhanced] OneSignal deferred init error:', initError);
            clearTimeout(timeout);
            reject(initError);
          }
        });

      } catch (error) {
        console.error('🔔 [Enhanced] OneSignal initialization error:', error);
        clearTimeout(timeout);
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  private async waitForOneSignal(): Promise<void> {
    return new Promise((resolve, reject) => {
      const maxWaitTime = 15000; // 15 seconds
      const checkInterval = 500; // 500ms
      let elapsed = 0;

      const checkOneSignal = () => {
        if (typeof window.OneSignal !== 'undefined') {
          resolve();
          return;
        }

        elapsed += checkInterval;
        if (elapsed >= maxWaitTime) {
          reject(new Error('OneSignal not available after waiting'));
          return;
        }

        setTimeout(checkOneSignal, checkInterval);
      };

      checkOneSignal();
    });
  }

  private async waitForOneSignalReady(OneSignal: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const maxWaitTime = 10000; // 10 seconds
      const checkInterval = 200; // 200ms
      let elapsed = 0;

      const checkReady = async () => {
        try {
          // Try to access OneSignal User API to ensure it's ready
          if (OneSignal.User && OneSignal.User.PushSubscription) {
            console.log('🔔 [Enhanced] OneSignal User API is ready');
            resolve();
            return;
          }
        } catch (error) {
          console.log('🔔 [Enhanced] OneSignal not fully ready yet:', error);
        }

        elapsed += checkInterval;
        if (elapsed >= maxWaitTime) {
          console.warn('🔔 [Enhanced] OneSignal readiness timeout, proceeding anyway');
          resolve(); // Don't reject, just proceed
          return;
        }

        setTimeout(checkReady, checkInterval);
      };

      checkReady();
    });
  }

  async requestPermissionWithUserGesture(): Promise<boolean> {
    try {
      console.log('🔔 [Enhanced] Starting permission request...');
      
      // Check device capabilities first
      if (!this.deviceInfo.supportsWebPush) {
        console.log('🔔 [Enhanced] Web push not supported on this device');
        return false;
      }

      // Initialize OneSignal first
      await this.initOneSignal();
      
      if (!window.OneSignal) {
        console.error('🔔 [Enhanced] OneSignal not available after initialization');
        return false;
      }

      console.log('🔔 [Enhanced] OneSignal available, checking current state...');

      // Check current permission status
      let isSubscribed = false;
      try {
        isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
        console.log('🔔 [Enhanced] Current subscription status:', isSubscribed);
      } catch (error) {
        console.log('🔔 [Enhanced] Could not check current subscription status:', error);
      }
      
      if (isSubscribed) {
        console.log('✅ [Enhanced] User already subscribed');
        return true;
      }

      // Device-specific permission request strategy
      if (this.deviceInfo.isIOS) {
        return await this.requestIOSPermission();
      } else if (this.deviceInfo.isAndroid) {
        return await this.requestAndroidPermission();
      } else {
        return await this.requestDesktopPermission();
      }

    } catch (error) {
      console.error('❌ [Enhanced] Error requesting permission:', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔔 [Enhanced] Retrying permission request (${this.retryCount}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return this.requestPermissionWithUserGesture();
      }
      
      return false;
    }
  }

  private async requestIOSPermission(): Promise<boolean> {
    console.log('🔔 [Enhanced] Using iOS-specific permission request...');
    
    try {
      // For iOS PWA, try OneSignal first
      if (this.deviceInfo.isPWA) {
        console.log('🔔 [Enhanced] iOS PWA detected, trying OneSignal opt-in...');
        await window.OneSignal.User.PushSubscription.optIn();
        
        // Wait for subscription to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const optedIn = await window.OneSignal.User.PushSubscription.optedIn;
        if (optedIn) {
          console.log('✅ [Enhanced] iOS PWA OneSignal subscription successful');
          return true;
        }
      }
      
      // Fallback to native browser API
      if ('Notification' in window) {
        console.log('🔔 [Enhanced] Requesting native browser notification permission for iOS...');
        const permission = await Notification.requestPermission();
        console.log('🔔 [Enhanced] iOS native permission result:', permission);
        
        if (permission === 'granted') {
          // Try to get OneSignal subscription after native permission
          try {
            await window.OneSignal.User.PushSubscription.optIn();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const optedIn = await window.OneSignal.User.PushSubscription.optedIn;
            return optedIn;
          } catch (error) {
            console.log('🔔 [Enhanced] OneSignal opt-in failed on iOS, but native permission granted');
            return true; // Native permission is granted, that's what matters for iOS
          }
        }
      }
    } catch (error) {
      console.error('🔔 [Enhanced] iOS permission request failed:', error);
    }
    
    return false;
  }

  private async requestAndroidPermission(): Promise<boolean> {
    console.log('🔔 [Enhanced] Using Android-specific permission request...');
    
    try {
      // Try OneSignal direct opt-in first
      console.log('🔔 [Enhanced] Attempting OneSignal opt-in for Android...');
      await window.OneSignal.User.PushSubscription.optIn();
      
      // Wait for subscription to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 [Enhanced] Android OneSignal opt-in result:', result);
      
      if (result) {
        return true;
      }
    } catch (error) {
      console.log('🔔 [Enhanced] Android OneSignal opt-in failed, trying native:', error);
    }
    
    // Fallback to native browser notification
    if ('Notification' in window) {
      console.log('🔔 [Enhanced] Trying native notification permission for Android...');
      const permission = await Notification.requestPermission();
      console.log('🔔 [Enhanced] Android native permission result:', permission);
      
      if (permission === 'granted') {
        // Try OneSignal again after native permission
        try {
          await window.OneSignal.User.PushSubscription.optIn();
          await new Promise(resolve => setTimeout(resolve, 1000));
          const optedIn = await window.OneSignal.User.PushSubscription.optedIn;
          return optedIn;
        } catch (error) {
          console.log('🔔 [Enhanced] OneSignal still failed, but native permission granted');
          return true;
        }
      }
    }
    
    return false;
  }

  private async requestDesktopPermission(): Promise<boolean> {
    console.log('🔔 [Enhanced] Using desktop-specific permission request...');
    
    try {
      // Use OneSignal Slidedown for desktop
      console.log('🔔 [Enhanced] Attempting OneSignal slidedown for desktop...');
      await window.OneSignal.Slidedown.promptPush();
      console.log('🔔 [Enhanced] Desktop slidedown permission prompt triggered');
      
      // Wait for user interaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 [Enhanced] Desktop slidedown result:', result);
      
      if (result) {
        return true;
      }
    } catch (error) {
      console.log('🔔 [Enhanced] Desktop slidedown failed, trying direct opt-in:', error);
    }
    
    // Fallback to direct opt-in
    try {
      console.log('🔔 [Enhanced] Attempting direct opt-in for desktop...');
      await window.OneSignal.User.PushSubscription.optIn();
      
      // Wait for subscription to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 [Enhanced] Desktop direct opt-in result:', result);
      return result;
    } catch (error) {
      console.log('🔔 [Enhanced] Desktop direct opt-in failed:', error);
    }
    
    // Final fallback to native browser API
    if ('Notification' in window) {
      console.log('🔔 [Enhanced] Trying native notification permission for desktop...');
      const permission = await Notification.requestPermission();
      console.log('🔔 [Enhanced] Desktop native permission result:', permission);
      return permission === 'granted';
    }
    
    return false;
  }

  async getSubscription(): Promise<string | null> {
    try {
      if (!this.isInitialized || !window.OneSignal) {
        console.log('🔔 [Enhanced] OneSignal not initialized for subscription check');
        return null;
      }

      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 [Enhanced] Subscription check - opted in:', isSubscribed);
      
      if (isSubscribed) {
        const subscriptionId = await window.OneSignal.User.PushSubscription.id;
        console.log('🔔 [Enhanced] OneSignal subscription ID:', subscriptionId ? 'found' : 'null');
        return subscriptionId;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [Enhanced] Error getting subscription:', error);
      return null;
    }
  }

  async isSubscriptionValid(): Promise<boolean> {
    try {
      if (!this.isInitialized || !window.OneSignal) {
        console.log('🔔 [Enhanced] OneSignal not ready for subscription validation');
        return false;
      }

      const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn;
      const subscriptionId = await window.OneSignal.User.PushSubscription.id;
      
      const isValid = isOptedIn && !!subscriptionId;
      console.log('🔔 [Enhanced] Subscription validity check:', { isOptedIn, hasId: !!subscriptionId, isValid });
      return isValid;
    } catch (error) {
      console.error('❌ [Enhanced] Error checking subscription validity:', error);
      return false;
    }
  }

  async getSubscriptionStatus(userId: number): Promise<{ isSubscribed: boolean; hasValidToken: boolean }> {
    try {
      console.log('🔔 [Enhanced] Getting subscription status for user:', userId);
      
      const subscriptionId = await this.getSubscription();
      const isValid = await this.isSubscriptionValid();
      
      const status = {
        isSubscribed: !!subscriptionId,
        hasValidToken: isValid
      };
      
      console.log('🔔 [Enhanced] Subscription status:', status);
      return status;
    } catch (error) {
      console.error('❌ [Enhanced] Error getting subscription status:', error);
      return { isSubscribed: false, hasValidToken: false };
    }
  }

  async subscribe(userId: number): Promise<boolean> {
    try {
      console.log('🔔 [Enhanced] Starting subscription process for user:', userId);
      
      const success = await this.requestPermissionWithUserGesture();
      
      if (success) {
        // Wait longer for subscription to be fully established
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const subscriptionId = await this.getSubscription();
        console.log('🔔 [Enhanced] Subscription ID obtained:', subscriptionId ? 'success' : 'failed');
        
        if (subscriptionId) {
          console.log('✅ [Enhanced] Subscription process completed successfully');
          return true;
        } else {
          console.warn('⚠️ [Enhanced] Permission granted but no subscription ID found');
          // Try one more time after a delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          const retrySubscriptionId = await this.getSubscription();
          return !!retrySubscriptionId;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Enhanced] Error subscribing:', error);
      return false;
    }
  }

  isSupported(): boolean {
    return this.deviceInfo.supportsWebPush;
  }

  reset(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.retryCount = 0;
  }
}

// Export singleton instance
export const enhancedPushNotificationService = new EnhancedPushNotificationService();
