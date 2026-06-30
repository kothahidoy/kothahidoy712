"""
Public booking-detail fetch
──────────────────────────────────────────────────────────────────────
A read-only endpoint that returns a single booking row by ID using the
service-role key. Used by the customer's booking-detail screen so that
deep-links / freshly-signed-in users can see their booking even before
the client-side Supabase session is fully primed.

Returns 404 if the booking doesn't exist. Returns the booking row
(including provider_id) on success. Does NOT expose any other tables.
"""
from __future__ import annotations

import os
import httpx
from fastapi import APIRouter, HTTPException

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

router = APIRouter(prefix="/api", tags=["booking-public"])


def _sb_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Accept": "application/json",
    }


@router.get("/booking/{booking_id}")
async def get_booking_by_id(booking_id: str):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(503, "Supabase not configured")
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/bookings"
            f"?id=eq.{booking_id}"
            f"&select=id,customer_id,service_id,scheduled_date,time_slot,address,notes,price,status,rating,review,created_at,payment_status,payment_method,payment_id,paid_at,provider_id",
            headers=_sb_headers(),
        )
        if not r.is_success:
            raise HTTPException(r.status_code, r.text)
        rows = r.json()
        if not rows:
            raise HTTPException(404, "Booking not found")
        return rows[0]
