// Firebase configuration for Phone Authentication
// Replace placeholder values with your Firebase project credentials

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  ConfirmationResult,
  RecaptchaVerifier,
} from "firebase/auth";
import { Platform } from "react-native";

// ============================================================
// FIREBASE CONFIGURATION - REPLACE WITH YOUR CREDENTIALS
// ============================================================
// Get these from Firebase Console:
// 1. Go to https://console.firebase.google.com/
// 2. Select your project (or create one)
// 3. Click the gear icon > Project Settings
// 4. Scroll to "Your apps" section
// 5. Add a Web app if you haven't, then copy config
// ============================================================

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Check if Firebase is properly configured (not using placeholder values)
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
);

// Initialize Firebase app (singleton)
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

// Only initialize on client side and when configured
const isSSR = Platform.OS === "web" && typeof window === "undefined";

if (!isSSR && isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
    firebaseAuth = getAuth(firebaseApp);
    
    // Set language to device language
    if (firebaseAuth) {
      firebaseAuth.useDeviceLanguage();
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

export const firebase = firebaseApp;
export const auth = firebaseAuth;

// Export auth utilities
export {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
};
export type { ConfirmationResult };
