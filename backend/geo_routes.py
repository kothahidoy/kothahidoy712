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
import os

import asyncio
import logging
import time
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/geo", tags=["geo"])

# Server-side Google key (Places / Geocoding / Directions). Keep this OUT of
# the mobile app bundle — only the Android Maps SDK key (which is meant to
# be public, restricted by package name + SHA1 in Google Cloud Console)
# belongs in app.json. This one lives in the backend .env only.
GOOGLE_MAPS_SERVER_KEY = os.environ.get("GOOGLE_MAPS_SERVER_KEY", "")

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


# ──────────────────────────────────────────────────────────────────────
# Google-backed endpoints (used once GOOGLE_MAPS_SERVER_KEY is set).
# Kept separate from the Nominatim /reverse above so nothing that already
# works breaks — the address-search screens call these new ones, existing
# reverse-geocode-on-GPS-detect flows keep using /reverse unless swapped.
# ──────────────────────────────────────────────────────────────────────

def _require_google_key():
    if not GOOGLE_MAPS_SERVER_KEY:
        raise HTTPException(
            503,
            "Google Maps server key not configured — set GOOGLE_MAPS_SERVER_KEY in backend .env",
        )


@router.get("/autocomplete")
async def places_autocomplete(
    input: str = Query(..., min_length=1),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
):
    """Places Autocomplete — powers the search-as-you-type address box."""
    _require_google_key()
    params = {
        "input": input,
        "key": GOOGLE_MAPS_SERVER_KEY,
        "components": "country:in",
        "language": "en",
    }
    if lat is not None and lon is not None:
        params["location"] = f"{lat},{lon}"
        params["radius"] = "30000"
    async with httpx.AsyncClient(timeout=8.0) as client:
        r = await client.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            params=params,
        )
    data = r.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        logger.warning("Places autocomplete error: %s", data.get("status"))
        raise HTTPException(502, data.get("error_message") or data.get("status", "Autocomplete failed"))
    return {
        "predictions": [
            {
                "place_id": p["place_id"],
                "description": p["description"],
                "main_text": p.get("structured_formatting", {}).get("main_text", p["description"]),
                "secondary_text": p.get("structured_formatting", {}).get("secondary_text", ""),
            }
            for p in data.get("predictions", [])
        ]
    }


@router.get("/place-details")
async def place_details(place_id: str = Query(...)):
    """Resolve a Places Autocomplete prediction into lat/lng + address parts."""
    _require_google_key()
    async with httpx.AsyncClient(timeout=8.0) as client:
        r = await client.get(
            "https://maps.googleapis.com/maps/api/place/details/json",
            params={
                "place_id": place_id,
                "key": GOOGLE_MAPS_SERVER_KEY,
                "fields": "formatted_address,geometry,address_component,name",
            },
        )
    data = r.json()
    if data.get("status") != "OK":
        raise HTTPException(502, data.get("error_message") or data.get("status", "Place details failed"))
    result = data["result"]
    loc = result["geometry"]["location"]

    comp = {c["types"][0]: c["long_name"] for c in result.get("address_components", []) if c.get("types")}
    return {
        "latitude": loc["lat"],
        "longitude": loc["lng"],
        "name": result.get("name", ""),
        "address_line": result.get("formatted_address", ""),
        "area": comp.get("sublocality_level_1") or comp.get("neighborhood", ""),
        "city": comp.get("locality") or comp.get("administrative_area_level_2", ""),
        "state": comp.get("administrative_area_level_1", ""),
        "pincode": comp.get("postal_code", ""),
    }


@router.get("/reverse-google")
async def reverse_geocode_google(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    """Google Geocoding reverse lookup — an alternative to /reverse
    (Nominatim) for when a more reliably-formatted address is needed."""
    _require_google_key()
    async with httpx.AsyncClient(timeout=8.0) as client:
        r = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"latlng": f"{lat},{lon}", "key": GOOGLE_MAPS_SERVER_KEY, "language": "en"},
        )
    data = r.json()
    if data.get("status") != "OK" or not data.get("results"):
        raise HTTPException(502, data.get("error_message") or data.get("status", "Reverse geocode failed"))
    result = data["results"][0]
    comp = {c["types"][0]: c["long_name"] for c in result.get("address_components", []) if c.get("types")}
    area = comp.get("sublocality_level_1") or comp.get("neighborhood", "")
    city = comp.get("locality") or comp.get("administrative_area_level_2", "")
    return {
        "name": area or city or "Current location",
        "area": area,
        "road": comp.get("route", ""),
        "city": city,
        "state": comp.get("administrative_area_level_1", ""),
        "pincode": comp.get("postal_code", ""),
        "address_line": result.get("formatted_address", ""),
        "display_name": result.get("formatted_address", ""),
        "label": f"{area}, {city}" if area and city and area != city else (area or city or "Unknown location"),
        "latitude": lat,
        "longitude": lon,
    }


@router.get("/directions")
async def directions(
    origin_lat: float = Query(...),
    origin_lon: float = Query(...),
    dest_lat: float = Query(...),
    dest_lon: float = Query(...),
):
    """Route + ETA between a provider's live location and the customer's
    address — powers the "Pro arrives in X mins" live-tracking screen."""
    _require_google_key()
    async with httpx.AsyncClient(timeout=8.0) as client:
        r = await client.get(
            "https://maps.googleapis.com/maps/api/directions/json",
            params={
                "origin": f"{origin_lat},{origin_lon}",
                "destination": f"{dest_lat},{dest_lon}",
                "mode": "driving",
                "key": GOOGLE_MAPS_SERVER_KEY,
            },
        )
    data = r.json()
    if data.get("status") != "OK" or not data.get("routes"):
        raise HTTPException(502, data.get("error_message") or data.get("status", "Directions failed"))
    route = data["routes"][0]
    leg = route["legs"][0]
    return {
        "distance_text": leg["distance"]["text"],
        "distance_meters": leg["distance"]["value"],
        "duration_text": leg["duration"]["text"],
        "duration_seconds": leg["duration"]["value"],
        "polyline": route["overview_polyline"]["points"],
    }
