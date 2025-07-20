
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
    
    // For iOS, we need to use native browser API as OneSignal has limitations
    if ('Notification' in window) {
      console.log('🔔 [Enhanced] Requesting native browser notification permission for iOS...');
      const permission = await Notification.requestPermission();
      console.log('🔔 [Enhanced] iOS native permission result:', permission);
      
      if (permission === 'granted') {
        // Try to get OneSignal subscription after native permission
        try {
          await window.OneSignal.User.PushSubscription.optIn();
          const optedIn = await window.OneSignal.User.PushSubscription.optedIn;
          return optedIn;
        } catch (error) {
          console.log('🔔 [Enhanced] OneSignal opt-in failed on iOS, but native permission granted');
          return true; // Native permission is granted, that's what matters for iOS
        }
      }
    }
    
    return false;
  }

  private async requestAndroidPermission(): Promise<boolean> {
    console.log('🔔 [Enhanced] Using Android-specific permission request...');
    
    try {
      // Try OneSignal direct opt-in first
      await window.OneSignal.User.PushSubscription.optIn();
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
      const permission = await Notification.requestPermission();
      console.log('🔔 [Enhanced] Android native permission result:', permission);
      return permission === 'granted';
    }
    
    return false;
  }

  private async requestDesktopPermission(): Promise<boolean> {
    console.log('🔔 [Enhanced] Using desktop-specific permission request...');
    
    try {
      // Use OneSignal Slidedown for desktop
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
      await window.OneSignal.User.PushSubscription.optIn();
      const result = await window.OneSignal.User.PushSubscription.optedIn;
      return result;
    } catch (error) {
      console.log('🔔 [Enhanced] Desktop direct opt-in failed:', error);
    }
    
    return false;
  }

  async getSubscription(): Promise<string | null> {
    try {
      if (!this.isInitialized || !window.OneSignal) {
        return null;
      }

      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      
      if (isSubscribed) {
        const subscriptionId = await window.OneSignal.User.PushSubscription.id;
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
        return false;
      }

      const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn;
      const subscriptionId = await window.OneSignal.User.PushSubscription.id;
      
      return isOptedIn && !!subscriptionId;
    } catch (error) {
      console.error('❌ [Enhanced] Error checking subscription validity:', error);
      return false;
    }
  }

  async getSubscriptionStatus(userId: number): Promise<{ isSubscribed: boolean; hasValidToken: boolean }> {
    try {
      const subscriptionId = await this.getSubscription();
      const isValid = await this.isSubscriptionValid();
      
      return {
        isSubscribed: !!subscriptionId,
        hasValidToken: isValid
      };
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
        const subscriptionId = await this.getSubscription();
        console.log('🔔 [Enhanced] Subscription ID obtained:', subscriptionId ? 'success' : 'failed');
        return !!subscriptionId;
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
