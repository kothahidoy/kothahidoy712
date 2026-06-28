"""
Service Detail Routes — per-service editable detail pages + variants + reviews.

Public endpoints:
  GET  /api/services/{service_id}/detail   → full data (only 5★ published reviews)
  POST /api/services/{service_id}/reviews  → customer submits a review (rating + text)

Admin endpoints (require admin auth — same pattern as admin_routes.py):
  GET    /api/admin/services/{service_id}/detail
  PUT    /api/admin/services/{service_id}/detail
  GET    /api/admin/services/{service_id}/variants
  POST   /api/admin/services/{service_id}/variants
  PUT    /api/admin/services/{service_id}/variants/{variant_id}
  DELETE /api/admin/services/{service_id}/variants/{variant_id}
  GET    /api/admin/services/{service_id}/reviews   (all reviews, all ratings)
  POST   /api/admin/services/{service_id}/reviews
  PUT    /api/admin/services/{service_id}/reviews/{review_id}
  DELETE /api/admin/services/{service_id}/reviews/{review_id}
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
import os
import httpx

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

router = APIRouter()


def _sb_headers(extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    h = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h


def _sb_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


# --------------------------------------------------------------------------- #
# Pydantic models
# --------------------------------------------------------------------------- #
class SafetyTip(BaseModel):
    text: str
    color: Optional[str] = "#F59E0B"
    icon: Optional[str] = "shield"


class ProcessStep(BaseModel):
    step: int
    title: str
    description: str
    image_url: Optional[str] = ""


class GalleryImage(BaseModel):
    image_url: str
    badge: Optional[str] = ""


class LoveUsItem(BaseModel):
    icon: Optional[str] = "heart"        # heart | sparkles | award | check | shield | star
    color: Optional[str] = "#DB2777"
    title: str
    description: Optional[str] = ""


class FAQ(BaseModel):
    question: str
    answer: str


class ServiceDetailUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    image: Optional[str] = None
    hero_image: Optional[str] = None
    warranty: Optional[str] = None
    duration_mins: Optional[int] = None
    starting_price: Optional[float] = None
    safety_tips: Optional[List[SafetyTip]] = None
    process_steps: Optional[List[ProcessStep]] = None
    inclusions: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    brands: Optional[List[str]] = None
    cover_features: Optional[List[str]] = None
    faqs: Optional[List[FAQ]] = None
    is_active: Optional[bool] = None
    gallery_title: Optional[str] = None
    gallery_images: Optional[List[GalleryImage]] = None
    loveus_title: Optional[str] = None
    loveus_items: Optional[List[LoveUsItem]] = None


class VariantCreate(BaseModel):
    name: str
    price: float
    original_price: Optional[float] = None
    duration_mins: int = 60
    image: Optional[str] = ""
    rating: float = 4.7
    review_count: int = 0
    features: List[str] = Field(default_factory=list)
    sort_order: int = 0
    is_active: bool = True


class VariantUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    duration_mins: Optional[int] = None
    image: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    features: Optional[List[str]] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class ReviewCreate(BaseModel):
    customer_name: str
    customer_avatar: Optional[str] = ""
    rating: int
    review_text: str
    is_published: Optional[bool] = None


class ReviewUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_avatar: Optional[str] = None
    rating: Optional[int] = None
    review_text: Optional[str] = None
    is_published: Optional[bool] = None


# --------------------------------------------------------------------------- #
# Helper: fetch service row
# --------------------------------------------------------------------------- #
async def _fetch_service(service_id: str) -> Optional[Dict[str, Any]]:
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.get(
            f"{SUPABASE_URL}/rest/v1/services",
            headers=_sb_headers(),
            params={"id": f"eq.{service_id}", "select": "*", "limit": "1"},
        )
        if r.status_code != 200:
            return None
        rows = r.json()
        return rows[0] if rows else None


async def _fetch_variants(service_id: str) -> List[Dict[str, Any]]:
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.get(
            f"{SUPABASE_URL}/rest/v1/service_variants",
            headers=_sb_headers(),
            params={
                "service_id": f"eq.{service_id}",
                "is_active": "eq.true",
                "select": "*",
                "order": "sort_order.asc,created_at.asc",
            },
        )
        return r.json() if r.status_code == 200 else []


async def _fetch_reviews(service_id: str, only_five_star: bool = True) -> List[Dict[str, Any]]:
    params = {
        "service_id": f"eq.{service_id}",
        "select": "*",
        "order": "created_at.desc",
    }
    if only_five_star:
        params["is_published"] = "eq.true"
        params["rating"] = "eq.5"
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.get(
            f"{SUPABASE_URL}/rest/v1/service_reviews",
            headers=_sb_headers(),
            params=params,
        )
        return r.json() if r.status_code == 200 else []


def _ensure_variants(service: Dict[str, Any], variants: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Auto-generate Standard/Premium if no variants exist (backwards compat)."""
    if variants:
        return variants
    base_price = float(service.get("starting_price") or 199)
    dur = int(service.get("duration_mins") or 60)
    img = service.get("image") or ""
    rating = float(service.get("rating") or 4.7)
    rc = int(service.get("review_count") or 0)
    out = [
        {
            "id": "auto-standard",
            "service_id": service["id"],
            "name": "Standard",
            "price": base_price,
            "original_price": None,
            "duration_mins": dur,
            "image": img,
            "rating": rating,
            "review_count": rc,
            "features": [],
            "sort_order": 0,
            "is_active": True,
            "auto_generated": True,
        }
    ]
    if base_price > 100:
        out.append({
            "id": "auto-premium",
            "service_id": service["id"],
            "name": "Premium",
            "price": round(base_price * 1.5),
            "original_price": round(base_price * 1.8),
            "duration_mins": dur + 30,
            "image": img,
            "rating": rating + 0.1,
            "review_count": max(1, rc // 3),
            "features": [],
            "sort_order": 1,
            "is_active": True,
            "auto_generated": True,
        })
    return out


# --------------------------------------------------------------------------- #
# PUBLIC endpoints
# --------------------------------------------------------------------------- #
@router.get("/services/{service_id}/detail")
async def get_service_detail_public(service_id: str):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    service = await _fetch_service(service_id)
    if not service:
        raise HTTPException(404, "Service not found")
    variants = await _fetch_variants(service_id)
    variants = _ensure_variants(service, variants)
    reviews = await _fetch_reviews(service_id, only_five_star=True)
    return {"service": service, "variants": variants, "reviews": reviews}


@router.post("/services/{service_id}/reviews", status_code=201)
async def submit_review_public(service_id: str, payload: ReviewCreate):
    """Customer review submission — defaults to is_published=False for admin moderation
    if rating < 5. is_published=True only for 5★ but admin can hide."""
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(400, "rating must be between 1 and 5")
    service = await _fetch_service(service_id)
    if not service:
        raise HTTPException(404, "Service not found")
    body = payload.dict()
    body["service_id"] = service_id
    # By default: publish 5★ immediately, lower ratings unpublished for admin review
    if "is_published" not in body or body.get("is_published") is None:
        body["is_published"] = payload.rating == 5
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.post(
            f"{SUPABASE_URL}/rest/v1/service_reviews",
            headers=_sb_headers({"Prefer": "return=representation"}),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(500, f"Failed to create review: {r.text}")
        return r.json()[0]


# --------------------------------------------------------------------------- #
# ADMIN endpoints — service detail editing
# --------------------------------------------------------------------------- #
@router.get("/admin/services/{service_id}/detail")
async def admin_get_service_detail(service_id: str):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    service = await _fetch_service(service_id)
    if not service:
        raise HTTPException(404, "Service not found")
    variants = await _fetch_variants(service_id)
    reviews = await _fetch_reviews(service_id, only_five_star=False)
    return {"service": service, "variants": variants, "reviews": reviews}


@router.put("/admin/services/{service_id}/detail")
async def admin_update_service_detail(service_id: str, payload: ServiceDetailUpdate):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    body = {k: v for k, v in payload.dict().items() if v is not None}
    if not body:
        raise HTTPException(400, "No fields to update")
    # Convert pydantic submodels to plain dicts/lists
    for k in ("safety_tips", "process_steps", "faqs", "gallery_images", "loveus_items"):
        if k in body and isinstance(body[k], list):
            body[k] = [
                (i if isinstance(i, dict) else i.dict() if hasattr(i, "dict") else i)
                for i in body[k]
            ]
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.patch(
            f"{SUPABASE_URL}/rest/v1/services?id=eq.{service_id}",
            headers=_sb_headers({"Prefer": "return=representation"}),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(500, f"Update failed: {r.text}")
        data = r.json() if r.status_code == 200 and r.text else []
        return data[0] if data else {"ok": True, "id": service_id}


# --------------------------------------------------------------------------- #
# ADMIN endpoints — variants CRUD
# --------------------------------------------------------------------------- #
@router.get("/admin/services/{service_id}/variants")
async def admin_list_variants(service_id: str):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.get(
            f"{SUPABASE_URL}/rest/v1/service_variants",
            headers=_sb_headers(),
            params={
                "service_id": f"eq.{service_id}",
                "select": "*",
                "order": "sort_order.asc,created_at.asc",
            },
        )
        if r.status_code != 200:
            raise HTTPException(500, f"Failed: {r.text}")
        return r.json()


@router.post("/admin/services/{service_id}/variants", status_code=201)
async def admin_create_variant(service_id: str, payload: VariantCreate):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    body = payload.dict()
    body["service_id"] = service_id
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.post(
            f"{SUPABASE_URL}/rest/v1/service_variants",
            headers=_sb_headers({"Prefer": "return=representation"}),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(500, f"Create failed: {r.text}")
        return r.json()[0]


@router.put("/admin/services/{service_id}/variants/{variant_id}")
async def admin_update_variant(service_id: str, variant_id: str, payload: VariantUpdate):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    body = {k: v for k, v in payload.dict().items() if v is not None}
    if not body:
        raise HTTPException(400, "No fields to update")
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.patch(
            f"{SUPABASE_URL}/rest/v1/service_variants?id=eq.{variant_id}&service_id=eq.{service_id}",
            headers=_sb_headers({"Prefer": "return=representation"}),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(500, f"Update failed: {r.text}")
        data = r.json() if r.status_code == 200 and r.text else []
        return data[0] if data else {"ok": True, "id": variant_id}


@router.delete("/admin/services/{service_id}/variants/{variant_id}")
async def admin_delete_variant(service_id: str, variant_id: str):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.delete(
            f"{SUPABASE_URL}/rest/v1/service_variants?id=eq.{variant_id}&service_id=eq.{service_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(500, f"Delete failed: {r.text}")
        return {"ok": True}


# --------------------------------------------------------------------------- #
# ADMIN endpoints — reviews CRUD
# --------------------------------------------------------------------------- #
@router.get("/admin/services/{service_id}/reviews")
async def admin_list_reviews(service_id: str):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    return await _fetch_reviews(service_id, only_five_star=False)


@router.post("/admin/services/{service_id}/reviews", status_code=201)
async def admin_create_review(service_id: str, payload: ReviewCreate):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(400, "rating must be between 1 and 5")
    body = payload.dict()
    body["service_id"] = service_id
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.post(
            f"{SUPABASE_URL}/rest/v1/service_reviews",
            headers=_sb_headers({"Prefer": "return=representation"}),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(500, f"Create failed: {r.text}")
        return r.json()[0]


@router.put("/admin/services/{service_id}/reviews/{review_id}")
async def admin_update_review(service_id: str, review_id: str, payload: ReviewUpdate):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    body = {k: v for k, v in payload.dict().items() if v is not None}
    if not body:
        raise HTTPException(400, "No fields to update")
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.patch(
            f"{SUPABASE_URL}/rest/v1/service_reviews?id=eq.{review_id}&service_id=eq.{service_id}",
            headers=_sb_headers({"Prefer": "return=representation"}),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(500, f"Update failed: {r.text}")
        data = r.json() if r.status_code == 200 and r.text else []
        return data[0] if data else {"ok": True, "id": review_id}


@router.delete("/admin/services/{service_id}/reviews/{review_id}")
async def admin_delete_review(service_id: str, review_id: str):
    if not _sb_configured():
        raise HTTPException(503, "Supabase not configured")
    async with httpx.AsyncClient(timeout=20.0) as cx:
        r = await cx.delete(
            f"{SUPABASE_URL}/rest/v1/service_reviews?id=eq.{review_id}&service_id=eq.{service_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(500, f"Delete failed: {r.text}")
        return {"ok": True}
