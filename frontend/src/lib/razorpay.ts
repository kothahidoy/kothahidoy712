/**
 * Mfixit — Razorpay payment helper (Expo Web).
 *
 * Pay-first / book-after flow:
 *   1. Caller calls `runRazorpayCheckout()` with the amount + customer
 *      info. We generate a client-side receipt id and ask our backend
 *      to create a Razorpay order.
 *   2. Razorpay Checkout opens; the customer pays.
 *   3. On success we call the backend `verify` endpoint which HMAC-checks
 *      the signature with the server-side secret.
 *   4. We resolve with { status: 'paid', paymentId, orderId } — the
 *      caller (booking/new.tsx) then creates the booking row.
 *
 * Nothing is written to the database from this helper any more. That is
 * the caller's job, so the booking can only exist after a verified
 * payment.
 */
import { Platform } from "react-native";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const BACKEND =
  (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").replace(/\/+$/, "") || "";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export type PayResult =
  | {
      status: "paid";
      paymentId: string;
      orderId: string;
      signature: string;
    }
  | { status: "failed"; reason: string }
  | { status: "dismissed" };

interface CheckoutInput {
  amountInr: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  /** Optional — pass a stable receipt id so duplicate clicks don't create
   *  duplicate orders. If omitted we generate one. */
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

/** Run the full Razorpay Checkout flow. Returns a normalised PayResult.
 *  The caller is responsible for persisting the booking only when
 *  status === 'paid'. */
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

  // Idempotency: stable receipt id prevents the user double-tapping the
  // button from creating two orders.
  const receiptId =
    input.receiptId ?? `mfx_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;

  let order: {
    order_id: string;
    amount_paise: number;
    currency: string;
    key_id: string;
  };
  try {
    order = await api("/api/payments/create-order", {
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
          const verify = await api<{ verified: boolean }>(
            "/api/payments/verify",
            {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              booking_id: receiptId,
            },
          );
          if (!verify.verified) {
            return finish({
              status: "failed",
              reason: "Signature verification failed",
            });
          }
          finish({
            status: "paid",
            paymentId: resp.razorpay_payment_id,
            orderId: resp.razorpay_order_id,
            signature: resp.razorpay_signature,
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
