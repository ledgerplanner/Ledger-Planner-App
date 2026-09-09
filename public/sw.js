// === LEDGER PLANNER DECOMMISSIONING ENGINE ===
// Silently removes the legacy worker and transfers control to the master helper

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // 1. Remove all old cached files from this legacy worker
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('ledger-planner-cache'))
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      // 2. Unregister this legacy worker so it stops running in the background
      return self.registration.unregister();
    }).then(() => {
      // 3. Take control of existing open tabs to finalize the transition
      return self.clients.claim();
    })
  );
});
