import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import dotenv from 'dotenv';

dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCh-VRUsmkM61tSuxu6NaKhQDhIJTt3HNo",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "wanderer-8ecac.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "wanderer-8ecac",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "wanderer-8ecac.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "441088789276",
  appId: process.env.FIREBASE_APP_ID || "1:441088789276:web:5922cf14a6a5be961808d9",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-0M8HXZPRH8"
};

// Initialize Firebase Admin (for backend)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    // Only connect if not already connected
    if (!db._delegate._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('🔧 Connected to Firebase emulators');
    }
  } catch (error) {
    console.log('📝 Firebase emulators not running, using production');
  }
}

export default app;
