const CACHE_NAME = 'rafiei-messenger-v1';
const urlsToCache = [
  '/',
  '/hub/messenger',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install the service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'پیام جدید',
        body: 'شما پیام جدیدی دارید',
        icon: '/messenger-icon-192.png',
        badge: '/messenger-icon-192.png'
      };
    }
  }

  const title = data.title || 'پیام جدید';
  const options = {
    body: data.body || 'شما پیام جدیدی دارید',
    icon: data.icon || '/messenger-icon-192.png',
    badge: data.badge || '/messenger-icon-192.png',
    tag: 'messenger-notification',
    dir: 'rtl',
    lang: 'fa',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'reply',
        title: 'پاسخ',
        icon: '/messenger-icon-192.png'
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
    // Open messenger with reply action
    event.waitUntil(
      clients.openWindow('/hub/messenger?action=reply&data=' + encodeURIComponent(JSON.stringify(event.notification.data)))
    );
  } else {
    // Regular notification click - open messenger
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/hub/messenger') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/hub/messenger');
        }
      })
    );
  }
});

// Background sync for offline message sending
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  }
  if (event.tag === 'background-sync-push-subscription') {
    event.waitUntil(syncPushSubscription());
  }
});

function syncMessages() {
  // Implementation for syncing offline messages when connection is restored
}

function syncPushSubscription() {
  // Implementation for syncing push subscription with server
}

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
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