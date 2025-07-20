
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

export const pushNotificationService = {
  isInitialized: false,
  initializationPromise: null as Promise<void> | null,

  async initOneSignal(): Promise<void> {
    console.log('🔔 [OneSignal] Starting OneSignal initialization...');
    
    // Return existing initialization promise if already in progress
    if (this.initializationPromise) {
      console.log('🔔 [OneSignal] Using existing initialization promise');
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized && window.OneSignal) {
      console.log('🔔 [OneSignal] OneSignal already initialized');
      return Promise.resolve();
    }

    this.initializationPromise = new Promise<void>((resolve, reject) => {
      console.log('🔔 [OneSignal] Creating new initialization promise');
      
      const timeout = setTimeout(() => {
        console.error('🔔 [OneSignal] OneSignal initialization timeout after 30 seconds');
        reject(new Error('OneSignal initialization timeout'));
      }, 30000);

      const checkAndInit = async () => {
        try {
          console.log('🔔 [OneSignal] Checking OneSignal availability:', {
            oneSignalExists: typeof window.OneSignal !== 'undefined',
            oneSignalType: typeof window.OneSignal,
            windowKeys: Object.keys(window).filter(k => k.includes('OneSignal')),
            userAgent: navigator.userAgent,
            isMobile: this.isMobileDevice()
          });

          if (typeof window.OneSignal === 'undefined') {
            console.log('🔔 [OneSignal] OneSignal not loaded yet, retrying in 500ms...');
            setTimeout(checkAndInit, 500);
            return;
          }

          console.log('🔔 [OneSignal] OneSignal SDK detected, attempting initialization...');
          
          // Use OneSignalDeferred pattern for proper initialization
          if (!window.OneSignalDeferred) {
            window.OneSignalDeferred = [];
          }

          window.OneSignalDeferred.push(async function(OneSignal: any) {
            console.log('🔔 [OneSignal] OneSignal deferred initialization started');
            
            try {
              // Mobile-specific configuration
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
              const isAndroid = /Android/.test(navigator.userAgent);
              
              console.log('🔔 [OneSignal] Device detection:', { isMobile, isIOS, isAndroid });

              const initConfig = {
                appId: "e221c080-7853-46e5-ba40-93796318d1a0",
                allowLocalhostAsSecureOrigin: true,
                serviceWorkerPath: '/OneSignalSDKWorker.js',
                serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
                autoRegister: false,
                autoResubscribe: true,
                notificationClickHandlerAction: 'focus',
                persistNotification: false,
                welcomeNotification: {
                  disable: false,
                  title: "اعلان‌های بدون مرز فعال شد",
                  message: "شما اعلان‌های جدید را دریافت خواهید کرد",
                  url: ""
                }
              };

              // Add mobile-specific configurations
              if (isMobile) {
                console.log('🔔 [OneSignal] Applying mobile-specific configuration');
                initConfig.autoRegister = true; // Enable auto-register for mobile
                initConfig.persistNotification = true; // Keep notifications on mobile
                
                if (isIOS) {
                  console.log('🔔 [OneSignal] iOS detected - using Safari-specific settings');
                  // iOS Safari specific settings
                  initConfig.safari_web_id = "web.onesignal.auto.e221c080-7853-46e5-ba40-93796318d1a0";
                }
              }

              await OneSignal.init(initConfig);

              console.log('🔔 [OneSignal] OneSignal initialized successfully');
              clearTimeout(timeout);
              resolve();
            } catch (initError) {
              console.error('🔔 [OneSignal] OneSignal deferred init error:', initError);
              clearTimeout(timeout);
              reject(initError);
            }
          });

          this.isInitialized = true;
          
        } catch (error) {
          console.error('🔔 [OneSignal] OneSignal initialization error:', error);
          clearTimeout(timeout);
          reject(error);
        }
      };

      // Start checking immediately
      checkAndInit();
    });

    return this.initializationPromise;
  },

  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  async requestPermissionWithUserGesture(): Promise<boolean> {
    try {
      console.log('🔔 [OneSignal] Starting permission request with user gesture...');
      
      // Initialize OneSignal first
      await this.initOneSignal();
      
      if (!window.OneSignal) {
        console.error('🔔 [OneSignal] OneSignal not available after initialization');
        return false;
      }

      console.log('🔔 [OneSignal] OneSignal available, checking current state...');

      // Check current permission status
      let isSubscribed = false;
      try {
        isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
        console.log('🔔 [OneSignal] Current subscription status:', isSubscribed);
      } catch (error) {
        console.log('🔔 [OneSignal] Could not check current subscription status:', error);
      }
      
      if (isSubscribed) {
        console.log('✅ [OneSignal] User already subscribed');
        return true;
      }

      const isMobile = this.isMobileDevice();
      console.log('🔔 [OneSignal] Device type:', isMobile ? 'Mobile' : 'Desktop');

      // Different approaches for mobile vs desktop
      if (isMobile) {
        console.log('🔔 [OneSignal] Using mobile-specific permission request...');
        
        // For mobile, try direct opt-in first
        try {
          await window.OneSignal.User.PushSubscription.optIn();
          const mobileOptInResult = await window.OneSignal.User.PushSubscription.optedIn;
          console.log('🔔 [OneSignal] Mobile opt-in result:', mobileOptInResult);
          
          if (mobileOptInResult) {
            console.log('✅ [OneSignal] Mobile permission granted via direct opt-in');
            return true;
          }
        } catch (mobileError) {
          console.log('🔔 [OneSignal] Mobile opt-in failed, trying native fallback:', mobileError);
        }
        
        // Fallback to native browser notification for mobile
        if ('Notification' in window) {
          console.log('🔔 [OneSignal] Trying native browser notification permission on mobile...');
          const permission = await Notification.requestPermission();
          console.log('🔔 [OneSignal] Mobile native permission result:', permission);
          return permission === 'granted';
        }
        
        return false;
      } else {
        // Desktop approach - use Slidedown first
        console.log('🔔 [OneSignal] Using desktop-specific permission request...');
        
        try {
          // Use OneSignal Slidedown to show permission prompt
          await window.OneSignal.Slidedown.promptPush();
          console.log('🔔 [OneSignal] Desktop slidedown permission prompt triggered');
          
          // Wait for user interaction
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check if permission was granted
          const slidedownResult = await window.OneSignal.User.PushSubscription.optedIn;
          console.log('🔔 [OneSignal] Desktop slidedown result:', slidedownResult);
          
          if (slidedownResult) {
            console.log('✅ [OneSignal] Desktop permission granted via slidedown');
            return true;
          }
        } catch (slidedownError) {
          console.log('🔔 [OneSignal] Desktop slidedown failed, trying direct opt-in:', slidedownError);
        }
        
        // Try direct opt-in as fallback for desktop
        try {
          await window.OneSignal.User.PushSubscription.optIn();
          const directOptInResult = await window.OneSignal.User.PushSubscription.optedIn;
          console.log('🔔 [OneSignal] Desktop direct opt-in result:', directOptInResult);
          
          if (directOptInResult) {
            console.log('✅ [OneSignal] Desktop permission granted via direct opt-in');
            return true;
          }
        } catch (directError) {
          console.log('🔔 [OneSignal] Desktop direct opt-in failed:', directError);
        }
        
        // Final fallback to native browser API for desktop
        if ('Notification' in window) {
          console.log('🔔 [OneSignal] Trying native browser notification permission on desktop...');
          const permission = await Notification.requestPermission();
          console.log('🔔 [OneSignal] Desktop native permission result:', permission);
          return permission === 'granted';
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ [OneSignal] Error requesting permission:', error);
      return false;
    }
  },

  async getSubscription(): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        console.log('🔔 [OneSignal] OneSignal not initialized, cannot get subscription');
        return null;
      }

      if (!window.OneSignal) {
        console.log('🔔 [OneSignal] OneSignal not available');
        return null;
      }

      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('🔔 [OneSignal] Subscription check - opted in:', isSubscribed);
      
      if (isSubscribed) {
        const subscriptionId = await window.OneSignal.User.PushSubscription.id;
        console.log('🔔 [OneSignal] OneSignal subscription ID:', subscriptionId ? 'found' : 'null');
        return subscriptionId;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [OneSignal] Error getting subscription:', error);
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
      console.log('🔔 [OneSignal] Subscription validity check:', { isOptedIn, hasId: !!subscriptionId, isValid });
      return isValid;
    } catch (error) {
      console.error('❌ [OneSignal] Error checking subscription validity:', error);
      return false;
    }
  },

  async getSubscriptionStatus(userId: number): Promise<{ isSubscribed: boolean; hasValidToken: boolean }> {
    try {
      console.log('🔔 [OneSignal] Getting subscription status for user:', userId);
      
      const subscriptionId = await this.getSubscription();
      const isValid = await this.isSubscriptionValid();
      
      const status = {
        isSubscribed: !!subscriptionId,
        hasValidToken: isValid
      };
      
      console.log('🔔 [OneSignal] Subscription status:', status);
      return status;
    } catch (error) {
      console.error('❌ [OneSignal] Error getting subscription status:', error);
      return { isSubscribed: false, hasValidToken: false };
    }
  },

  async subscribe(userId: number): Promise<boolean> {
    try {
      console.log('🔔 [OneSignal] Starting subscription process for user:', userId);
      
      const success = await this.requestPermissionWithUserGesture();
      
      if (success) {
        const subscriptionId = await this.getSubscription();
        console.log('🔔 [OneSignal] Subscription ID obtained:', subscriptionId);
        
        if (subscriptionId) {
          console.log('✅ [OneSignal] Subscription process completed successfully');
          return true;
        } else {
          console.warn('⚠️ [OneSignal] Permission granted but no subscription ID found');
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ [OneSignal] Error subscribing:', error);
      return false;
    }
  },

  isSupported(): boolean {
    const isMobile = this.isMobileDevice();
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasNotification = 'Notification' in window;
    const hasSecureContext = window.isSecureContext;
    
    const supported = hasServiceWorker && hasNotification && hasSecureContext;
    
    console.log('🔔 [OneSignal] Support check:', {
      isMobile,
      hasServiceWorker,
      hasNotification,
      hasSecureContext,
      supported,
      userAgent: navigator.userAgent
    });
    
    return supported;
  }
};
