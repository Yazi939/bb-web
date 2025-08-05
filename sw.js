const CACHE_NAME = 'bunker-boats-v2.2.0-responsive-fix';
const urlsToCache = [
  '/',
  './main.js',
  './main.css',
  './manifest-web.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

self.addEventListener('install', function(event) {
  // Принудительная активация нового SW
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
  // Принудительное управление всеми клиентами
  event.waitUntil(
    clients.claim().then(() => {
      // Удаляем старые кэши
      return caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      });
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Возвращаем кэшированную версию или загружаем из сети
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Обновление манифеста
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 