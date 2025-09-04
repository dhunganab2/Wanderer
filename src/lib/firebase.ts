// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWTPpdmE_vLEeDblFM1_ELxcdOIj68IuQ",
  authDomain: "travel-companion-732e9.firebaseapp.com",
  projectId: "travel-companion-732e9",
  storageBucket: "travel-companion-732e9.firebasestorage.app",
  messagingSenderId: "298377672317",
  appId: "1:298377672317:web:669c6a4d096727c59fe314",
  measurementId: "G-BQBK35232B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
