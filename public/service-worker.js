/* eslint-disable no-restricted-globals */

// This is the "Landing Pad" that Create React App requires 
// to satisfy the build engine, even if we use our own logic.
// @ts-ignore
const manifest = self.__WB_MANIFEST; 

const CACHE_NAME = 'ledger-planner-cache-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/app-icon.png',
  '/login-logo.png',
  '/manifest.json'
];

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

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).then(response => {
          if(!response || response.status !== 200 || response.type !== 'basic') return response;
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return response;
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});
