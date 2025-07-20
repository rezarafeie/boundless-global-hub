
import { detectMobileCapabilities, getOneSignalConfig, type MobileDeviceInfo } from './mobilePushDetection';
import { serviceWorkerManager } from './serviceWorkerManager';
import { enhancedOneSignalLoader } from './enhancedOneSignalLoader';

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

export const enhancedPushNotificationService = {
  isInitialized: false,
  initializationPromise: null as Promise<void> | null,
  deviceInfo: null as MobileDeviceInfo | null,

  getDeviceInfo(): MobileDeviceInfo {
    if (!this.deviceInfo) {
      this.deviceInfo = detectMobileCapabilities();
      console.log('🔔 [Enhanced Service] Device info detected:', this.deviceInfo);
    }
    return this.deviceInfo;
  },

  async initOneSignal(): Promise<void> {
    console.log('🔔 [Enhanced Service] Starting OneSignal initialization...');
    
    if (this.initializationPromise) {
      console.log('🔔 [Enhanced Service] Using existing initialization promise');
      return this.initializationPromise;
    }

    if (this.isInitialized && window.OneSignal) {
      console.log('🔔 [Enhanced Service] OneSignal already initialized');
      return Promise.resolve();
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  },

  async performInitialization(): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      
      if (!deviceInfo.supportsWebPush) {
        console.warn('🔔 [Enhanced Service] Web push not supported on this device');
        throw new Error('Web push notifications not supported on this device');
      }

      // Step 1: Register unified service worker
      console.log('🔧 [Enhanced Service] Registering unified service worker...');
      const swRegistration = await serviceWorkerManager.registerUnifiedServiceWorker();
      
      if (!swRegistration) {
        throw new Error('Failed to register service worker');
      }

      // Step 2: Load OneSignal SDK
      console.log('📦 [Enhanced Service] Loading OneSignal SDK...');
      const sdkLoaded = await enhancedOneSignalLoader.loadOneSignalSDK();
      
      if (!sdkLoaded) {
        throw new Error('Failed to load OneSignal SDK');
      }

      // Step 3: Wait for OneSignal to be ready
      console.log('⏳ [Enhanced Service] Waiting for OneSignal to be ready...');
      await this.waitForOneSignalReady();

      // Step 4: Initialize OneSignal with device-specific config
      console.log('🔧 [Enhanced Service] Initializing OneSignal with config...');
      const config = getOneSignalConfig(deviceInfo);
      
      // Enhanced config for unified service worker
      const enhancedConfig = {
        ...config,
        serviceWorkerPath: '/unified-sw.js',
        serviceWorkerUpdaterPath: '/unified-sw.js',
        serviceWorkerParam: { scope: '/' }
      };

      console.log('🔧 [Enhanced Service] OneSignal config:', enhancedConfig);

      if (!window.OneSignalDeferred) {
        window.OneSignalDeferred = [];
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('OneSignal initialization timeout'));
        }, 15000);

        window.OneSignalDeferred!.push(async function(OneSignal: any) {
          try {
            console.log('🔔 [Enhanced Service] OneSignal deferred initialization started');
            
            await OneSignal.init(enhancedConfig);
            
            console.log('✅ [Enhanced Service] OneSignal initialized successfully');
            clearTimeout(timeout);
            resolve();
          } catch (error) {
            console.error('❌ [Enhanced Service] OneSignal initialization failed:', error);
            clearTimeout(timeout);
            reject(error);
          }
        });
      });

      this.isInitialized = true;
      console.log('🎉 [Enhanced Service] Enhanced push notification service initialized');

    } catch (error) {
      console.error('❌ [Enhanced Service] Initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  },

  async waitForOneSignalReady(maxWait: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (typeof window.OneSignal !== 'undefined') {
        console.log('✅ [Enhanced Service] OneSignal is ready');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    throw new Error('OneSignal not ready within timeout period');
  },

  async requestPermissionWithUserGesture(): Promise<boolean> {
    try {
      console.log('🔔 [Enhanced Service] Starting permission request...');
      
      await this.initOneSignal();
      
      if (!window.OneSignal) {
        console.error('🔔 [Enhanced Service] OneSignal not available');
        return false;
      }

      const deviceInfo = this.getDeviceInfo();
      console.log('🔔 [Enhanced Service] Device-specific permission request for:', deviceInfo.browser, deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Desktop');

      // Check current status first
      let currentStatus = false;
      try {
        currentStatus = await window.OneSignal.User.PushSubscription.optedIn;
        console.log('🔔 [Enhanced Service] Current opt-in status:', currentStatus);
      } catch (error) {
        console.log('🔔 [Enhanced Service] Could not check current status:', error);
      }
      
      if (currentStatus) {
        console.log('✅ [Enhanced Service] Already opted in');
        return true;
      }

      // Device-specific permission strategies
      if (deviceInfo.isAndroid) {
        return await this.handleAndroidPermission();
      } else if (deviceInfo.isIOS) {
        return await this.handleIOSPermission();
      } else {
        return await this.handleDesktopPermission();
      }

    } catch (error) {
      console.error('❌ [Enhanced Service] Permission request failed:', error);
      return false;
    }
  },

  async handleAndroidPermission(): Promise<boolean> {
    console.log('🤖 [Enhanced Service] Handling Android permission...');
    
    try {
      // For Android, try OneSignal opt-in first
      await window.OneSignal.User.PushSubscription.optIn();
      
      // Wait for subscription to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🤖 [Enhanced Service] Android opt-in result:', isOptedIn);
      
      if (isOptedIn) {
        return true;
      }
      
      // Fallback to native browser permission
      if ('Notification' in window) {
        console.log('🤖 [Enhanced Service] Android fallback to native permission...');
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Enhanced Service] Android permission failed:', error);
      return false;
    }
  },

  async handleIOSPermission(): Promise<boolean> {
    console.log('🍎 [Enhanced Service] Handling iOS permission...');
    
    const deviceInfo = this.getDeviceInfo();
    
    if (!deviceInfo.isPWA) {
      console.log('⚠️ [Enhanced Service] iOS requires PWA mode for notifications');
      return false;
    }
    
    try {
      // iOS requires native permission request
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('🍎 [Enhanced Service] iOS native permission result:', permission);
        
        if (permission === 'granted') {
          // Try to create OneSignal subscription after native permission
          try {
            await window.OneSignal.User.PushSubscription.optIn();
            await new Promise(resolve => setTimeout(resolve, 3000)); // Longer wait for iOS
            
            const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn;
            console.log('🍎 [Enhanced Service] iOS OneSignal opt-in result:', isOptedIn);
            
            return isOptedIn;
          } catch (error) {
            console.warn('⚠️ [Enhanced Service] iOS OneSignal opt-in failed, but native permission granted:', error);
            return true; // Return true since native permission was granted
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Enhanced Service] iOS permission failed:', error);
      return false;
    }
  },

  async handleDesktopPermission(): Promise<boolean> {
    console.log('🖥️ [Enhanced Service] Handling Desktop permission...');
    
    try {
      // Try OneSignal slidedown first for desktop
      if (window.OneSignal.Slidedown) {
        console.log('🖥️ [Enhanced Service] Using OneSignal slidedown...');
        await window.OneSignal.Slidedown.promptPush();
        
        // Wait for user interaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const slidedownResult = await window.OneSignal.User.PushSubscription.optedIn;
        console.log('🖥️ [Enhanced Service] Desktop slidedown result:', slidedownResult);
        
        if (slidedownResult) {
          return true;
        }
      }
      
      // Fallback to direct opt-in
      console.log('🖥️ [Enhanced Service] Desktop fallback to direct opt-in...');
      await window.OneSignal.User.PushSubscription.optIn();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const directResult = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🖥️ [Enhanced Service] Desktop direct opt-in result:', directResult);
      
      return directResult;
      
    } catch (error) {
      console.error('❌ [Enhanced Service] Desktop permission failed:', error);
      
      // Final fallback to native browser API
      if ('Notification' in window) {
        console.log('🖥️ [Enhanced Service] Desktop final fallback to native...');
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      
      return false;
    }
  },

  async getSubscription(): Promise<string | null> {
    try {
      if (!this.isInitialized || !window.OneSignal) {
        console.log('🔔 [Enhanced Service] OneSignal not initialized');
        return null;
      }

      const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 [Enhanced Service] Subscription check - opted in:', isOptedIn);
      
      if (isOptedIn) {
        const subscriptionId = await window.OneSignal.User.PushSubscription.id;
        console.log('🔔 [Enhanced Service] Subscription ID:', subscriptionId ? 'found' : 'null');
        return subscriptionId;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [Enhanced Service] Error getting subscription:', error);
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
      console.log('🔔 [Enhanced Service] Subscription validity:', { isOptedIn, hasId: !!subscriptionId, isValid });
      return isValid;
    } catch (error) {
      console.error('❌ [Enhanced Service] Error checking subscription validity:', error);
      return false;
    }
  },

  async getSubscriptionStatus(userId: number): Promise<{ isSubscribed: boolean; hasValidToken: boolean }> {
    try {
      console.log('🔔 [Enhanced Service] Getting subscription status for user:', userId);
      
      const subscriptionId = await this.getSubscription();
      const isValid = await this.isSubscriptionValid();
      
      const status = {
        isSubscribed: !!subscriptionId,
        hasValidToken: isValid
      };
      
      console.log('🔔 [Enhanced Service] Subscription status:', status);
      return status;
    } catch (error) {
      console.error('❌ [Enhanced Service] Error getting subscription status:', error);
      return { isSubscribed: false, hasValidToken: false };
    }
  },

  async subscribe(userId: number): Promise<boolean> {
    try {
      console.log('🔔 [Enhanced Service] Starting subscription process for user:', userId);
      
      const success = await this.requestPermissionWithUserGesture();
      
      if (success) {
        // Wait for subscription to be fully created
        let subscriptionId = null;
        let attempts = 0;
        const maxAttempts = 8; // Increased attempts
        
        while (!subscriptionId && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1))); // Progressive delay
          subscriptionId = await this.getSubscription();
          attempts++;
          console.log(`🔔 [Enhanced Service] Subscription attempt ${attempts}: ${subscriptionId ? 'found' : 'not found'}`);
        }
        
        if (subscriptionId) {
          console.log('✅ [Enhanced Service] Subscription process completed successfully');
          return true;
        } else {
          console.warn('⚠️ [Enhanced Service] Permission granted but no subscription ID after retries');
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ [Enhanced Service] Error subscribing:', error);
      return false;
    }
  },

  isSupported(): boolean {
    const deviceInfo = this.getDeviceInfo();
    return deviceInfo.supportsWebPush;
  },

  getInitializationStatus(): { 
    isInitialized: boolean; 
    sdkLoaded: boolean; 
    swRegistered: boolean;
    deviceSupported: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      sdkLoaded: enhancedOneSignalLoader.isSDKLoaded(),
      swRegistered: serviceWorkerManager.isServiceWorkerRegistered(),
      deviceSupported: this.getDeviceInfo().supportsWebPush
    };
  }
};
