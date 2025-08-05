const CACHE_NAME = 'bunker-boats-v2.2.1-responsive-complete';
const urlsToCache = [
  '/',
  './index.html',
  './main.js',
  './main.css',
  './react-vendor.js',
  './antd-vendor.js',
  './utils-vendor.js',
  './manifest-web.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './favicon.ico',
  // Responsive CSS files
  './tablet-fixes.css',
  './global-responsive-fixes.css',
  './fuel-trading-tablet-fixes.css',
  './additional-components-responsive.css',
  // Device detection
  './device-detection.js'
];

self.addEventListener('install', function(event) {
  // Принудительная активация нового SW
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Caching PWA resources...');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('Failed to cache resources:', error);
      })
  );
});

self.addEventListener('activate', function(event) {
  // Принудительное управление всеми клиентами
  event.waitUntil(
    clients.claim().then(() => {
      console.log('PWA Service Worker activated');
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
        
        // Для критически важных ресурсов используем network-first стратегию
        return fetch(event.request)
          .then(function(response) {
            // Проверяем что ответ валидный
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ для кэширования
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(function() {
            // Fallback для offline режима
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Обновление манифеста
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 