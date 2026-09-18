import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// `pnpm dev` runs against the emulators under the fake "demo-komplett" project; production
// builds read the real web app config from VITE_FIREBASE_* (see .env.example).
const useEmulators = import.meta.env.DEV;

const app = initializeApp(
  useEmulators
    ? { apiKey: "demo", authDomain: "localhost", projectId: "demo-komplett", appId: "demo" }
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      },
);

export const auth = getAuth(app);
// IndexedDB cache is the offline store; multi-tab so two tabs of one browser share it.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (useEmulators) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
}
