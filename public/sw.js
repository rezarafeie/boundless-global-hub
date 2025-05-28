
const CACHE_NAME = 'rafiei-academy-v2';
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
