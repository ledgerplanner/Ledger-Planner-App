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

// Initialize Firebase inside the background service worker
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// === BACKGROUND MESSAGE RECEIVER ===
// Ensures visual delivery for both data-only and notification payloads
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Ledger Planner';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new update in your financial vault.',
    icon: payload.notification?.icon || payload.data?.icon || '/login-logo.png',
    badge: '/login-logo.png',
    data: payload.data || {},
    tag: payload.data?.tag || `lp-notification-${Date.now()}`,
    renotify: true
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// === NOTIFICATION CLICK & NAVIGATION RELAY ===
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickData = event.notification.data || {};
  const targetUrl = clickData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus and navigate it
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

      // If the app is fully closed, launch a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
