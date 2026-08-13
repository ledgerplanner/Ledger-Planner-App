import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// === PWA OFFLINE ENGINE & FCM NOTIFICATION BRIDGES ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 1. REGISTER PWA OFFLINE VAULT WORKER
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[Service Worker] Vault secured. Offline routing active. Scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[Service Worker] Offline forge failed:', error);
      });

    // 2. REGISTER FCM BACKGROUND PUSH NOTIFICATION WORKER
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('[FCM Service Worker] Push notification channel live. Scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[FCM Service Worker] Push channel registration failed:', error);
      });
  });
}
