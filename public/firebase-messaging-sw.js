importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDRtXAjd-2KpZOlQL-bWrGoz6S3HuK4jDI",
  authDomain: "ledger-planner-38ab7.firebaseapp.com",
  projectId: "ledger-planner-38ab7",
  storageBucket: "ledger-planner-38ab7.firebasestorage.app",
  messagingSenderId: "624261529539",
  appId: "1:624261529539:web:80aec4cca266a3a6008776"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/app-icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
