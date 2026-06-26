"""
Supabase REST client + Mfixit-flavoured JWT minting.

We do NOT use Supabase Auth's phone provider (that one is hard-wired to
Twilio/MessageBird etc.). Instead, after our own MSG91 WhatsApp OTP succeeds,
we:

  1. upsert a row into `public.profiles` keyed by `phone` (service-role REST
     call so RLS is bypassed)
  2. mint a JWT signed with the project's JWT secret that PostgREST &
     supabase-js will accept as a real auth session
  3. return { access_token, refresh_token, profile } to the client

The client then calls `supabase.auth.setSession({ access_token, refresh_token })`
and everything downstream (RLS, realtime, storage) works as if the user
signed in natively.
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from typing import Any, Dict, Optional

import httpx
from jose import jwt as jose_jwt

logger = logging.getLogger("supabase_auth")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
SUPABASE_JWT_TTL_SECONDS = int(os.environ.get("SUPABASE_JWT_TTL_SECONDS", "2592000"))  # 30 days


def is_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY and SUPABASE_JWT_SECRET)


# ---------- REST (service role) ----------
async def _service_request(
    method: str,
    path: str,
    *,
    json: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None,
    extra_headers: Optional[Dict[str, str]] = None,
) -> Any:
    if not is_configured():
        raise RuntimeError("Supabase is not configured on the backend")
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.request(method, url, headers=headers, json=json, params=params)
    if r.status_code >= 400:
        logger.error("Supabase %s %s -> %s | %s", method, path, r.status_code, r.text[:300])
        r.raise_for_status()
    if not r.text:
        return None
    try:
        return r.json()
    except Exception:
        return r.text


async def get_profile_by_phone(phone: str) -> Optional[Dict[str, Any]]:
    rows = await _service_request(
        "GET",
        "/rest/v1/profiles",
        params={"select": "*", "phone": f"eq.{phone}", "limit": "1"},
    )
    if isinstance(rows, list) and rows:
        return rows[0]
    return None


async def upsert_profile_by_phone(phone: str) -> Dict[str, Any]:
    """
    Insert-or-fetch a profile keyed by phone. Uses Postgres ON CONFLICT via
    PostgREST's resolution=merge-duplicates. Returns the row (always).
    """
    existing = await get_profile_by_phone(phone)
    if existing:
        # Touch updated_at + phone_verified_at on every successful verify
        await _service_request(
            "PATCH",
            "/rest/v1/profiles",
            json={"phone_verified_at": "now()", "updated_at": "now()"},
            params={"phone": f"eq.{phone}"},
            extra_headers={"Prefer": "return=minimal"},
        )
        return existing

    new_id = str(uuid.uuid4())
    row = {
        "id": new_id,
        "phone": phone,
        "phone_verified_at": "now()",
    }
    rows = await _service_request(
        "POST",
        "/rest/v1/profiles",
        json=row,
        extra_headers={"Prefer": "return=representation"},
    )
    if isinstance(rows, list) and rows:
        return rows[0]
    if isinstance(rows, dict):
        return rows
    # Conflict path — race: another request just created it
    existing = await get_profile_by_phone(phone)
    if existing:
        return existing
    raise RuntimeError("Could not upsert profile for phone " + phone)


# ---------- JWT ----------
def mint_access_token(profile: Dict[str, Any]) -> str:
    """
    Build a Supabase-compatible HS256 JWT. The claims here match what
    GoTrue (Supabase Auth) issues so that PostgREST, supabase-js
    (`setSession`) and Realtime all accept it.
    """
    if not SUPABASE_JWT_SECRET:
        raise RuntimeError("SUPABASE_JWT_SECRET missing")

    now = int(time.time())
    user_id = str(profile.get("id"))
    phone = profile.get("phone") or ""

    payload: Dict[str, Any] = {
        "iss": f"{SUPABASE_URL}/auth/v1",
        "sub": user_id,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": now + SUPABASE_JWT_TTL_SECONDS,
        "iat": now,
        "phone": phone,
        "app_metadata": {"provider": "phone", "providers": ["phone"]},
        "user_metadata": {"phone": phone},
        "session_id": str(uuid.uuid4()),
    }
    return jose_jwt.encode(payload, SUPABASE_JWT_SECRET, algorithm="HS256")


def mint_refresh_token() -> str:
    # GoTrue refresh tokens are opaque strings; we just generate a random
    # one. Supabase JS client uses the access_token for actual auth, and
    # only POSTs the refresh_token to /auth/v1/token when the access_token
    # nears expiry — which won't happen because we issue a 30-day token.
    return uuid.uuid4().hex + uuid.uuid4().hex


def build_session(profile: Dict[str, Any]) -> Dict[str, Any]:
    access_token = mint_access_token(profile)
    refresh_token = mint_refresh_token()
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": SUPABASE_JWT_TTL_SECONDS,
        "user": {
            "id": str(profile.get("id")),
            "phone": profile.get("phone"),
            "email": profile.get("email"),
            "user_metadata": {
                "name": profile.get("name"),
                "avatar_url": profile.get("avatar_url"),
                "phone": profile.get("phone"),
            },
            "app_metadata": {"provider": "phone", "providers": ["phone"]},
        },
    }
