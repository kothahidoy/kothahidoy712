/**
 * MSG91 WhatsApp OTP – frontend client.
 *
 * All requests hit the FastAPI backend at `EXPO_PUBLIC_BACKEND_URL/api/auth/otp/*`.
 * MSG91 AUTHKEY never leaves the server.
 */

import Constants from "expo-constants";

const BACKEND_URL =
  (process.env.EXPO_PUBLIC_BACKEND_URL as string | undefined) ||
  (Constants?.expoConfig?.extra as Record<string, string> | undefined)?.backendUrl ||
  "";

export type OtpChannel = "whatsapp";

export interface SendOtpResponse {
  ok: boolean;
  phone: string;
  channel: OtpChannel;
  otp_length: number;
  expires_in_seconds: number;
  resend_after_seconds: number;
  demo?: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    phone?: string | null;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  };
}

export interface VerifyOtpResponse {
  ok: boolean;
  verified: boolean;
  phone: string;
  is_new_user?: boolean;
  session?: AuthSession | null;
}

export interface ResendOtpResponse {
  ok: boolean;
  phone: string;
  channel: OtpChannel;
  resend_after_seconds: number;
  expires_in_seconds: number;
}

export class OtpError extends Error {
  code: string;
  status: number;
  retryAfter?: number;
  attemptsLeft?: number;
  constructor(message: string, code: string, status: number, retryAfter?: number, attemptsLeft?: number) {
    super(message);
    this.name = "OtpError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
    this.attemptsLeft = attemptsLeft;
  }
}

function url(path: string): string {
  const base = BACKEND_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!BACKEND_URL) {
    throw new OtpError("Backend URL is not configured", "NO_BACKEND_URL", 0);
  }
  let res: Response;
  try {
    res = await fetch(url(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new OtpError(
      err instanceof Error ? err.message : "Network error",
      "NETWORK",
      0
    );
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const detail = data?.detail;
    if (detail && typeof detail === "object") {
      throw new OtpError(
        detail.message || "Request failed",
        detail.code || "ERROR",
        res.status,
        detail.retry_after,
        detail.attempts_left
      );
    }
    throw new OtpError(
      typeof detail === "string" ? detail : `Request failed (${res.status})`,
      "ERROR",
      res.status
    );
  }
  return data as T;
}

export function formatIndianPhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  return post<SendOtpResponse>("/api/auth/otp/send", { phone });
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  return post<VerifyOtpResponse>("/api/auth/otp/verify", { phone, otp });
}

export async function resendOtp(phone: string): Promise<ResendOtpResponse> {
  return post<ResendOtpResponse>("/api/auth/otp/resend", { phone });
}
