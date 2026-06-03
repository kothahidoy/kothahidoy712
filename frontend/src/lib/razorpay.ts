/**
 * Mfixit — Razorpay payment helper (Expo Web).
 *
 * On Expo Web we use Razorpay's hosted Checkout JS (window.Razorpay).
 * The script is loaded on-demand the first time we need it.
 *
 * For native (Expo dev-client) we'd swap this for `react-native-razorpay`
 * later — the same `payForBooking()` API stays the same so call-sites
 * don't need to change.
 */
import { Platform } from "react-native";

import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const BACKEND =
  (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").replace(/\/+$/, "") || "";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export type PayResult =
  | { status: "paid"; paymentId: string; orderId: string }
  | { status: "failed"; reason: string }
  | { status: "dismissed" };

interface PayInput {
  bookingId: string;
  amountInr: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
}

/** Promise-based loader — only runs on web. Resolves once window.Razorpay
 *  is available. Caches the loader so we don't re-inject the script. */
let _loader: Promise<void> | null = null;
function loadCheckout(): Promise<void> {
  if (Platform.OS !== "web") return Promise.resolve();
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (_loader) return _loader;
  _loader = new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    const s = document.createElement("script");
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(s);
  });
  return _loader;
}

async function api<T>(path: string, body: any): Promise<T> {
  const url = `${BACKEND}${path}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`${r.status} ${t || r.statusText}`);
  }
  return (await r.json()) as T;
}

/** Main entry: open Razorpay Checkout, run the full pay+verify+persist
 *  pipeline, and return a normalised PayResult. */
export async function payForBooking(input: PayInput): Promise<PayResult> {
  // 1. Get an order from our FastAPI backend.
  const order = await api<{
    order_id: string;
    amount_paise: number;
    currency: string;
    key_id: string;
  }>("/api/payments/create-order", {
    booking_id: input.bookingId,
    amount_inr: input.amountInr,
  });

  // 2. Web → Razorpay Checkout JS.
  if (Platform.OS !== "web") {
    return {
      status: "failed",
      reason:
        "Razorpay native checkout is not bundled in Expo Go. Use a dev-build, or pay from a web browser for now.",
    };
  }

  await loadCheckout();

  return new Promise<PayResult>((resolve) => {
    const rzp = new (window as any).Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount_paise,
      currency: order.currency,
      name: "Mfixit",
      description: input.description ?? "Home service booking",
      prefill: {
        name: input.customerName ?? "",
        email: input.customerEmail ?? "",
        contact: input.customerPhone ?? "",
      },
      theme: { color: "#1F4FFF" },
      modal: {
        ondismiss: () => resolve({ status: "dismissed" }),
      },
      handler: async (resp: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          // 3. Verify the signature on our backend.
          const verify = await api<{ verified: boolean }>(
            "/api/payments/verify",
            {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              booking_id: input.bookingId,
            },
          );
          if (!verify.verified) {
            return resolve({
              status: "failed",
              reason: "Signature verification failed",
            });
          }
          // 4. Persist on the booking row via Supabase (RLS-safe, owner).
          if (isSupabaseConfigured && supabase) {
            await supabase
              .from("bookings")
              .update({
                payment_status: "paid",
                payment_method: "razorpay",
                payment_id: resp.razorpay_payment_id,
                payment_order: resp.razorpay_order_id,
                paid_at: new Date().toISOString(),
              })
              .eq("id", input.bookingId);
          }
          resolve({
            status: "paid",
            paymentId: resp.razorpay_payment_id,
            orderId: resp.razorpay_order_id,
          });
        } catch (e) {
          resolve({
            status: "failed",
            reason: e instanceof Error ? e.message : String(e),
          });
        }
      },
    });
    rzp.on("payment.failed", (resp: any) => {
      resolve({
        status: "failed",
        reason: resp?.error?.description ?? "Payment failed",
      });
    });
    rzp.open();
  });
}
