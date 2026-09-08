importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// === OFFICIAL FIREBASE CONFIGURATION ===
const firebaseConfig = {
  apiKey: "AIzaSyDRtXAjd-2KpZOlQL-bWrGoz6S3HuK4jDI",
  authDomain: "ledger-planner-38ab7.firebaseapp.com",
  projectId: "ledger-planner-38ab7",
  storageBucket: "ledger-planner-38ab7.firebasestorage.app",
  messagingSenderId: "624261529539",
  appId: "1:624261529539:web:80aec4cca266a3a6008776"
};

// Initialize Firebase inside the master background helper
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// === OFFLINE ENGINE CACHE CONFIGURATION ===
const CACHE_NAME = 'ledger-planner-vault-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/app-icon.png',
  '/login-logo.png',
  '/manifest.json'
];

// 1. INSTALL & PRE-CACHE CORE ASSETS
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 2. CLEAN UP RETIRED CACHES & CLAIM CONTROL
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. OFFLINE FETCH ROUTER
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});

// 4. BACKGROUND MESSAGE RECEIVER (DUPLICATE-PROTECTED)
messaging.onBackgroundMessage((payload) => {
  // If the browser already rendered a visual notification payload, do not display a duplicate
  if (payload.notification && payload.notification.title) {
    return;
  }

  const notificationTitle = payload.data?.title || 'Ledger Planner';
  const notificationBody = payload.data?.body || 'You have a new update in your financial vault.';
  const notificationTag = payload.data?.tag || payload.data?.billId || 'ledger-planner-alert';

  const notificationOptions = {
    body: notificationBody,
    icon: payload.data?.icon || '/login-logo.png',
    badge: '/login-logo.png',
    data: payload.data || {},
    tag: notificationTag,
    renotify: false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 5. NOTIFICATION CLICK & NAVIGATION RELAY
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickData = event.notification.data || {};
  const targetUrl = clickData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          client.postMessage({ data: clickData });
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
