// Shared auth-token getter used by every backend API call.
//
// Why this exists: phone/OTP logins get a Supabase-*compatible* JWT that our
// own backend mints (see backend/supabase_auth.py mint_access_token) — it is
// NOT issued by real Supabase Auth (GoTrue). We hand it to
// `supabase.auth.setSession()` so RLS/storage/etc. work, but that also gives
// supabase-js our fake `refresh_token`. supabase-js's built-in auto-refresh
// will, at some point, try to use that fake refresh_token against the real
// GoTrue server, get rejected, and silently clear the whole session — after
// which `supabase.auth.getSession()` returns null even though the user is
// still "logged in" from the app's point of view. That's what caused
// "Please sign in" / booking failed for phone logins while email/Google
// logins (real GoTrue tokens end-to-end) kept working fine.
//
// Fix: phone logins also save their access_token here, in storage that
// nothing but our own sign-out flow touches. We prefer this stored token
// first (it's valid for the JWT's full TTL, no refresh needed) and only
// fall back to supabase-js's own session for real Supabase Auth users.

import { storage } from "@/src/utils/storage";
import { supabase } from "@/src/lib/supabase";

export const PHONE_SESSION_TOKEN_KEY = "phone_session_token";

export async function savePhoneSessionToken(accessToken: string): Promise<void> {
  try {
    await storage.setItem(PHONE_SESSION_TOKEN_KEY, accessToken);
  } catch (e) {
    console.warn("[authToken] failed to save phone session token", e);
  }
}

export async function clearPhoneSessionToken(): Promise<void> {
  try {
    await storage.removeItem(PHONE_SESSION_TOKEN_KEY);
  } catch {}
}

/** Returns the best available bearer token, or null if signed out. */
export async function getAuthToken(): Promise<string | null> {
  try {
    const stored = await storage.getItem<string | null>(PHONE_SESSION_TOKEN_KEY, null);
    if (stored) return stored;
  } catch {}

  try {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) return token;
    }
  } catch {}

  return null;
}

/** Convenience helper for building fetch() headers. */
export async function authHeader(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = await getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
