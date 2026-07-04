"""
Geo routes — reverse geocoding proxy.
─────────────────────────────────────
GET /api/geo/reverse?lat=..&lon=..

Uses OpenStreetMap Nominatim (free, no API key) to convert lat/lng into a
proper human-readable place name. The frontend calls this instead of relying
on expo-location's reverseGeocodeAsync (which often returns raw numbers /
plus-codes on Android and nothing on web).

An in-memory cache (rounded to ~11 m precision) keeps us well under
Nominatim's 1 req/s fair-use limit.
"""
import asyncio
import logging
import time

import httpx
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/geo", tags=["geo"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
HEADERS = {
    "User-Agent": "Mfixit-HomeServices/1.0 (support@mfixit.app)",
    "Accept-Language": "en-IN,en",
}

# cache: key -> (timestamp, payload)
_CACHE: dict = {}
_CACHE_TTL = 60 * 60 * 24  # 24 h
_lock = asyncio.Lock()
_last_call_ts = 0.0


def _first(addr: dict, keys: list) -> str:
    for k in keys:
        v = (addr.get(k) or "").strip()
        if v:
            return v
    return ""


def _compose(payload: dict) -> dict:
    addr = payload.get("address") or {}
    house = _first(addr, ["house_number"])
    road = _first(addr, ["road", "pedestrian", "footway"])
    area = _first(addr, [
        "neighbourhood", "suburb", "quarter", "hamlet", "village",
        "locality", "residential", "city_district",
    ])
    city = _first(addr, ["city", "town", "municipality", "village", "county", "state_district"])
    state = _first(addr, ["state"])
    pincode = _first(addr, ["postcode"])

    # Primary short name shown in big text (like UC's "Selampur")
    name = area or road or city or _first(addr, ["state_district"]) or state

    line_parts = []
    if house and road:
        line_parts.append(f"{house}, {road}")
    elif road:
        line_parts.append(road)
    if area and area not in line_parts:
        line_parts.append(area)
    if city and city != area:
        line_parts.append(city)
    address_line = ", ".join(p for p in line_parts if p)

    full_parts = [address_line or None, state or None, pincode or None, "India"]
    display = ", ".join(p for p in full_parts if p)

    label = f"{name}, {city}" if (name and city and name != city) else (name or city or "Unknown location")

    return {
        "name": name or city or "Current location",
        "area": area,
        "road": road,
        "city": city,
        "state": state,
        "pincode": pincode,
        "address_line": address_line or (payload.get("display_name") or "").split(",")[0],
        "display_name": display or payload.get("display_name", ""),
        "label": label,
    }


@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    """Reverse geocode lat/lng to a human-readable Indian address."""
    global _last_call_ts

    key = f"{round(lat, 4)},{round(lon, 4)}"
    cached = _CACHE.get(key)
    if cached and (time.time() - cached[0]) < _CACHE_TTL:
        return cached[1]

    async with _lock:
        # re-check cache after acquiring lock
        cached = _CACHE.get(key)
        if cached and (time.time() - cached[0]) < _CACHE_TTL:
            return cached[1]

        # Respect Nominatim's 1 req/s policy
        wait = 1.0 - (time.time() - _last_call_ts)
        if wait > 0:
            await asyncio.sleep(wait)

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    NOMINATIM_URL,
                    params={
                        "format": "jsonv2",
                        "lat": lat,
                        "lon": lon,
                        "addressdetails": 1,
                        "zoom": 17,
                    },
                    headers=HEADERS,
                )
            _last_call_ts = time.time()
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Geocoding service unavailable")
            data = resp.json()
        except HTTPException:
            raise
        except Exception as e:
            logger.warning("Nominatim reverse geocode failed: %s", e)
            raise HTTPException(status_code=502, detail="Geocoding service unavailable")

        result = _compose(data)
        result["latitude"] = lat
        result["longitude"] = lon
        _CACHE[key] = (time.time(), result)
        return result
