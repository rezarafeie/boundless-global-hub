
const CACHE_NAME = 'rafiei-academy-v3';
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

// Push notification handling
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('No push data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    console.error('Error parsing push data:', e);
    notificationData = {
      title: 'پیام جدید',
      body: event.data.text() || 'شما پیام جدیدی دریافت کرده‌اید',
      url: '/hub/messenger'
    };
  }

  const options = {
    body: notificationData.body,
    icon: '/lovable-uploads/10f756a4-56ae-4a72-9b78-749f6440ccbc.png',
    badge: '/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png',
    data: {
      url: notificationData.url || '/hub/messenger',
      messageId: notificationData.messageId,
      senderId: notificationData.senderId
    },
    tag: 'message-notification',
    requireInteraction: true,
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

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle notification action clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/hub/messenger';
  
  if (event.action === 'reply') {
    // Handle reply action - for now just open the messenger
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then(function(clientList) {
          const targetUrl = `${url}?reply=${event.notification.data?.messageId || ''}`;
          
          for (const client of clientList) {
            if (client.url.includes('/hub/messenger') && 'focus' in client) {
              client.postMessage({ 
                type: 'NOTIFICATION_REPLY', 
                messageId: event.notification.data?.messageId,
                senderId: event.notification.data?.senderId 
              });
              return client.focus();
            }
          }
          
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  } else {
    // Default click or view action
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then(function(clientList) {
          for (const client of clientList) {
            if (client.url.includes('/hub/messenger') && 'focus' in client) {
              client.postMessage({ 
                type: 'NOTIFICATION_CLICK', 
                url: url,
                messageId: event.notification.data?.messageId,
                senderId: event.notification.data?.senderId 
              });
              return client.focus();
            }
          }
          
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Background sync for push subscription
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-push-subscription') {
    event.waitUntil(syncPushSubscription());
  }
});

async function syncPushSubscription() {
  try {
    console.log('Syncing push subscription...');
    // This will be handled by the main app when it comes back online
  } catch (error) {
    console.error('Error syncing push subscription:', error);
  }
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

async function syncMessages() {
  // This could be used for background message syncing when back online
  console.log('Background sync: checking for new messages');
}
