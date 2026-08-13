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
// Native FCM handles notification rendering to avoid duplicate alerts.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);
});

// === NOTIFICATION CLICK & NAVIGATION RELAY ===
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickData = event.notification.data || {};

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing open window if available and send the payload data
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            data: clickData
          });
          return;
        }
      }
      // Open a fresh window if the application is currently closed
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
