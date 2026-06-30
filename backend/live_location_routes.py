"""
Live location endpoints
─────────────────────────────────────────────────────────────────────────
* POST /api/provider/{provider_id}/location
    Provider app uploads its current GPS while a job is in progress.
    Payload: {latitude, longitude, heading?, speed?, accuracy?, booking_id?}
    Upserts into public.provider_locations keyed by provider_id.

* GET /api/booking/{booking_id}/provider-location
    Customer app polls this every ~15s. Returns the assigned provider's
    last fix and the seconds elapsed since the update so the client can
    show a "live" / "stale" badge.

The table is created via direct Postgres migration — see
`/app/scripts/2026-06-30-provider-locations.sql`. The backend talks to
Supabase via the REST API (PostgREST) so no extra Postgres driver is
required at runtime.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def _sb_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    }


router = APIRouter(prefix="/api", tags=["live-location"])


# ──────────────────────────────────────────────────────────────────────
# Provider → upload current location
# ──────────────────────────────────────────────────────────────────────
class LocationUpload(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    heading: Optional[float] = None
    speed: Optional[float] = None
    accuracy: Optional[float] = None
    booking_id: Optional[str] = None


@router.post("/provider/{provider_id}/location")
async def upload_provider_location(provider_id: str, payload: LocationUpload):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(503, "Supabase not configured")

    row = {
        "provider_id": provider_id,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "heading": payload.heading,
        "speed": payload.speed,
        "accuracy": payload.accuracy,
        "booking_id": payload.booking_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        # UPSERT via PostgREST: on_conflict=provider_id + Prefer:merge-duplicates
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/provider_locations?on_conflict=provider_id",
            headers=_sb_headers(),
            json=row,
        )
        if r.status_code not in (200, 201, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True, "updated_at": row["updated_at"]}


# ──────────────────────────────────────────────────────────────────────
# Customer → fetch the assigned provider's location for a booking
# ──────────────────────────────────────────────────────────────────────
@router.get("/booking/{booking_id}/provider-location")
async def get_provider_location_for_booking(booking_id: str):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(503, "Supabase not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Look up which provider is assigned to this booking
        b = await client.get(
            f"{SUPABASE_URL}/rest/v1/bookings"
            f"?id=eq.{booking_id}&select=provider_id,status",
            headers=_sb_headers(),
        )
        if not b.is_success:
            raise HTTPException(b.status_code, b.text)
        rows = b.json()
        if not rows:
            raise HTTPException(404, "Booking not found")
        booking = rows[0]
        provider_id = booking.get("provider_id")
        if not provider_id:
            return {
                "available": False,
                "reason": "No provider assigned yet",
                "status": booking.get("status"),
            }

        # 2. Fetch latest fix
        loc = await client.get(
            f"{SUPABASE_URL}/rest/v1/provider_locations"
            f"?provider_id=eq.{provider_id}&select=*&limit=1",
            headers=_sb_headers(),
        )
        if not loc.is_success:
            raise HTTPException(loc.status_code, loc.text)
        locs = loc.json()
        if not locs:
            return {
                "available": False,
                "reason": "Provider has not shared location yet",
                "status": booking.get("status"),
                "provider_id": provider_id,
            }

        rec = locs[0]
        # Stale-check on the server side too
        try:
            updated = datetime.fromisoformat(rec["updated_at"].replace("Z", "+00:00"))
            age_sec = int((datetime.now(timezone.utc) - updated).total_seconds())
        except Exception:
            age_sec = -1

        return {
            "available": True,
            "status": booking.get("status"),
            "provider_id": provider_id,
            "latitude": rec.get("latitude"),
            "longitude": rec.get("longitude"),
            "heading": rec.get("heading"),
            "speed": rec.get("speed"),
            "accuracy": rec.get("accuracy"),
            "updated_at": rec.get("updated_at"),
            "age_seconds": age_sec,
            "is_stale": age_sec > 120 if age_sec >= 0 else True,
        }
