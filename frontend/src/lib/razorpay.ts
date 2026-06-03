/**
 * Mfixit — Razorpay payment helper (Expo Web).
 *
 * Pay-first / book-after flow with Supabase Edge Function verification:
 *
 *   1. Frontend POSTs to FastAPI /api/payments/create-order → backend
 *      creates a real Razorpay order using the server-side secret and
 *      returns { order_id, amount_paise, key_id }.
 *   2. Razorpay Checkout opens on the web; the customer pays.
 *   3. On payment success Razorpay returns
 *      { razorpay_payment_id, razorpay_order_id, razorpay_signature }.
 *   4. We POST those three values **+ bookingData** to the Supabase
 *      Edge Function "verify-payment" (see supabase/functions/
 *      verify-payment/index.ts). The Edge Function verifies the HMAC
 *      signature server-side and, if valid, atomically inserts the
 *      booking row.
 *   5. We resolve with { status: 'paid', booking } so the caller can
 *      navigate to the confirmation screen.
 *
 * If the signature is invalid OR the user closes the modal OR the
 * gateway fails — the resolved status is 'failed' or 'dismissed' and
 * NO booking exists in the database.
 */
import { Platform } from "react-native";

import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { SavedAddress } from "@/src/types";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const BACKEND =
  (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").replace(/\/+$/, "") || "";
const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/+$/,
  "",
);
const VERIFY_FN_URL = `${SUPABASE_URL}/functions/v1/verify-payment`;

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface BookingDataInput {
  serviceId: string;
  scheduledDate: string; // ISO
  timeSlot: string;
  address: SavedAddress;
  notes?: string | null;
  price: number;
}

export type PayResult =
  | {
      status: "paid";
      paymentId: string;
      orderId: string;
      booking: any | null; // null when bookingData was not passed (pay-now flow)
    }
  | { status: "failed"; reason: string }
  | { status: "dismissed" };

interface CheckoutInput {
  amountInr: number;
  /** When present, the Edge Function atomically inserts the booking
   *  after verifying the signature. When absent (e.g. "Pay now" on an
   *  already-existing booking) the Edge Function only verifies and the
   *  caller is responsible for updating the existing row. */
  bookingData?: BookingDataInput;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  receiptId?: string;
}

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

async function apiJson<T>(url: string, body: any, jwt?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`${r.status} ${t || r.statusText}`);
  }
  return (await r.json()) as T;
}

/** Run the full Razorpay Checkout flow. Returns a PayResult. The booking
 *  row is created server-side INSIDE the verify-payment Edge Function
 *  (only after a valid signature), so a 'paid' result already means the
 *  row exists. Caller just navigates to the confirmation screen. */
export async function runRazorpayCheckout(
  input: CheckoutInput,
): Promise<PayResult> {
  if (Platform.OS !== "web") {
    return {
      status: "failed",
      reason:
        "Online payments need the web preview or a native dev-build. Try Cash on Service for now.",
    };
  }

  const receiptId =
    input.receiptId ?? `mfx_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

  // 1. Create a Razorpay order via our FastAPI backend (server-side secret).
  let order: {
    order_id: string;
    amount_paise: number;
    currency: string;
    key_id: string;
  };
  try {
    order = await apiJson(`${BACKEND}/api/payments/create-order`, {
      booking_id: receiptId,
      amount_inr: input.amountInr,
    });
  } catch (e) {
    return {
      status: "failed",
      reason: e instanceof Error ? e.message : "Could not start payment",
    };
  }

  try {
    await loadCheckout();
  } catch (e) {
    return {
      status: "failed",
      reason: e instanceof Error ? e.message : "Razorpay failed to load",
    };
  }

  // Pull the caller's JWT so the Edge Function can run as the user (RLS).
  const sess =
    isSupabaseConfigured && supabase
      ? (await supabase.auth.getSession()).data.session
      : null;
  const jwt = sess?.access_token;

  return new Promise<PayResult>((resolve) => {
    let settled = false;
    const finish = (r: PayResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

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
        ondismiss: () => finish({ status: "dismissed" }),
      },
      handler: async (resp: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          // 2. Verify + atomic-insert via the Supabase Edge Function.
          const verify = await apiJson<{
            success: boolean;
            verified?: boolean;
            booking?: any;
            error?: string;
          }>(
            VERIFY_FN_URL,
            {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              bookingData: input.bookingData,
            },
            jwt,
          );

          if (!verify.success) {
            return finish({
              status: "failed",
              reason:
                verify.error ?? "Verification failed — payment not confirmed",
            });
          }
          // When bookingData was passed, the Edge Function returns the
          // newly-inserted row in `booking`. For "Pay now" on an existing
          // booking we don't pass bookingData and `booking` is null —
          // both are valid 'paid' outcomes.
          finish({
            status: "paid",
            paymentId: resp.razorpay_payment_id,
            orderId: resp.razorpay_order_id,
            booking: verify.booking ?? null,
          });
        } catch (e) {
          finish({
            status: "failed",
            reason: e instanceof Error ? e.message : String(e),
          });
        }
      },
    });
    rzp.on("payment.failed", (resp: any) => {
      finish({
        status: "failed",
        reason:
          resp?.error?.description ??
          resp?.error?.reason ??
          "Payment failed at gateway",
      });
    });
    rzp.open();
  });
}
