

const CACHE_NAME = 'rafiei-academy-v4';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
  '/lovable-uploads/3e31ce9b-58ae-45b0-9eb0-ffe088c9b64e.png',
  '/lovable-uploads/d03b7d97-8f42-4806-a04a-add408342460.png',
  '/lovable-uploads/6ee3e71a-c27b-49b7-b51c-14ce664d8043.png',
  '/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png',
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css'
];

// Enhanced push notification handling
self.addEventListener('push', function(event) {
  console.log('🔔 Push event received:', event);
  
  if (!event.data) {
    console.log('❌ No push data received');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
    console.log('🔔 Push data parsed:', notificationData);
  } catch (e) {
    console.error('❌ Error parsing push data:', e);
    // Fallback notification
    notificationData = {
      title: 'پیام جدید',
      body: event.data.text() || 'شما پیام جدیدی دریافت کرده‌اید',
      url: '/hub/messenger',
      icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png'
    };
  }

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
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
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

  console.log('🔔 Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'پیام جدید', 
      options
    ).then(() => {
      console.log('✅ Notification displayed successfully');
    }).catch((error) => {
      console.error('❌ Failed to show notification:', error);
    })
  );
});

// Enhanced notification action handling
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification click received:', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/hub/messenger';
  const messageId = event.notification.data?.messageId;
  const senderId = event.notification.data?.senderId;
  
  if (event.action === 'reply') {
    console.log('💬 Reply action clicked');
    // Handle reply action - for now just open the messenger with focus on reply
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then(function(clientList) {
          const targetUrl = `${url}${url.includes('?') ? '&' : '?'}reply=${messageId || ''}`;
          
          // Try to find existing messenger window
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
          
          // Open new window if no existing messenger found
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        }).catch((error) => {
          console.error('❌ Error handling reply action:', error);
        })
    );
  } else {
    console.log('👀 View/default action clicked');
    // Default click or view action
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then(function(clientList) {
          // Try to find existing messenger window
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
          
          // Open new window if no existing messenger found
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        }).catch((error) => {
          console.error('❌ Error handling view action:', error);
        })
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', function(event) {
  console.log('🔄 Background sync event:', event.tag);
  
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-push-subscription') {
    event.waitUntil(syncPushSubscription());
  }
});

async function syncMessages() {
  console.log('🔄 Syncing messages in background');
  try {
    // This could be used for background message syncing when back online
    // For now, just log that sync is happening
    console.log('📱 Background message sync completed');
  } catch (error) {
    console.error('❌ Background message sync failed:', error);
  }
}

async function syncPushSubscription() {
  console.log('🔄 Syncing push subscription in background');
  try {
    // This will be handled by the main app when it comes back online
    console.log('🔔 Push subscription sync completed');
  } catch (error) {
    console.error('❌ Push subscription sync failed:', error);
  }
}

// Install and cache management
self.addEventListener('install', function(event) {
  console.log('🔧 Service worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Caching app resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service worker installed successfully');
      })
      .catch((error) => {
        console.error('❌ Service worker install failed:', error);
      })
  );
});

// Fetch event for offline functionality
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          console.log('📦 Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('🌐 Fetching from network:', event.request.url);
        return fetch(event.request).catch((error) => {
          console.error('❌ Network fetch failed:', error);
          throw error;
        });
      })
  );
});

// Activate event for cache cleanup
self.addEventListener('activate', function(event) {
  console.log('🔧 Service worker activating');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service worker activated successfully');
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', function(event) {
  console.log('📨 Message received in service worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

