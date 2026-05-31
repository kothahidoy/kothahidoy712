// Supabase client — gracefully no-op when env vars are absent so the app
// boots in "demo mode" with local seed data. Once the user pastes their
// Supabase URL + anon key into .env, real backend kicks in automatically.

import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith("http"),
);

/**
 * SSR-safe storage adapter for Supabase auth sessions.
 *  - Native (iOS/Android): real AsyncStorage.
 *  - Web (browser): localStorage.
 *  - Web (SSR / Node — Expo static rendering): no-op so it doesn't crash
 *    on the initial server pass where `window` is undefined.
 */
const sessionStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

// During Expo static rendering on web (Node SSR pass) there's no `window`
// and Supabase's realtime client crashes because it tries to open a
// WebSocket. We only construct the client on the client side; during SSR
// the data layer falls back to seed data (same as demo mode), then on
// hydration the real client takes over.
const isSSR = Platform.OS === "web" && typeof window === "undefined";

export const supabase: SupabaseClient | null =
  isSupabaseConfigured && !isSSR
    ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
        auth: {
          storage: sessionStorage,
          autoRefreshToken: true,
          persistSession: true,
          // On web, after the user clicks the magic link they land back on
          // the app with the session in the URL hash — Supabase auto-extracts
          // and stores it. On native we use deep links (future).
          detectSessionInUrl: Platform.OS === "web",
          // Use the simpler implicit flow. PKCE (the newer default) breaks
          // `verifyOtp` for email/phone codes because it expects a code
          // verifier stored on the same device that called signInWithOtp.
          flowType: "implicit",
        },
      })
    : null;
