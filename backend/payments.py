"""Razorpay payment endpoints for Mfixit.

Flow:
  1. Frontend calls /api/payments/create-order with INR rupees + booking_id.
  2. Backend creates a Razorpay order via the razorpay-python SDK using the
     server-side secret and returns {order_id, amount_paise, key_id} to the
     frontend.
  3. Frontend opens Razorpay Checkout (web JS / native SDK) with that order.
  4. After the customer pays, Checkout returns razorpay_payment_id,
     razorpay_order_id and razorpay_signature to the frontend.
  5. Frontend POSTs those three values + the booking_id to
     /api/payments/verify, which HMAC-verifies the signature with the
     secret and confirms whether the payment is genuine.
  6. On verify-success the frontend updates public.bookings.payment_status
     directly via Supabase (the customer owns that row → RLS allows it).
"""
from __future__ import annotations

import os
import logging
from typing import Optional

import razorpay
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["payments"])

# --- Razorpay client (lazy so import doesn't crash if keys missing) -------
_client: Optional[razorpay.Client] = None


def _get_client() -> razorpay.Client:
    global _client
    if _client is None:
        kid = os.environ.get("RAZORPAY_KEY_ID")
        sec = os.environ.get("RAZORPAY_KEY_SECRET")
        if not kid or not sec:
            raise HTTPException(
                status_code=500,
                detail="Razorpay keys are not configured on the server.",
            )
        _client = razorpay.Client(auth=(kid, sec))
    return _client


# ------------------------- /create-order -----------------------------------
class CreateOrderIn(BaseModel):
    booking_id: str = Field(..., min_length=1)
    amount_inr: float = Field(..., gt=0, description="Amount in INR rupees")
    currency: str = "INR"


class CreateOrderOut(BaseModel):
    order_id: str
    amount_paise: int
    currency: str
    key_id: str


@router.post("/create-order", response_model=CreateOrderOut)
async def create_order(body: CreateOrderIn) -> CreateOrderOut:
    client = _get_client()
    amount_paise = int(round(body.amount_inr * 100))
    if amount_paise < 100:  # Razorpay minimum ₹1
        raise HTTPException(status_code=400, detail="Amount must be at least ₹1")

    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": body.currency,
            "payment_capture": 1,
            "notes": {"booking_id": body.booking_id},
            # Razorpay receipt max 40 chars
            "receipt": f"bk_{body.booking_id}"[:40],
        })
    except Exception as e:
        log.exception("Razorpay order.create failed")
        raise HTTPException(status_code=502, detail=f"Razorpay error: {e}")

    return CreateOrderOut(
        order_id=order["id"],
        amount_paise=order["amount"],
        currency=order["currency"],
        key_id=os.environ["RAZORPAY_KEY_ID"],
    )


# ------------------------- /verify ----------------------------------------
class VerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    booking_id: str


class VerifyOut(BaseModel):
    verified: bool
    payment_id: str
    order_id: str


@router.post("/verify", response_model=VerifyOut)
async def verify_payment(body: VerifyIn) -> VerifyOut:
    """HMAC-verify a payment signature. Returns verified=True only if the
    Razorpay-signed payload is genuine. We do NOT touch the database here —
    the frontend, after seeing verified=True, updates its own booking row
    via Supabase (RLS allows the owner to mark their booking as paid)."""
    client = _get_client()
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        log.warning("Razorpay signature mismatch for booking %s", body.booking_id)
        raise HTTPException(status_code=400, detail="Signature verification failed")
    except Exception as e:
        log.exception("Razorpay verify failed")
        raise HTTPException(status_code=502, detail=f"Verify error: {e}")

    return VerifyOut(
        verified=True,
        payment_id=body.razorpay_payment_id,
        order_id=body.razorpay_order_id,
    )


# ------------------------- /webhook (stub) --------------------------------
# Wire this up later in Razorpay Dashboard → Webhooks. Until you set a
# webhook secret in env (RAZORPAY_WEBHOOK_SECRET), this endpoint will 503.
@router.post("/webhook")
async def razorpay_webhook(payload: dict):  # pragma: no cover
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")
    # TODO: extract signature header & call utility.verify_webhook_signature
    return {"ok": True}
