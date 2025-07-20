
// Enhanced OneSignal SDK Loader with robust error handling
export class EnhancedOneSignalLoader {
  private static instance: EnhancedOneSignalLoader;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<boolean> | null = null;
  
  // Multiple CDN sources for reliability
  private readonly cdnSources = [
    'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js',
    'https://unpkg.com/@onesignal/web@16/build/OneSignalSDK.page.js'
  ];

  static getInstance(): EnhancedOneSignalLoader {
    if (!EnhancedOneSignalLoader.instance) {
      EnhancedOneSignalLoader.instance = new EnhancedOneSignalLoader();
    }
    return EnhancedOneSignalLoader.instance;
  }

  async loadOneSignalSDK(): Promise<boolean> {
    if (this.isLoaded) {
      console.log('✅ [OneSignal Loader] SDK already loaded');
      return true;
    }

    if (this.isLoading && this.loadPromise) {
      console.log('⏳ [OneSignal Loader] SDK loading in progress, waiting...');
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this.attemptSDKLoad();
    
    try {
      const result = await this.loadPromise;
      this.isLoaded = result;
      return result;
    } catch (error) {
      console.error('❌ [OneSignal Loader] Failed to load SDK:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  private async attemptSDKLoad(): Promise<boolean> {
    // Check if already loaded
    if (typeof window.OneSignal !== 'undefined') {
      console.log('✅ [OneSignal Loader] SDK already exists in window');
      return true;
    }

    // Check network connectivity
    if (!navigator.onLine) {
      console.warn('🌐 [OneSignal Loader] No network connection');
      return false;
    }

    // Try each CDN source with retry logic
    for (let cdnIndex = 0; cdnIndex < this.cdnSources.length; cdnIndex++) {
      const cdnUrl = this.cdnSources[cdnIndex];
      console.log(`🔄 [OneSignal Loader] Attempting to load from CDN ${cdnIndex + 1}:`, cdnUrl);
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const success = await this.loadFromCDN(cdnUrl, attempt);
          if (success) {
            console.log(`✅ [OneSignal Loader] Successfully loaded from CDN ${cdnIndex + 1} on attempt ${attempt}`);
            return true;
          }
        } catch (error) {
          console.warn(`⚠️ [OneSignal Loader] CDN ${cdnIndex + 1} attempt ${attempt} failed:`, error);
          
          // Wait before retry (exponential backoff)
          if (attempt < 3) {
            await this.delay(1000 * Math.pow(2, attempt - 1));
          }
        }
      }
    }

    console.error('❌ [OneSignal Loader] All CDN sources failed');
    return false;
  }

  private async loadFromCDN(url: string, attempt: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.defer = true;
      
      // Set timeout for each attempt
      const timeout = setTimeout(() => {
        document.head.removeChild(script);
        reject(new Error(`Timeout loading OneSignal SDK (attempt ${attempt})`));
      }, 10000); // 10 second timeout

      script.onload = () => {
        clearTimeout(timeout);
        console.log(`📦 [OneSignal Loader] Script loaded from ${url}`);
        
        // Wait for OneSignal to be available
        this.waitForOneSignal().then((available) => {
          if (available) {
            resolve(true);
          } else {
            reject(new Error('OneSignal not available after script load'));
          }
        });
      };

      script.onerror = (error) => {
        clearTimeout(timeout);
        document.head.removeChild(script);
        reject(new Error(`Failed to load script from ${url}: ${error}`));
      };

      document.head.appendChild(script);
    });
  }

  private async waitForOneSignal(maxWait: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (typeof window.OneSignal !== 'undefined') {
        console.log('✅ [OneSignal Loader] OneSignal is now available');
        return true;
      }
      await this.delay(100);
    }
    
    console.warn('⚠️ [OneSignal Loader] OneSignal not available after waiting');
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isSDKLoaded(): boolean {
    return this.isLoaded && typeof window.OneSignal !== 'undefined';
  }

  async forceReloadSDK(): Promise<boolean> {
    console.log('🔄 [OneSignal Loader] Force reloading SDK...');
    
    // Reset internal state
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
    
    // Remove existing OneSignal scripts
    const existingScripts = document.querySelectorAll('script[src*="OneSignal"]');
    existingScripts.forEach(script => {
      const scriptElement = script as HTMLScriptElement;
      console.log('🗑️ [OneSignal Loader] Removing existing script:', scriptElement.src);
      script.remove();
    });
    
    // Clear OneSignal from window
    if (window.OneSignal) {
      delete window.OneSignal;
    }
    if (window.OneSignalDeferred) {
      delete window.OneSignalDeferred;
    }
    
    // Wait a bit for cleanup
    await this.delay(500);
    
    // Load SDK again
    return this.loadOneSignalSDK();
  }

  getLoadingStatus(): { isLoaded: boolean; isLoading: boolean } {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading
    };
  }
}

export const enhancedOneSignalLoader = EnhancedOneSignalLoader.getInstance();
