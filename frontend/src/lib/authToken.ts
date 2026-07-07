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

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const withPad = pad ? padded + "=".repeat(4 - pad) : padded;
  if (typeof atob === "function") return atob(withPad);
  // React Native / Node fallback
  return Buffer.from(withPad, "base64").toString("utf-8");
}

function decodeJwtClaims(token: string): Record<string, any> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

/** Reads the `sub` claim out of a JWT without verifying its signature. We
 * only ever decode tokens we minted ourselves or that came straight from
 * Supabase, so this is safe — we're not trusting untrusted input here. */
function decodeJwtSub(token: string): string | null {
  return decodeJwtClaims(token)?.sub ?? null;
}

/** Returns { phone, email } claims from the stored phone-login token, if any. */
export async function getStoredPhoneClaims(): Promise<{ phone?: string; email?: string } | null> {
  const stored = await storage.getItem<string | null>(PHONE_SESSION_TOKEN_KEY, null).catch(() => null);
  if (!stored) return null;
  const claims = decodeJwtClaims(stored);
  if (!claims) return null;
  return { phone: claims.phone, email: claims.email };
}

/**
 * Resolves the auth user id (what public.users.auth_user_id should match)
 * without depending on `supabase.auth.getUser()`. That call makes a network
 * request to real Supabase Auth (GoTrue) to validate the token — which will
 * never recognize a phone-login token, since our backend mints that token
 * itself rather than GoTrue issuing it. That mismatch is what caused saved
 * addresses, bookings, and profile data to all appear empty for phone
 * logins even though everything was correctly saved server-side.
 */
export async function getAuthUserId(): Promise<string | null> {
  const stored = await storage.getItem<string | null>(PHONE_SESSION_TOKEN_KEY, null).catch(() => null);
  if (stored) {
    const sub = decodeJwtSub(stored);
    if (sub) return sub;
  }
  try {
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id ?? null;
    }
  } catch {}
  return null;
}


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
