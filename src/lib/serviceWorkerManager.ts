
// Service Worker Manager for unified SW registration
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private isRegistered = false;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async registerUnifiedServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('🚫 [SW Manager] Service Worker not supported');
      return null;
    }

    if (this.isRegistered && this.registration) {
      console.log('✅ [SW Manager] Service Worker already registered');
      return this.registration;
    }

    try {
      console.log('🔧 [SW Manager] Registering unified service worker...');
      
      // Unregister existing OneSignal service workers
      await this.unregisterOneSignalWorkers();
      
      // Register the unified service worker
      this.registration = await navigator.serviceWorker.register('/unified-sw.js', {
        scope: '/'
      });

      console.log('✅ [SW Manager] Unified service worker registered successfully');
      this.isRegistered = true;

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        console.log('🔄 [SW Manager] Service worker update found');
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 [SW Manager] New service worker installed, reloading...');
              window.location.reload();
            }
          });
        }
      });

      return this.registration;
    } catch (error) {
      console.error('❌ [SW Manager] Failed to register unified service worker:', error);
      this.isRegistered = false;
      this.registration = null;
      return null;
    }
  }

  private async unregisterOneSignalWorkers(): Promise<void> {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        const scope = registration.scope;
        if (scope.includes('OneSignal') || 
            registration.active?.scriptURL.includes('OneSignal')) {
          console.log('🗑️ [SW Manager] Unregistering OneSignal worker:', scope);
          await registration.unregister();
        }
      }
    } catch (error) {
      console.warn('⚠️ [SW Manager] Could not unregister OneSignal workers:', error);
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  async clearServiceWorkerCache(): Promise<void> {
    console.log('🧹 [SW Manager] Clearing service worker cache...');
    
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ [SW Manager] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        console.log('✅ [SW Manager] All caches cleared');
      }
      
      // Also unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('🗑️ [SW Manager] Unregistering:', registration.scope);
        await registration.unregister();
      }
      
      // Reset internal state
      this.isRegistered = false;
      this.registration = null;
      
      console.log('✅ [SW Manager] Service worker cache and registrations cleared');
    } catch (error) {
      console.error('❌ [SW Manager] Error clearing cache:', error);
    }
  }

  isServiceWorkerRegistered(): boolean {
    return this.isRegistered && !!this.registration;
  }
}

export const serviceWorkerManager = ServiceWorkerManager.getInstance();
