"""
Billing / Fees CMS
──────────────────────────────────────────────────────────────────────
Admin-controllable billing configuration used by the cart "Bill summary"
(UC-style) and by booking creation totals.

Storage pattern identical to welcome_cms_routes.py: a single JSON blob in
the Supabase `cms-media` storage bucket → no DDL migration needed.

File path:  cms-media/billing-config.json

Endpoints
  GET /api/admin/cms/billing-config   → current config (defaults if unset)
  PUT /api/admin/cms/billing-config   → save config (admin CMS)

Also exports `get_billing_config()` used by booking_routes.py so the
backend grand-total matches what the customer saw in the cart.
"""
from __future__ import annotations

import os
import json
import time

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

router = APIRouter(prefix="/api/admin/cms", tags=["admin-cms-billing"])

OBJECT_NAME = "billing-config.json"
PUBLIC_URL = f"{SUPABASE_URL}/storage/v1/object/public/cms-media/{OBJECT_NAME}"


class BillingConfig(BaseModel):
    """Editable billing lines. Each fee has an enabled flag, a label and an
    amount so the admin can rename / toggle / reprice without code changes."""

    # Visitation fee (flat, per booking)
    visitation_fee_enabled: bool = True
    visitation_fee_label: str = "Visitation Fee"
    visitation_fee_amount: float = Field(default=49.0, ge=0)

    # Platform fee (flat, per booking)
    platform_fee_enabled: bool = True
    platform_fee_label: str = "Platform fee"
    platform_fee_amount: float = Field(default=9.0, ge=0)

    # Govt. taxes (% on items - discounts + fees)
    tax_enabled: bool = True
    tax_label: str = "Est Govt. taxes"
    tax_percent: float = Field(default=5.0, ge=0, le=100)

    # Small grey note under "Total bill" in the cart
    total_note: str = "Incl. govt. taxes & charges"

    # Late-cancellation fee — charged (recorded on the booking; collected
    # at the next payment / by the provider on-site for COD bookings) when
    # a customer cancels within the given window before their slot. This
    # was previously just advertised in the cancellation-policy text but
    # never actually enforced anywhere.
    late_cancellation_fee_enabled: bool = True
    late_cancellation_window_hours: float = Field(default=12.0, ge=0)
    late_cancellation_fee_percent: float = Field(default=25.0, ge=0, le=100)


def _service_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }


# Tiny in-process cache so booking creation doesn't hit storage every time.
_cache: dict = {"ts": 0.0, "cfg": None}
_CACHE_TTL = 60  # seconds


async def get_billing_config() -> dict:
    """Return the saved billing config (or defaults). Cached for 60 s."""
    now = time.time()
    if _cache["cfg"] is not None and (now - _cache["ts"]) < _CACHE_TTL:
        return _cache["cfg"]

    defaults = BillingConfig().dict()
    cfg = defaults
    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(PUBLIC_URL)
                if r.status_code == 200 and r.content:
                    saved = json.loads(r.content)
                    if isinstance(saved, dict):
                        cfg = {**defaults, **saved}
        except Exception:
            cfg = defaults

    _cache["ts"] = now
    _cache["cfg"] = cfg
    return cfg


def compute_bill(
    item_total: float,
    discounts: float,
    cfg: dict,
) -> dict:
    """Shared bill math — MUST stay in sync with frontend cart.tsx.

    taxes are applied on (items - discounts + flat fees).
    """
    visitation_fee = (
        round(float(cfg.get("visitation_fee_amount", 0) or 0), 2)
        if cfg.get("visitation_fee_enabled")
        else 0.0
    )
    platform_fee = (
        round(float(cfg.get("platform_fee_amount", 0) or 0), 2)
        if cfg.get("platform_fee_enabled")
        else 0.0
    )
    base = max(0.0, item_total - discounts) + visitation_fee + platform_fee
    taxes = (
        round(base * float(cfg.get("tax_percent", 0) or 0) / 100.0, 2)
        if cfg.get("tax_enabled")
        else 0.0
    )
    total_bill = round(max(0.0, item_total - discounts) + visitation_fee + platform_fee + taxes, 2)
    return {
        "visitation_fee": visitation_fee,
        "platform_fee": platform_fee,
        "taxes": taxes,
        "total_bill": total_bill,
    }


# ── GET ──────────────────────────────────────────────────────────────
@router.get("/billing-config")
async def get_billing_config_route():
    """Current billing config (public read — the cart needs it)."""
    return await get_billing_config()


# ── PUT ──────────────────────────────────────────────────────────────
@router.put("/billing-config")
async def update_billing_config(payload: BillingConfig):
    """Save billing config to Supabase Storage. Admin CMS only (frontend
    route already gated by isAdmin, consistent with other /admin/cms/*)."""
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

    # bust cache immediately
    _cache["ts"] = 0.0
    _cache["cfg"] = None
    return {"ok": True, "url": PUBLIC_URL, "config": body}
