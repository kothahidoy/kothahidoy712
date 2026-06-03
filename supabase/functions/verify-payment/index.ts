// supabase/functions/verify-payment/index.ts
//
// Razorpay HMAC-SHA256 signature verification + atomic booking insert.
//
// Flow:
//   1. Frontend POSTs { razorpay_order_id, razorpay_payment_id,
//      razorpay_signature, bookingData } with the caller's JWT in the
//      Authorization header.
//   2. We HMAC-SHA256(order_id|payment_id) with the Razorpay secret and
//      compare to the supplied signature (constant-time compare).
//   3. If valid → insert the booking row using a Supabase client that
//      runs as the caller (RLS still applies, so the row's customer_id
//      must equal the caller's public.users.id).
//   4. Return { success: true, booking } | { success: false, error }.
//
// Deploy via Supabase Dashboard → Edge Functions → New function →
// name: "verify-payment" → paste this whole file → Deploy.
// Then add these secrets in Project Settings → Edge Functions → Secrets:
//   RAZORPAY_KEY_SECRET = (your Razorpay test/live secret)
// SUPABASE_URL and SUPABASE_ANON_KEY are injected automatically.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    ...init,
  });

/** Constant-time string compare. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** HMAC-SHA256(secret, payload) → hex string. */
async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface BookingData {
  serviceId: string;
  scheduledDate: string;
  timeSlot: string;
  address: Record<string, unknown>;
  notes?: string | null;
  price: number;
}

interface Body {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingData: BookingData;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST")
    return json({ success: false, error: "Method not allowed" }, { status: 405 });

  const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!secret)
    return json(
      { success: false, error: "RAZORPAY_KEY_SECRET not configured" },
      { status: 500 },
    );

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingData,
  } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return json(
      { success: false, error: "Missing payment fields" },
      { status: 400 },
    );

  // 1. Signature check — Razorpay docs:
  //    expected = hmac_sha256(secret, `${order_id}|${payment_id}`)
  const expected = await hmacSha256Hex(
    secret,
    `${razorpay_order_id}|${razorpay_payment_id}`,
  );
  if (!safeEqual(expected, razorpay_signature)) {
    return json(
      { success: false, error: "Signature mismatch — payment not verified" },
      { status: 400 },
    );
  }

  if (!bookingData)
    return json({
      success: true,
      verified: true,
      booking: null,
      note: "No bookingData provided; signature is valid.",
    });

  // 2. Atomic booking insert — runs as the caller so RLS still applies.
  const authHeader = req.headers.get("Authorization") ?? "";
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const supaAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supa = createClient(supaUrl, supaAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  // Resolve the public.users id for the caller (bookings.customer_id FK).
  const { data: authUser } = await supa.auth.getUser();
  if (!authUser?.user)
    return json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  const { data: profileRow } = await supa
    .from("users")
    .select("id")
    .eq("auth_user_id", authUser.user.id)
    .maybeSingle();
  if (!profileRow?.id)
    return json(
      {
        success: false,
        error: "No customer profile — please finish profile setup first.",
      },
      { status: 400 },
    );

  // Idempotency: if a row with this payment_id already exists, return it.
  const existing = await supa
    .from("bookings")
    .select("*")
    .eq("payment_id", razorpay_payment_id)
    .maybeSingle();
  if (existing.data) {
    return json({ success: true, verified: true, booking: existing.data });
  }

  const insert = await supa
    .from("bookings")
    .insert({
      customer_id: profileRow.id,
      service_id: bookingData.serviceId,
      scheduled_date: bookingData.scheduledDate.split("T")[0],
      time_slot: bookingData.timeSlot,
      address: bookingData.address,
      notes: bookingData.notes ?? null,
      price: bookingData.price,
      status: "confirmed",
      payment_status: "paid",
      payment_method: "razorpay",
      payment_id: razorpay_payment_id,
      payment_order: razorpay_order_id,
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insert.error) {
    return json(
      {
        success: false,
        verified: true,
        error: `Payment captured but booking insert failed: ${insert.error.message}`,
        payment_id: razorpay_payment_id,
      },
      { status: 500 },
    );
  }

  return json({ success: true, verified: true, booking: insert.data });
});
