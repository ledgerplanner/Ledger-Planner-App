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

// === PWA OFFLINE ENGINE (THE HEARTBEAT) ===
// This block wakes up the Service Worker we forged, allowing the app 
// to be installed on mobile devices and survive zero-bar environments.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('[Service Worker] Vault secured. Offline routing active. Scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[Service Worker] Offline forge failed:', error);
      });
  });
}
