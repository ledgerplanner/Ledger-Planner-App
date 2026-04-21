// === LEDGER PLANNER OFFLINE ENGINE ===
const CACHE_NAME = 'ledger-planner-cache-v1';

// The essential files to cache instantly upon first load
const urlsToCache = [
  '/',
  '/index.html',
  '/app-icon.png',
  '/login-logo.png',
  '/manifest.json'
];

// 1. INSTALLATION: The moment the app loads, cache the core files.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Vault Cache Opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 2. INTERCEPTION: If the network dies, serve from the cache.
self.addEventListener('fetch', event => {
  // Only intercept requests from our own domain (ignore external APIs/Firebase)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit! Return the cached file (Works offline)
        if (response) {
          return response;
        }

        // If not in cache, fetch from network
        return fetch(event.request).then(
          function(response) {
            // Ensure response is valid before caching
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream that can only be consumed once
            var responseToCache = response.clone();

            // Save the new file to the cache for next time
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// 3. ACTIVATION: Clean up old caches if we update the version number.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
