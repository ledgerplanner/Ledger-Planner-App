import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDRtXAjd-2KpZOlQL-bWrGoz6S3HuK4jDI",
  authDomain: "ledger-planner-38ab7.firebaseapp.com",
  projectId: "ledger-planner-38ab7",
  storageBucket: "ledger-planner-38ab7.firebasestorage.app",
  messagingSenderId: "624261529539",
  appId: "1:624261529539:web:80aec4cca266a3a6008776"
};

// 1. Initialize Firebase Core Engine
const app = initializeApp(firebaseConfig);

// 2. Authentication System
const auth = getAuth(app);

// 3. Modern Multi-Tab Offline Persistence Database Engine
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// 4. Safe Cloud Messaging Bridge (Protected Against Private Browser Crashes)
let messaging = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    })
    .catch(() => {
      messaging = null;
    });
}

// 5. Official Public VAPID Key Export
const VAPID_KEY = "BDubfUXfP5DhFRpZ5ZwQp0o88f2avvtfu0rfFr9ySjHgTZmQ4gsr0GWzE-cJQxgbwq93GlgcCc5ip6KksvngmXY";

export { auth, db, messaging, VAPID_KEY };
