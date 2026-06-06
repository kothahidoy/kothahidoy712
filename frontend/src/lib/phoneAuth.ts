// Phone Authentication Service using Firebase
// Handles OTP sending and verification for both users and providers

import { Platform } from "react-native";
import {
  auth,
  isFirebaseConfigured,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  ConfirmationResult,
} from "./firebase";
import { ApplicationVerifier } from "firebase/auth";

// Store confirmation result for OTP verification
let confirmationResult: ConfirmationResult | null = null;
let storedVerificationId: string | null = null;

// Demo mode OTP (for testing without Firebase)
const DEMO_OTP = "123456";

/**
 * Format phone number to E.164 format
 * @param phone - Raw phone number
 * @param countryCode - Country code (default: +91 for India)
 */
export function formatPhoneE164(phone: string, countryCode: string = "+91"): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // If already has country code, use as-is
  if (phone.startsWith("+")) {
    return phone.replace(/[^+\d]/g, "");
  }
  
  return `${countryCode}${digits}`;
}

/**
 * Send OTP to phone number
 * @param phone - Phone number (will be formatted to E.164)
 * @param recaptchaVerifier - reCAPTCHA verifier (required for web)
 * @returns Success status and any error message
 */
export async function sendOTP(
  phone: string,
  recaptchaVerifier?: ApplicationVerifier | null
): Promise<{ success: boolean; error?: string; verificationId?: string }> {
  const e164Phone = formatPhoneE164(phone);
  
  console.log("[phoneAuth] Sending OTP to:", e164Phone);
  console.log("[phoneAuth] Firebase configured:", isFirebaseConfigured);
  console.log("[phoneAuth] Has recaptcha:", !!recaptchaVerifier);
  
  // Demo mode - skip actual SMS
  if (!isFirebaseConfigured) {
    console.log("[phoneAuth] Demo mode - OTP would be:", DEMO_OTP);
    storedVerificationId = "demo-verification-id";
    return {
      success: true,
      verificationId: "demo-verification-id",
    };
  }
  
  // Firebase requires reCAPTCHA on web
  if (Platform.OS === "web" && !recaptchaVerifier) {
    return {
      success: false,
      error: "reCAPTCHA verification required",
    };
  }
  
  try {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    
    if (recaptchaVerifier) {
      // Web flow with reCAPTCHA
      confirmationResult = await signInWithPhoneNumber(
        auth,
        e164Phone,
        recaptchaVerifier
      );
      storedVerificationId = confirmationResult.verificationId;
    } else {
      // Native flow (would need react-native-firebase for full support)
      // For now, fallback to demo mode on native
      console.log("[phoneAuth] Native platform - using demo mode");
      storedVerificationId = "demo-verification-id";
      return {
        success: true,
        verificationId: "demo-verification-id",
      };
    }
    
    return {
      success: true,
      verificationId: storedVerificationId || undefined,
    };
  } catch (error: any) {
    console.error("[phoneAuth] Send OTP error:", error);
    
    // Handle specific Firebase errors
    let errorMessage = "Failed to send verification code";
    
    if (error.code === "auth/invalid-phone-number") {
      errorMessage = "Invalid phone number format";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many attempts. Please try again later";
    } else if (error.code === "auth/captcha-check-failed") {
      errorMessage = "reCAPTCHA verification failed. Please try again";
    } else if (error.code === "auth/quota-exceeded") {
      errorMessage = "SMS quota exceeded. Please try again later";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify OTP code
 * @param code - 6-digit OTP code
 * @param verificationId - Optional verification ID (uses stored one if not provided)
 * @returns Success status, user data, and any error message
 */
export async function verifyOTP(
  code: string,
  verificationId?: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  const vId = verificationId || storedVerificationId;
  
  console.log("[phoneAuth] Verifying OTP:", code);
  console.log("[phoneAuth] Verification ID:", vId?.slice(0, 20) + "...");
  
  // Demo mode verification
  if (!isFirebaseConfigured || vId === "demo-verification-id") {
    if (code === DEMO_OTP || code.length === 6) {
      console.log("[phoneAuth] Demo mode - OTP verified");
      return {
        success: true,
        user: { uid: "demo-user", phoneNumber: "demo" },
      };
    }
    return {
      success: false,
      error: "Invalid code. Demo mode uses code: " + DEMO_OTP,
    };
  }
  
  try {
    // Use confirmationResult if available (web flow)
    if (confirmationResult) {
      const result = await confirmationResult.confirm(code);
      confirmationResult = null; // Clear after use
      storedVerificationId = null;
      
      return {
        success: true,
        user: result.user,
      };
    }
    
    // Use PhoneAuthProvider credential if we have verification ID
    if (vId && auth) {
      const credential = PhoneAuthProvider.credential(vId, code);
      const result = await signInWithCredential(auth, credential);
      storedVerificationId = null;
      
      return {
        success: true,
        user: result.user,
      };
    }
    
    return {
      success: false,
      error: "No verification session found. Please request a new code.",
    };
  } catch (error: any) {
    console.error("[phoneAuth] Verify OTP error:", error);
    
    let errorMessage = "Invalid verification code";
    
    if (error.code === "auth/invalid-verification-code") {
      errorMessage = "Invalid code. Please check and try again";
    } else if (error.code === "auth/code-expired") {
      errorMessage = "Code expired. Please request a new one";
    } else if (error.code === "auth/session-expired") {
      errorMessage = "Session expired. Please request a new code";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  if (auth) {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("[phoneAuth] Sign out error:", error);
    }
  }
  confirmationResult = null;
  storedVerificationId = null;
}

/**
 * Get current Firebase user
 */
export function getCurrentFirebaseUser() {
  return auth?.currentUser || null;
}

/**
 * Check if we're in demo mode
 */
export function isDemoMode(): boolean {
  return !isFirebaseConfigured;
}
