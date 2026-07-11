"""
Profile Screen CMS
──────────────────────────────────────────────────────────────────────
Admin-controllable content for the customer Profile screen:
  • Privacy Policy text
  • Terms & Conditions text
  • Support contact (email / phone)
  • Rate-us store links
  • Share-app message

Same pattern as welcome_cms_routes.py: a single JSON blob stored in the
`cms-media` storage bucket, fetched by the app via its public URL, and
overwritten by the admin PUT below. No SQL migration required.

File path:  cms-media/profile-config.json
"""
from __future__ import annotations

import os
import json
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

router = APIRouter(prefix="/api/admin/cms", tags=["admin-cms-profile"])

OBJECT_NAME = "profile-config.json"
PUBLIC_URL = f"{SUPABASE_URL}/storage/v1/object/public/cms-media/{OBJECT_NAME}"


class ProfileConfig(BaseModel):
    privacy_policy_title: str = "Privacy Policy"
    privacy_policy_body: str = Field(
        default=(
            "Mfixit collects the information you provide (name, phone, address, "
            "booking details) solely to fulfil your service bookings and improve "
            "our service. We do not sell your personal data to third parties. "
            "Payment details are processed securely via Razorpay and are never "
            "stored on our servers. You may request access to, or deletion of, "
            "your data at any time via Settings > Delete account request, or by "
            "contacting our support team.\n\n"
            "Location data is used only to find professionals near you and to "
            "provide accurate service addresses. Notifications are sent only "
            "for booking-related updates unless you opt in to promotional "
            "messages."
        )
    )

    terms_title: str = "Terms & Conditions"
    terms_body: str = Field(
        default=(
            "By using Mfixit, you agree to book services in good faith and "
            "provide accurate address and contact details so our professionals "
            "can reach you. Prices shown at checkout are final unless additional "
            "work is required on-site, which will always be confirmed with you "
            "first.\n\n"
            "Cancellations made more than 12 hours before the scheduled slot are "
            "free; later cancellations may incur a fee as shown in the app. "
            "Mfixit reserves the right to reassign or reschedule a booking if a "
            "professional becomes unavailable, and will notify you promptly if "
            "this happens.\n\n"
            "Misuse of the platform, abusive behaviour towards professionals, or "
            "fraudulent payment activity may result in account suspension."
        )
    )

    support_email: str = "support@mfixit.in"
    support_phone: str = "+91 98765 00000"

    rate_us_url_android: str = ""
    rate_us_url_ios: str = ""
    share_app_message: str = (
        "Check out Mfixit — book verified electricians, plumbers, salon, "
        "cleaning & more in minutes! https://mfixit.app"
    )

    # Admin can hide any of these three Profile-screen menu rows entirely
    # (e.g. before the app is actually published on a store, or before the
    # referral program is ready) without touching code.
    show_share_app: bool = True
    show_rate_us: bool = True
    show_refer_earn: bool = True


def _service_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }


@router.get("/profile-screen")
async def get_profile_screen():
    """Fetch the current Profile-screen CMS config. Returns defaults if
    nothing has been saved yet."""
    defaults = ProfileConfig().dict()
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return defaults
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(PUBLIC_URL)
            if r.status_code == 200 and r.content:
                try:
                    saved = json.loads(r.content)
                    merged = {**defaults, **(saved if isinstance(saved, dict) else {})}
                    return merged
                except Exception:
                    return defaults
    except Exception:
        pass
    return defaults


@router.put("/profile-screen")
async def update_profile_screen(payload: ProfileConfig):
    """Save the Profile-screen CMS config. Admin-only at the frontend
    route level (consistent with the rest of /api/admin/cms/*)."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(500, "Supabase not configured")

    body = payload.dict()
    payload_bytes = json.dumps(body, ensure_ascii=False).encode("utf-8")

    upload_url = f"{SUPABASE_URL}/storage/v1/object/cms-media/{OBJECT_NAME}"
    headers = {
        **_service_headers(),
        "Content-Type": "application/json",
        "x-upsert": "true",
        "cache-control": "no-cache, no-store, max-age=0",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(upload_url, headers=headers, content=payload_bytes)
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"Save failed: {r.text[:300]}")
    return {"ok": True, "url": PUBLIC_URL, "config": body}
