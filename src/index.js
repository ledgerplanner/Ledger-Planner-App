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

// === MASTER PWA OFFLINE ENGINE & FCM PUSH BRIDGE ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        // Check for updates periodically when the app is running
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available; smooth refresh applies modern assets
                console.log('[Service Worker] New Ledger Planner version detected.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[Service Worker] Master registration failed:', error);
      });
  });
}
