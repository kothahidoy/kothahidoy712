"""
MSG91 WhatsApp OTP routes.
Endpoints:
  POST /api/auth/otp/send    -> sends a 6-digit OTP via WhatsApp using MSG91
  POST /api/auth/otp/verify  -> verifies the OTP entered by the user
  POST /api/auth/otp/resend  -> resends the same OTP (enforces cooldown)

This module is intentionally self-contained (its own DB handle, its own httpx
client). Mounted from server.py.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from pydantic import BaseModel, Field

import supabase_auth

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger("otp_routes")

# ---------- Config ----------
MSG91_AUTHKEY = os.environ.get("MSG91_AUTHKEY", "")
MSG91_INTEGRATED_NUMBER = os.environ.get("MSG91_INTEGRATED_NUMBER", "")
MSG91_TEMPLATE_NAME = os.environ.get("MSG91_TEMPLATE_NAME", "mfixit_otp")
MSG91_TEMPLATE_NAMESPACE = os.environ.get("MSG91_TEMPLATE_NAMESPACE", "")
MSG91_TEMPLATE_LANG = os.environ.get("MSG91_TEMPLATE_LANG", "en")

OTP_LENGTH = int(os.environ.get("OTP_LENGTH", "6"))
OTP_TTL_MINUTES = int(os.environ.get("OTP_TTL_MINUTES", "15"))
OTP_RESEND_AFTER_SECONDS = int(os.environ.get("OTP_RESEND_AFTER_SECONDS", "25"))
OTP_MAX_ATTEMPTS = int(os.environ.get("OTP_MAX_ATTEMPTS", "5"))
OTP_MAX_RESENDS = int(os.environ.get("OTP_MAX_RESENDS", "3"))
OTP_PEPPER = os.environ.get("OTP_PEPPER", "mfixit-otp-pepper")

MSG91_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/"

# ---------- Mongo ----------
mongo_url = os.environ["MONGO_URL"]
_client = AsyncIOMotorClient(mongo_url)
_db = _client[os.environ["DB_NAME"]]
otp_col = _db["otp_sessions"]


async def _ensure_indexes() -> None:
    try:
        # TTL index — auto-delete after `expires_at`
        await otp_col.create_index("expires_at", expireAfterSeconds=0)
        await otp_col.create_index([("phone", 1), ("created_at", -1)])
    except Exception as e:  # pragma: no cover
        logger.warning("Failed to create otp_sessions indexes: %s", e)


# ---------- Router ----------
router = APIRouter(prefix="/api/auth/otp", tags=["auth-otp"])


# ---------- Models ----------
class SendOtpIn(BaseModel):
    phone: str = Field(..., description="Phone in +91 / 91 / 10-digit form")


class VerifyOtpIn(BaseModel):
    phone: str
    otp: str


class ResendOtpIn(BaseModel):
    phone: str


# ---------- Helpers ----------
def normalize_phone(raw: str) -> str:
    """Normalize an Indian phone number to MSG91 format (e.g. 919876543210)."""
    if not raw:
        raise HTTPException(status_code=400, detail="Phone is required")
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        return "91" + digits
    if len(digits) == 12 and digits.startswith("91"):
        return digits
    if len(digits) == 13 and digits.startswith("091"):
        return digits[1:]
    raise HTTPException(
        status_code=400,
        detail="Enter a valid Indian phone number (10 digits or +91XXXXXXXXXX)",
    )


def hash_otp(otp: str) -> str:
    return hmac.new(OTP_PEPPER.encode(), otp.encode(), hashlib.sha256).hexdigest()


def new_otp() -> str:
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


async def send_whatsapp_otp(phone: str, otp: str) -> Dict[str, Any]:
    """Call MSG91 WhatsApp outbound API to deliver the OTP template."""
    if not (MSG91_AUTHKEY and MSG91_INTEGRATED_NUMBER and MSG91_TEMPLATE_NAMESPACE):
        # If MSG91 is not configured fall back to console-log demo mode.
        logger.warning("[MSG91] not configured — DEMO mode. OTP for %s = %s", phone, otp)
        return {"demo": True, "otp": otp}

    payload = {
        "integrated_number": MSG91_INTEGRATED_NUMBER,
        "content_type": "template",
        "payload": {
            "messaging_product": "whatsapp",
            "type": "template",
            "template": {
                "name": MSG91_TEMPLATE_NAME,
                "language": {"code": MSG91_TEMPLATE_LANG, "policy": "deterministic"},
                "namespace": MSG91_TEMPLATE_NAMESPACE,
                "to_and_components": [
                    {
                        "to": [phone],
                        "components": {
                            "body_1": {"type": "text", "value": otp},
                            "button_1": {"subtype": "url", "type": "text", "value": otp},
                        },
                    }
                ],
            },
        },
    }

    headers = {"authkey": MSG91_AUTHKEY, "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=20) as http:
            r = await http.post(MSG91_URL, json=payload, headers=headers)
        if r.status_code >= 400:
            logger.error("MSG91 send failed [%s]: %s", r.status_code, r.text[:300])
            raise HTTPException(
                status_code=502,
                detail=f"WhatsApp provider error (HTTP {r.status_code}). Please try again.",
            )
        body: Any
        try:
            body = r.json()
        except Exception:
            body = {"raw": r.text[:200]}
        return body if isinstance(body, dict) else {"data": body}
    except httpx.HTTPError as e:
        logger.exception("MSG91 network error: %s", e)
        raise HTTPException(status_code=502, detail="Could not reach WhatsApp provider")


# ---------- Endpoints ----------
@router.post("/send")
async def otp_send(body: SendOtpIn, request: Request):
    phone = normalize_phone(body.phone)
    now = datetime.now(timezone.utc)
    await _ensure_indexes()

    latest = await otp_col.find_one(
        {"phone": phone, "status": {"$in": ["sent", "resent"]}},
        sort=[("created_at", -1)],
    )
    if latest:
        last_sent = latest.get("last_sent_at") or latest.get("created_at")
        # MongoDB stores naive datetimes, make them timezone-aware for comparison
        if last_sent and not last_sent.tzinfo:
            last_sent = last_sent.replace(tzinfo=timezone.utc)
        if last_sent and (now - last_sent).total_seconds() < OTP_RESEND_AFTER_SECONDS:
            wait = OTP_RESEND_AFTER_SECONDS - int((now - last_sent).total_seconds())
            raise HTTPException(
                status_code=429,
                detail={"code": "RESEND_TOO_SOON", "retry_after": max(wait, 1)},
            )
        # Mark superseded so we always work with the newest session
        await otp_col.update_one({"_id": latest["_id"]}, {"$set": {"status": "superseded"}})

    otp = new_otp()
    expires_at = now + timedelta(minutes=OTP_TTL_MINUTES)

    doc = {
        "phone": phone,
        "otp_hash": hash_otp(otp),
        "expires_at": expires_at,
        "created_at": now,
        "last_sent_at": now,
        "attempts": 0,
        "resend_count": 0,
        "status": "sent",
        "ip": request.client.host if request.client else None,
    }
    inserted = await otp_col.insert_one(doc)

    try:
        provider = await send_whatsapp_otp(phone, otp)
    except HTTPException:
        # rollback the row if provider call failed
        await otp_col.delete_one({"_id": inserted.inserted_id})
        raise

    return {
        "ok": True,
        "phone": phone,
        "channel": "whatsapp",
        "otp_length": OTP_LENGTH,
        "expires_in_seconds": OTP_TTL_MINUTES * 60,
        "resend_after_seconds": OTP_RESEND_AFTER_SECONDS,
        "demo": bool(provider.get("demo")) if isinstance(provider, dict) else False,
    }


@router.post("/verify")
async def otp_verify(body: VerifyOtpIn):
    phone = normalize_phone(body.phone)
    code = re.sub(r"\D", "", body.otp or "")
    if len(code) != OTP_LENGTH:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_FORMAT", "message": f"Enter a {OTP_LENGTH}-digit code"},
        )
    now = datetime.now(timezone.utc)

    doc = await otp_col.find_one(
        {"phone": phone, "status": {"$in": ["sent", "resent"]}},
        sort=[("created_at", -1)],
    )
    if not doc:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_SESSION", "message": "No active OTP. Please request a new code."},
        )
    # MongoDB stores naive datetimes, make them timezone-aware for comparison
    expires_at = doc["expires_at"]
    if expires_at and not expires_at.tzinfo:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        await otp_col.update_one({"_id": doc["_id"]}, {"$set": {"status": "expired"}})
        raise HTTPException(
            status_code=400,
            detail={"code": "OTP_EXPIRED", "message": "Code expired. Request a new one."},
        )
    if doc.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
        await otp_col.update_one({"_id": doc["_id"]}, {"$set": {"status": "blocked"}})
        raise HTTPException(
            status_code=429,
            detail={"code": "MAX_ATTEMPTS", "message": "Too many wrong attempts. Request a new code."},
        )

    await otp_col.update_one({"_id": doc["_id"]}, {"$inc": {"attempts": 1}})

    if hmac.compare_digest(hash_otp(code), doc["otp_hash"]):
        await otp_col.update_one(
            {"_id": doc["_id"]},
            {"$set": {"status": "verified", "verified_at": now}},
        )

        # Upsert into Supabase profiles + mint a Supabase-compatible session
        session: Optional[Dict[str, Any]] = None
        is_new_user = False
        if supabase_auth.is_configured():
            try:
                existing = await supabase_auth.get_profile_by_phone(phone)
                is_new_user = existing is None
                profile = await supabase_auth.upsert_profile_by_phone(phone)
                session = supabase_auth.build_session(profile)
            except Exception as e:  # noqa: BLE001
                logger.exception("Supabase profile/session step failed: %s", e)

        return {
            "ok": True,
            "verified": True,
            "phone": phone,
            "is_new_user": is_new_user,
            "session": session,
        }

    remaining = max(OTP_MAX_ATTEMPTS - (doc.get("attempts", 0) + 1), 0)
    raise HTTPException(
        status_code=400,
        detail={"code": "INVALID_OTP", "message": "Invalid code. Please try again.", "attempts_left": remaining},
    )


@router.post("/resend")
async def otp_resend(body: ResendOtpIn):
    phone = normalize_phone(body.phone)
    now = datetime.now(timezone.utc)

    doc = await otp_col.find_one(
        {"phone": phone, "status": {"$in": ["sent", "resent"]}},
        sort=[("created_at", -1)],
    )
    if not doc:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_SESSION", "message": "No active OTP. Tap 'Send code' first."},
        )
    last_sent = doc.get("last_sent_at") or doc.get("created_at")
    # MongoDB stores naive datetimes, make them timezone-aware for comparison
    if last_sent and not last_sent.tzinfo:
        last_sent = last_sent.replace(tzinfo=timezone.utc)
    if last_sent and (now - last_sent).total_seconds() < OTP_RESEND_AFTER_SECONDS:
        wait = OTP_RESEND_AFTER_SECONDS - int((now - last_sent).total_seconds())
        raise HTTPException(
            status_code=429,
            detail={"code": "RESEND_TOO_SOON", "retry_after": max(wait, 1)},
        )
    if doc.get("resend_count", 0) >= OTP_MAX_RESENDS:
        raise HTTPException(
            status_code=429,
            detail={"code": "MAX_RESENDS", "message": "Resend limit reached. Try again later."},
        )

    # Generate a fresh OTP for the resend (more secure than re-sending the same one)
    otp = new_otp()
    expires_at = now + timedelta(minutes=OTP_TTL_MINUTES)
    await otp_col.update_one(
        {"_id": doc["_id"]},
        {
            "$inc": {"resend_count": 1},
            "$set": {
                "otp_hash": hash_otp(otp),
                "expires_at": expires_at,
                "last_sent_at": now,
                "attempts": 0,
                "status": "resent",
            },
        },
    )
    await send_whatsapp_otp(phone, otp)
    return {
        "ok": True,
        "phone": phone,
        "channel": "whatsapp",
        "resend_after_seconds": OTP_RESEND_AFTER_SECONDS,
        "expires_in_seconds": OTP_TTL_MINUTES * 60,
    }


@router.get("/health")
async def otp_health():
    """Public health endpoint to confirm MSG91 wiring is loaded (no secrets returned)."""
    return {
        "ok": True,
        "configured": bool(MSG91_AUTHKEY and MSG91_INTEGRATED_NUMBER and MSG91_TEMPLATE_NAMESPACE),
        "channel": "whatsapp",
        "template": MSG91_TEMPLATE_NAME,
        "otp_length": OTP_LENGTH,
        "ttl_minutes": OTP_TTL_MINUTES,
        "resend_after_seconds": OTP_RESEND_AFTER_SECONDS,
    }
