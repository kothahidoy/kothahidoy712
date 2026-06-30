"""
Welcome Screen CMS
──────────────────────────────────────────────────────────────────────
Admin-controllable content for `/app/frontend/app/(auth)/welcome.tsx`.

Why storage (not a DB table)?
  • Welcome screen has ~25 fields with mixed types (text + enabled flag +
    colour). A single JSONB blob is much simpler than 25 columns, and
    storing it as a file in the `cms-media` bucket avoids any DDL
    migration step (no SQL the user has to run).
  • A single GET → public URL fetch on the client (cached by CDN) so
    page load isn't blocked.
  • PUT from admin = a `POST /storage/v1/object/cms-media/<key>` with
    `x-upsert: true`.

File path:  cms-media/welcome-config.json
Public URL: {SUPABASE_URL}/storage/v1/object/public/cms-media/welcome-config.json
"""
from __future__ import annotations

import os
import json
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

router = APIRouter(prefix="/api/admin/cms", tags=["admin-cms-welcome"])

OBJECT_NAME = "welcome-config.json"
PUBLIC_URL = f"{SUPABASE_URL}/storage/v1/object/public/cms-media/{OBJECT_NAME}"


# ── Schema ───────────────────────────────────────────────────────────
class WelcomeConfig(BaseModel):
    """Editable Welcome screen config.

    Every visual section has BOTH a value AND an `*_enabled` flag so the
    admin can toggle individual elements without losing the text.
    """
    # Hero banner image
    hero_image_url: str = Field(
        default=(
            "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0"
            "?crop=entropy&cs=srgb&fm=jpg&w=900&q=85"
        )
    )
    hero_image_enabled: bool = True

    # Brand badge (top-left "Mfixit · Verified pros · 24×7")
    brand_name: str = "Mfixit"
    brand_subtitle: str = "Verified pros · 24×7"
    brand_badge_enabled: bool = True

    # Main hero title (e.g. "AC, Plumbing, Cleaning\nFixed in 30 Minutes")
    title_text: str = "AC, Plumbing, Cleaning\nFixed in 30 Minutes"
    title_color: str = "#FFFFFF"
    title_enabled: bool = True

    # Subtitle blue line ("Same-day service. No hidden charges.")
    subtitle_text: str = "Same-day service. No hidden charges."
    subtitle_color: str = "#2563EB"
    subtitle_enabled: bool = True

    # Description grey text
    description_text: str = (
        "Book a verified pro in 60 seconds — trusted by your neighbors."
    )
    description_color: str = "#CBD5E1"
    description_enabled: bool = True

    # 3 trust items
    trust_1_text: str = "10,000+ happy homes in Durgapur"
    trust_1_enabled: bool = True
    trust_2_text: str = "4.8 average rating"
    trust_2_enabled: bool = True
    trust_3_text: str = "30-day service warranty"
    trust_3_enabled: bool = True
    trust_text_color: str = "#FFFFFF"

    # "Sit back" banner
    sit_back_text: str = "Sit back, we'll take care of it 👍"
    sit_back_color: str = "#2563EB"
    sit_back_enabled: bool = True

    # Auth buttons
    google_btn_label: str = "Continue with Google"
    google_btn_enabled: bool = True

    phone_btn_label: str = "Continue with Phone"
    phone_btn_enabled: bool = True

    email_btn_label: str = "Continue with Email"
    email_btn_enabled: bool = True

    # Explore without signing in
    explore_btn_label: str = "Explore services without signing in"
    explore_btn_color: str = "#2563EB"
    explore_btn_enabled: bool = True

    # Provider login
    provider_btn_label: str = "Provider Login"
    provider_btn_enabled: bool = True


def _service_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }


# ── GET ──────────────────────────────────────────────────────────────
@router.get("/welcome-screen")
async def get_welcome_screen():
    """Fetch the current Welcome screen config. Returns defaults if no
    config has been saved yet (first run)."""
    defaults = WelcomeConfig().dict()
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return defaults
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(PUBLIC_URL)
            if r.status_code == 200 and r.content:
                try:
                    saved = json.loads(r.content)
                    # Merge with defaults so new fields don't break existing config
                    merged = {**defaults, **(saved if isinstance(saved, dict) else {})}
                    return merged
                except Exception:
                    return defaults
    except Exception:
        pass
    return defaults


# ── PUT ──────────────────────────────────────────────────────────────
@router.put("/welcome-screen")
async def update_welcome_screen(payload: WelcomeConfig):
    """Save the Welcome screen config to Supabase Storage as a JSON file.
    Admin-only — but auth is not enforced at this layer (consistent with
    the rest of /api/admin/cms/*). The frontend admin route is already
    gated by `isAdmin` check."""
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
