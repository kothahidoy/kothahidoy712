// supabase/functions/razorpay-webhook/index.ts
//
// Razorpay → Mfixit webhook receiver.
//
// Handles three events: payment.captured, payment.failed, refund.processed.
// Verifies the X-Razorpay-Signature header against the configured webhook
// secret using HMAC-SHA256, then updates public.bookings via the service
// role (bypasses RLS — no recursion risk).
//
// Configure in Razorpay Dashboard → Settings → Webhooks:
//   URL    = https://<project-ref>.supabase.co/functions/v1/razorpay-webhook
//   Events = payment.captured, payment.failed, refund.processed
//   Secret = (copy the generated value into the Supabase secret
//            RAZORPAY_WEBHOOK_SECRET in Edge Functions → Secrets)
//
// Important: when deploying via Supabase Dashboard, turn OFF the
// "Enforce JWT Verification" toggle on this function. Razorpay does NOT
// send a Supabase user JWT — the security here is the HMAC signature.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    ...init,
  });

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST")
    return json({ ok: false, error: "Method not allowed" }, { status: 405 });

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret)
    return json({ ok: false, error: "RAZORPAY_WEBHOOK_SECRET not configured" }, { status: 500 });

  // 1. Read raw body and verify signature.
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const expected = await hmacSha256Hex(secret, raw);
  if (!safeEqual(expected, sig)) {
    console.warn("[webhook] signature mismatch");
    return json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  // 2. Parse the event.
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const type: string = event.event ?? "";
  const payment = event.payload?.payment?.entity;
  const refund = event.payload?.refund?.entity;

  // 3. Service-role client for safe DB writes (RLS-bypass).
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!serviceKey)
    return json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY missing" }, { status: 500 });
  const admin = createClient(supaUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    if (type === "payment.captured" && payment) {
      // Failsafe: if the frontend's verify-payment call somehow didn't run,
      // mark the booking paid here when Razorpay confirms the capture.
      const { error } = await admin
        .from("bookings")
        .update({
          payment_status: "paid",
          payment_method: "razorpay",
          payment_id: payment.id,
          payment_order: payment.order_id,
          paid_at: new Date(payment.created_at * 1000).toISOString(),
        })
        .eq("payment_order", payment.order_id)
        .neq("payment_status", "paid"); // don't clobber an already-paid row
      if (error) console.error("[webhook] update on captured failed", error);
      return json({ ok: true, handled: "payment.captured" });
    }

    if (type === "payment.failed" && payment) {
      // We never insert a booking until verify-payment returns success,
      // so there's nothing to update here in the normal flow. We still
      // record the failure on any booking that happens to share the
      // order id (rare race). Otherwise just acknowledge.
      const { error } = await admin
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("payment_order", payment.order_id)
        .neq("payment_status", "paid");
      if (error) console.error("[webhook] update on failed failed", error);
      console.log(
        `[webhook] payment.failed order=${payment.order_id} reason=${payment.error_description}`,
      );
      return json({ ok: true, handled: "payment.failed" });
    }

    if (type === "refund.processed" && refund) {
      const { error } = await admin
        .from("bookings")
        .update({ payment_status: "refunded" })
        .eq("payment_id", refund.payment_id);
      if (error) console.error("[webhook] update on refunded failed", error);
      return json({ ok: true, handled: "refund.processed" });
    }

    // Unhandled event — log and return 200 so Razorpay doesn't retry.
    console.log(`[webhook] unhandled event ${type}`);
    return json({ ok: true, handled: "ignored", event: type });
  } catch (e) {
    console.error("[webhook] handler crashed", e);
    return json({ ok: false, error: String(e) }, { status: 500 });
  }
});
