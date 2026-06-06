// Firebase configuration for Phone Authentication

import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
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
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

// Check if Firebase is properly configured (not using placeholder/empty values)
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey.length > 10 &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId.length > 3
);

// Export the config for FirebaseRecaptchaVerifierModal
export const getFirebaseConfig = () => firebaseConfig;

// Initialize Firebase app immediately on module load (singleton)
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

// Only initialize on client side and when configured
const isSSR = Platform.OS === "web" && typeof window === "undefined";

// IMMEDIATE INITIALIZATION - This must happen before expo-firebase-recaptcha loads
if (!isSSR && isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log("[Firebase] App initialized immediately on module load");
    } else {
      firebaseApp = getApp();
      console.log("[Firebase] Using existing app");
    }
    
    // Also initialize auth immediately
    firebaseAuth = getAuth(firebaseApp);
    firebaseAuth.useDeviceLanguage();
  } catch (error) {
    console.error("[Firebase] Initialization error:", error);
  }
}

// Function to ensure Firebase is initialized (now a no-op since we initialize immediately)
export function ensureFirebaseInitialized(): FirebaseApp | null {
  return firebaseApp;
}

// Function to get Firebase Auth
export function getFirebaseAuth(): Auth | null {
  return firebaseAuth;
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
