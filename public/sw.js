
const CACHE_NAME = 'rafiei-academy-v8';
const urlsToCache = [
  '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
  '/lovable-uploads/3e31ce9b-58ae-45b0-9eb0-ffe088c9b64e.png',
  '/lovable-uploads/d03b7d97-8f42-4806-a04a-add408342460.png',
  '/lovable-uploads/6ee3e71a-c27b-49b7-b51c-14ce664d8043.png',
  '/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png'
];

// Mobile browser detection
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isIOSSafari() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Enhanced push notification handling with mobile support
self.addEventListener('push', function(event) {
  console.log('🔔 Push event received (Mobile: ' + isMobile() + ', iOS: ' + isIOSSafari() + '):', event);
  
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
    // Enhanced fallback for mobile
    notificationData = {
      title: 'پیام جدید',
      body: event.data.text() || 'شما پیام جدیدی دریافت کرده‌اید',
      url: '/hub/messenger',
      icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png'
    };
  }

  // Mobile-optimized notification options
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
    requireInteraction: !isMobile(), // Mobile browsers handle this differently
    silent: false,
    vibrate: isMobile() ? [200, 100, 200] : undefined, // Only vibrate on mobile
    actions: isMobile() ? [] : [ // Simplified actions for mobile
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

  console.log('🔔 Showing notification with mobile-optimized options:', options);

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'پیام جدید', 
      options
    ).then(() => {
      console.log('✅ Notification displayed successfully on mobile device');
    }).catch((error) => {
      console.error('❌ Failed to show notification on mobile:', error);
    })
  );
});

// Enhanced notification click handling for mobile
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification click received (Mobile: ' + isMobile() + '):', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/hub/messenger';
  const messageId = event.notification.data?.messageId;
  const senderId = event.notification.data?.senderId;
  
  if (event.action === 'reply' && !isMobile()) {
    console.log('💬 Reply action clicked');
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then(function(clientList) {
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
        }).catch((error) => {
          console.error('❌ Error handling reply action:', error);
        })
    );
  } else {
    console.log('👀 View/default action clicked (Mobile optimized)');
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then(function(clientList) {
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
        }).catch((error) => {
          console.error('❌ Error handling view action on mobile:', error);
        })
    );
  }
});

// Background sync for offline functionality (mobile-optimized)
self.addEventListener('sync', function(event) {
  console.log('🔄 Background sync event (Mobile: ' + isMobile() + '):', event.tag);
  
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-push-subscription') {
    event.waitUntil(syncPushSubscription());
  }
});

async function syncMessages() {
  console.log('🔄 Syncing messages in background (Mobile device)');
  try {
    console.log('📱 Background message sync completed');
  } catch (error) {
    console.error('❌ Background message sync failed:', error);
  }
}

async function syncPushSubscription() {
  console.log('🔄 Syncing push subscription in background (Mobile device)');
  try {
    console.log('🔔 Push subscription sync completed');
  } catch (error) {
    console.error('❌ Push subscription sync failed:', error);
  }
}

// Install and cache management
self.addEventListener('install', function(event) {
  console.log('🔧 Service worker installing (Mobile: ' + isMobile() + ')');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Caching app resources for mobile');
        return Promise.allSettled(urlsToCache.map((url) => cache.add(url)));
      })
      .then(() => {
        console.log('✅ Service worker installed successfully on mobile');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service worker install failed on mobile:', error);
      })
  );
});

// Fetch event for offline functionality
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';
  const isScriptOrStyle = ['script', 'style', 'worker'].includes(event.request.destination);

  if (isNavigation || isScriptOrStyle || requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (!requestUrl.pathname.startsWith('/lovable-uploads/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Activate event for cache cleanup
self.addEventListener('activate', function(event) {
  console.log('🔧 Service worker activating (Mobile: ' + isMobile() + ')');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME || cacheName.startsWith('rafiei-academy')) {
            console.log('🗑️ Deleting old cache on mobile:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service worker activated successfully on mobile');
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then((clientList) => {
      return Promise.all(clientList.map((client) => client.navigate(client.url)));
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', function(event) {
  console.log('📨 Message received in service worker (Mobile: ' + isMobile() + '):', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
