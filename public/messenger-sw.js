const CACHE_NAME = 'rafiei-messenger-v1';
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/messenger-manifest.json',
  '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Error parsing push data:', error);
    data = {
      title: 'پیام جدید',
      body: 'پیام جدیدی دریافت کرده‌اید',
      icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png'
    };
  }

  const title = data.title || 'پیام‌رسان رفیعی';
  const options = {
    body: data.body || 'پیام جدیدی دریافت کرده‌اید',
    icon: data.icon || '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
    badge: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
    data: data.data || {},
    tag: data.tag || 'message',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      {
        action: 'view',
        title: 'مشاهده',
        icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png'
      },
      {
        action: 'reply',
        title: 'پاسخ سریع',
        icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'reply') {
    // Handle quick reply action
    event.waitUntil(
      clients.openWindow('/?action=reply&data=' + encodeURIComponent(JSON.stringify(event.notification.data)))
    );
  } else {
    // Default action or 'view' action
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: event.notification.data
            });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Background sync for messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-push-subscription') {
    event.waitUntil(syncPushSubscription());
  }
});

// Handle fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync functions
function syncMessages() {
  // Implement message syncing logic here
  console.log('Syncing messages in background');
}

function syncPushSubscription() {
  // Implement push subscription syncing logic here
  console.log('Syncing push subscription');
}