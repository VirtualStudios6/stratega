import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { initializeFirestore, persistentLocalCache } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

// Offline persistence: la app funciona sin conexión y sincroniza al reconectar.
// Fallback a configuración básica si persistentLocalCache falla en el WebView
// (puede ocurrir en algunos dispositivos Android con IndexedDB restringido).
let db
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache() })
} catch {
  db = initializeFirestore(app, {})
}
export { db }

export const storage = getStorage(app)
