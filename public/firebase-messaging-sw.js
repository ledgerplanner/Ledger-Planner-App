importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// === FIREBASE CONFIGURATION ===
// Replace these placeholders with your Firebase project credentials if needed
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase inside the background service worker
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// === BACKGROUND MESSAGE RECEIVER ===
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title || "Ledger Planner Update";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "You have a new alert in your financial vault.",
    icon: payload.notification?.icon || payload.data?.icon || "/login-logo.png",
    badge: "/login-logo.png",
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
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
