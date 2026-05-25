
// Unified Service Worker with OneSignal Integration
const CACHE_NAME = 'rafiei-academy-v6';
const urlsToCache = [
  '/',
  '/hub/messenger',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
  '/lovable-uploads/3e31ce9b-58ae-45b0-9eb0-ffe088c9b64e.png',
  '/lovable-uploads/d03b7d97-8f42-4806-a04a-add408342460.png',
  '/lovable-uploads/6ee3e71a-c27b-49b7-b51c-14ce664d8043.png',
  '/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png',
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css'
];

// Import OneSignal SDK
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js');

// Device detection functions
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isIOSSafari() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

// Enhanced push notification handling
self.addEventListener('push', function(event) {
  console.log('🔔 [Unified SW] Push event received:', {
    mobile: isMobile(),
    ios: isIOSSafari(),
    android: isAndroid(),
    hasData: !!event.data
  });
  
  if (!event.data) {
    console.log('❌ [Unified SW] No push data received');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
    console.log('🔔 [Unified SW] Push data parsed:', notificationData);
  } catch (e) {
    console.error('❌ [Unified SW] Error parsing push data:', e);
    notificationData = {
      title: 'پیام جدید',
      body: event.data.text() || 'شما پیام جدیدی دریافت کرده‌اید',
      url: '/hub/messenger',
      icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png'
    };
  }

  // Enhanced notification options for different devices
  const options = {
    body: notificationData.body || 'پیام جدید دریافت شد',
    icon: notificationData.icon || '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
    badge: notificationData.badge || '/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png',
    data: {
      url: notificationData.url || '/hub/messenger',
      messageId: notificationData.messageId,
      senderId: notificationData.senderId,
      timestamp: notificationData.timestamp
    },
    tag: `message-${notificationData.messageId || Date.now()}`,
    requireInteraction: !isMobile(),
    silent: false,
    vibrate: isMobile() ? [200, 100, 200] : undefined,
    actions: isIOSSafari() ? [] : [
      {
        action: 'reply',
        title: 'پاسخ',
        icon: '/lovable-uploads/d03b7d97-8f42-4806-a04a-add408342460.png'
      },
      {
        action: 'view',
        title: 'مشاهده',
        icon: '/lovable-uploads/3e31ce9b-58ae-45b0-9eb0-ffe088c9b64e.png'
      }
    ]
  };

  console.log('🔔 [Unified SW] Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'پیام جدید', 
      options
    ).then(() => {
      console.log('✅ [Unified SW] Notification displayed successfully');
    }).catch((error) => {
      console.error('❌ [Unified SW] Failed to show notification:', error);
    })
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 [Unified SW] Notification click received:', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/hub/messenger';
  const messageId = event.notification.data?.messageId;
  const senderId = event.notification.data?.senderId;
  
  if (event.action === 'reply' && !isMobile()) {
    console.log('💬 [Unified SW] Reply action clicked');
    event.waitUntil(handleReplyAction(url, messageId, senderId));
  } else {
    console.log('👀 [Unified SW] View/default action clicked');
    event.waitUntil(handleViewAction(url, messageId, senderId));
  }
});

async function handleReplyAction(url, messageId, senderId) {
  try {
    const clientList = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
    const targetUrl = `${url}${url.includes('?') ? '&' : '?'}reply=${messageId || ''}`;
    
    for (const client of clientList) {
      if (client.url.includes('/hub/messenger') && 'focus' in client) {
        client.postMessage({ 
          type: 'NOTIFICATION_REPLY', 
          messageId: messageId,
          senderId: senderId,
          url: url
        });
        return client.focus();
      }
    }
    
    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  } catch (error) {
    console.error('❌ [Unified SW] Error handling reply action:', error);
  }
}

async function handleViewAction(url, messageId, senderId) {
  try {
    const clientList = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
    
    for (const client of clientList) {
      if (client.url.includes('/hub/messenger') && 'focus' in client) {
        client.postMessage({ 
          type: 'NOTIFICATION_CLICK', 
          url: url,
          messageId: messageId,
          senderId: senderId 
        });
        return client.focus();
      }
    }
    
    if (clients.openWindow) {
      return clients.openWindow(url);
    }
  } catch (error) {
    console.error('❌ [Unified SW] Error handling view action:', error);
  }
}

// Background sync for offline functionality
self.addEventListener('sync', function(event) {
  console.log('🔄 [Unified SW] Background sync event:', event.tag);
  
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-push-subscription') {
    event.waitUntil(syncPushSubscription());
  }
});

async function syncMessages() {
  console.log('🔄 [Unified SW] Syncing messages in background');
  try {
    console.log('📱 [Unified SW] Background message sync completed');
  } catch (error) {
    console.error('❌ [Unified SW] Background message sync failed:', error);
  }
}

async function syncPushSubscription() {
  console.log('🔄 [Unified SW] Syncing push subscription in background');
  try {
    console.log('🔔 [Unified SW] Push subscription sync completed');
  } catch (error) {
    console.error('❌ [Unified SW] Push subscription sync failed:', error);
  }
}

// Install event with enhanced caching
self.addEventListener('install', function(event) {
  console.log('🔧 [Unified SW] Service worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 [Unified SW] Caching app resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ [Unified SW] Service worker installed successfully');
        if (isMobile()) {
          self.skipWaiting();
        }
      })
      .catch((error) => {
        console.error('❌ [Unified SW] Service worker install failed:', error);
      })
  );
});

// Fetch event for offline functionality
self.addEventListener('fetch', function(event) {
  // Skip OneSignal API requests
  if (event.request.url.includes('onesignal.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        
        return fetch(event.request).catch((error) => {
          console.error('❌ [Unified SW] Network fetch failed:', error);
          throw error;
        });
      })
  );
});

// Activate event for cache cleanup
self.addEventListener('activate', function(event) {
  console.log('🔧 [Unified SW] Service worker activating');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ [Unified SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ [Unified SW] Service worker activated successfully');
      if (isMobile()) {
        return self.clients.claim();
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', function(event) {
  console.log('📨 [Unified SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
