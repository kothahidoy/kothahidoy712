"""
CMS Admin Routes for Mfixit
─────────────────────────────────────────────────────────────────────────────
Provides Urban-Company-style content management:
  • Categories with sort/active toggle/image/brand-text
  • Category Banners (hero carousel — image or video slides)
  • Category Promos  (the "Get 25% off upto 200" strip)
  • Sub-categories per category
  • Services scoped to sub-category (also fully CRUD-able)
  • Image / Video file upload to Supabase Storage `cms-media` bucket

All routes prefixed with /api/admin/cms
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import httpx

router = APIRouter(prefix="/api/admin/cms", tags=["admin-cms"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def _sb_headers(prefer: str = "return=representation") -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


# ═════════════════════════════════════════════════════════════════
# Generic media upload  ·  image OR video → Supabase Storage cms-media bucket
# ═════════════════════════════════════════════════════════════════
@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    """Upload any image/video file to the cms-media bucket and return a public URL."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(500, "Supabase not configured")

    content = await file.read()
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() or "bin"
    if ext not in ("jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "webm"):
        raise HTTPException(400, f"Unsupported file type: .{ext}")
    object_name = f"{uuid.uuid4()}.{ext}"

    url = f"{SUPABASE_URL}/storage/v1/object/cms-media/{object_name}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": file.content_type or "application/octet-stream",
        "x-upsert": "true",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(url, headers=headers, content=content)
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"Upload failed: {r.text[:300]}")
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/cms-media/{object_name}"
    media_type = "video" if ext in ("mp4", "mov", "webm") else "image"
    return {"url": public_url, "type": media_type, "filename": object_name}


# ═════════════════════════════════════════════════════════════════
# Categories  (extended — sort/active/image/brand fields)
# ═════════════════════════════════════════════════════════════════
class CategoryUpsert(BaseModel):
    id: Optional[str] = None             # required for upsert
    name: str
    icon: Optional[str] = "FolderOpen"
    color: Optional[str] = "#F3F4F6"
    image_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    brand_name: Optional[str] = None
    brand_rating: Optional[float] = None
    brand_reviews_label: Optional[str] = None
    visitation_fee_label: Optional[str] = None
    visitation_fee_threshold: Optional[float] = None
    visitation_fee_active: Optional[bool] = None


@router.get("/categories")
async def list_categories():
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/categories?select=*&order=sort_order,name",
            headers=_sb_headers(),
        )
        return r.json() if r.is_success else []


@router.post("/categories")
async def upsert_category(payload: CategoryUpsert):
    body = payload.dict(exclude_none=True)
    if not body.get("id"):
        body["id"] = payload.name.lower().replace(" ", "-").replace("&", "and")[:60]
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/categories?on_conflict=id",
            headers=_sb_headers("resolution=merge-duplicates,return=representation"),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        data = r.json()
        return data[0] if isinstance(data, list) else data


@router.patch("/categories/{category_id}")
async def update_category(category_id: str, payload: CategoryUpsert):
    body = payload.dict(exclude_unset=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/categories?id=eq.{category_id}",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/categories?id=eq.{category_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


# ═════════════════════════════════════════════════════════════════
# Category banners (hero carousel)
# ═════════════════════════════════════════════════════════════════
class BannerUpsert(BaseModel):
    id: Optional[str] = None
    category_id: str
    title: str
    subtitle: Optional[str] = None
    media_type: str = "image"            # 'image' | 'video'
    media_url: str
    poster_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


@router.get("/banners")
async def list_banners(category_id: Optional[str] = None):
    q = f"?select=*&order=sort_order,created_at"
    if category_id:
        q = f"?select=*&category_id=eq.{category_id}&order=sort_order,created_at"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/category_banners{q}",
            headers=_sb_headers(),
        )
        return r.json() if r.is_success else []


@router.post("/banners")
async def create_banner(payload: BannerUpsert):
    body = payload.dict(exclude_none=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/category_banners",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        return r.json()[0] if isinstance(r.json(), list) else r.json()


@router.patch("/banners/{banner_id}")
async def update_banner(banner_id: str, payload: BannerUpsert):
    body = payload.dict(exclude_unset=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/category_banners?id=eq.{banner_id}",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


@router.delete("/banners/{banner_id}")
async def delete_banner(banner_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/category_banners?id=eq.{banner_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


# ═════════════════════════════════════════════════════════════════
# Category promos (the "Get 25% off upto 200" strip)
# ═════════════════════════════════════════════════════════════════
class PromoUpsert(BaseModel):
    id: Optional[str] = None
    category_id: str
    label: str
    sub_label: Optional[str] = None
    discount_pct: float = 0
    max_off: float = 0
    min_cart: float = 0
    badge_color: Optional[str] = "#16A34A"
    sort_order: int = 0
    is_active: bool = True


@router.get("/promos")
async def list_promos(category_id: Optional[str] = None):
    q = f"?select=*&order=sort_order,created_at"
    if category_id:
        q = f"?select=*&category_id=eq.{category_id}&order=sort_order,created_at"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/category_promos{q}",
            headers=_sb_headers(),
        )
        return r.json() if r.is_success else []


@router.post("/promos")
async def create_promo(payload: PromoUpsert):
    body = payload.dict(exclude_none=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/category_promos",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        return r.json()[0] if isinstance(r.json(), list) else r.json()


@router.patch("/promos/{promo_id}")
async def update_promo(promo_id: str, payload: PromoUpsert):
    body = payload.dict(exclude_unset=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/category_promos?id=eq.{promo_id}",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


@router.delete("/promos/{promo_id}")
async def delete_promo(promo_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/category_promos?id=eq.{promo_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


# ═════════════════════════════════════════════════════════════════
# Sub-categories
# ═════════════════════════════════════════════════════════════════
class SubCategoryUpsert(BaseModel):
    id: Optional[str] = None
    category_id: str
    name: str
    slug: Optional[str] = None
    image_url: Optional[str] = None
    badge: Optional[str] = None
    badge_color: Optional[str] = "#16A34A"
    sort_order: int = 0
    is_active: bool = True


@router.get("/sub-categories")
async def list_sub_categories(category_id: Optional[str] = None):
    q = "?select=*&order=sort_order,name"
    if category_id:
        q = f"?select=*&category_id=eq.{category_id}&order=sort_order,name"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/sub_categories{q}",
            headers=_sb_headers(),
        )
        return r.json() if r.is_success else []


@router.post("/sub-categories")
async def create_sub_category(payload: SubCategoryUpsert):
    body = payload.dict(exclude_none=True, exclude={"id"})
    if not body.get("slug"):
        body["slug"] = body["name"].lower().replace(" ", "-").replace("&", "and")
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/sub_categories",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        return r.json()[0] if isinstance(r.json(), list) else r.json()


@router.patch("/sub-categories/{sub_id}")
async def update_sub_category(sub_id: str, payload: SubCategoryUpsert):
    body = payload.dict(exclude_unset=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/sub_categories?id=eq.{sub_id}",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


@router.delete("/sub-categories/{sub_id}")
async def delete_sub_category(sub_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/sub_categories?id=eq.{sub_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


# ═════════════════════════════════════════════════════════════════
# Services (scoped CRUD — extended with sub_category_id + filtering)
# ═════════════════════════════════════════════════════════════════
class ServiceCMSUpsert(BaseModel):
    id: Optional[str] = None
    category_id: Optional[str] = None
    sub_category_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    starting_price: float = 0
    duration_mins: int = 30
    rating: Optional[float] = 4.7
    review_count: Optional[int] = 0
    image: Optional[str] = None
    short_description: Optional[str] = None
    popular: bool = False
    top_rated: bool = False
    recommended: bool = False
    is_active: bool = True
    sort_order: int = 0
    inclusions: Optional[List[str]] = None


@router.get("/services")
async def list_services_cms(
    category_id: Optional[str] = None,
    sub_category_id: Optional[str] = None,
):
    filters: List[str] = []
    if category_id:
        filters.append(f"category_id=eq.{category_id}")
    if sub_category_id:
        filters.append(f"sub_category_id=eq.{sub_category_id}")
    q = "&".join(filters)
    url = f"{SUPABASE_URL}/rest/v1/services?select=*&order=sort_order,title"
    if q:
        url += f"&{q}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=_sb_headers())
        return r.json() if r.is_success else []


@router.post("/services")
async def create_service_cms(payload: ServiceCMSUpsert):
    body = payload.dict(exclude_none=True, exclude={"id"})
    if not payload.id:
        body["id"] = f"svc-{uuid.uuid4().hex[:10]}"
    else:
        body["id"] = payload.id
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/services",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        return r.json()[0] if isinstance(r.json(), list) else r.json()


@router.patch("/services/{svc_id}")
async def update_service_cms(svc_id: str, payload: ServiceCMSUpsert):
    body = payload.dict(exclude_unset=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/services?id=eq.{svc_id}",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


@router.delete("/services/{svc_id}")
async def delete_service_cms(svc_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/services?id=eq.{svc_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


# ═════════════════════════════════════════════════════════════════
# Mfixit Cover sections (per category)
# ═════════════════════════════════════════════════════════════════
class CoverSectionUpsert(BaseModel):
    id: Optional[str] = None
    category_id: str
    section_key: str       # 'warranty' | 'expert' | 'rate' | 'benefits' | 'support'
    title: str
    bullets: Optional[List[str]] = None
    sort_order: int = 0
    is_active: bool = True


@router.get("/cover-sections")
async def list_cover_sections(category_id: Optional[str] = None):
    q = "?select=*&order=sort_order"
    if category_id:
        q = f"?select=*&category_id=eq.{category_id}&order=sort_order"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{SUPABASE_URL}/rest/v1/mfixit_cover_sections{q}", headers=_sb_headers())
        return r.json() if r.is_success else []


@router.post("/cover-sections")
async def create_cover_section(payload: CoverSectionUpsert):
    body = payload.dict(exclude_none=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/mfixit_cover_sections?on_conflict=category_id,section_key",
            headers={**_sb_headers(), "Prefer": "resolution=merge-duplicates,return=representation"},
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        return r.json()[0] if isinstance(r.json(), list) else r.json()


@router.patch("/cover-sections/{sec_id}")
async def update_cover_section(sec_id: str, payload: CoverSectionUpsert):
    body = payload.dict(exclude_unset=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/mfixit_cover_sections?id=eq.{sec_id}",
            headers=_sb_headers(), json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


@router.delete("/cover-sections/{sec_id}")
async def delete_cover_section(sec_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/mfixit_cover_sections?id=eq.{sec_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


# ═════════════════════════════════════════════════════════════════
# Rate card items (per category)
# ═════════════════════════════════════════════════════════════════
class RateCardUpsert(BaseModel):
    id: Optional[str] = None
    category_id: str
    service_name: str
    sub_label: Optional[str] = None
    price: float = 0
    price_suffix: Optional[str] = "onwards"
    sort_order: int = 0
    is_active: bool = True


@router.get("/rate-card")
async def list_rate_card(category_id: Optional[str] = None):
    q = "?select=*&order=sort_order"
    if category_id:
        q = f"?select=*&category_id=eq.{category_id}&order=sort_order"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{SUPABASE_URL}/rest/v1/rate_card_items{q}", headers=_sb_headers())
        return r.json() if r.is_success else []


@router.post("/rate-card")
async def create_rate_card_item(payload: RateCardUpsert):
    body = payload.dict(exclude_none=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(f"{SUPABASE_URL}/rest/v1/rate_card_items", headers=_sb_headers(), json=body)
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        return r.json()[0] if isinstance(r.json(), list) else r.json()


@router.patch("/rate-card/{item_id}")
async def update_rate_card_item(item_id: str, payload: RateCardUpsert):
    body = payload.dict(exclude_unset=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/rate_card_items?id=eq.{item_id}",
            headers=_sb_headers(), json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


@router.delete("/rate-card/{item_id}")
async def delete_rate_card_item(item_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/rate_card_items?id=eq.{item_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


# ═════════════════════════════════════════════════════════════════
# Public combined cover-page feed (frontend uses this)
# ═════════════════════════════════════════════════════════════════
@router.get("/public/category/{category_id}/cover")
async def public_cover(category_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        sections = await client.get(
            f"{SUPABASE_URL}/rest/v1/mfixit_cover_sections?category_id=eq.{category_id}&is_active=eq.true&order=sort_order",
            headers=_sb_headers(),
        )
        rates = await client.get(
            f"{SUPABASE_URL}/rest/v1/rate_card_items?category_id=eq.{category_id}&is_active=eq.true&order=sort_order",
            headers=_sb_headers(),
        )
        return {
            "sections": sections.json() if sections.is_success else [],
            "rate_card": rates.json() if rates.is_success else [],
        }


# ═════════════════════════════════════════════════════════════════
# Booking items breakdown (admin)
# ═════════════════════════════════════════════════════════════════
@router.get("/bookings/{booking_id}/items")
async def list_booking_items(booking_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Prefer the new booking_items table; fall back to legacy JSON column
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/booking_items"
            f"?booking_id=eq.{booking_id}&select=*&order=created_at",
            headers=_sb_headers(),
        )
        if r.is_success and r.json():
            return r.json()
        # fallback to bookings.items JSON column
        rb = await client.get(
            f"{SUPABASE_URL}/rest/v1/bookings?id=eq.{booking_id}&select=items,service_id,price",
            headers=_sb_headers(),
        )
        if rb.ok and rb.json():
            b = rb.json()[0]
            legacy = b.get("items") or []
            if legacy:
                return [
                    {
                        "id": f"legacy-{i}",
                        "service_id": it.get("service_id", b.get("service_id")),
                        "title": it.get("title", "Service"),
                        "image": it.get("image"),
                        "price": it.get("price", 0),
                        "quantity": it.get("quantity", 1),
                        "line_total": float(it.get("price", 0)) * int(it.get("quantity", 1)),
                    }
                    for i, it in enumerate(legacy)
                ]
            # single-row legacy booking
            return [
                {
                    "id": "legacy-primary",
                    "service_id": b.get("service_id", ""),
                    "title": "Service",
                    "image": None,
                    "price": b.get("price", 0),
                    "quantity": 1,
                    "line_total": b.get("price", 0),
                }
            ]
        return []


# ═════════════════════════════════════════════════════════════════
# Public CMS reads (for frontend — no auth required, RLS handles it)
# ═════════════════════════════════════════════════════════════════
@router.get("/public/category/{category_id}/cms")
async def public_category_cms(category_id: str):
    """Single endpoint that returns banners + promos + sub-categories + services
    for a category in one shot — used by the frontend category page."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        cat_r, banners_r, promos_r, subs_r, svcs_r = await client.get(
            f"{SUPABASE_URL}/rest/v1/categories?id=eq.{category_id}&select=*",
            headers=_sb_headers(),
        ), await client.get(
            f"{SUPABASE_URL}/rest/v1/category_banners?category_id=eq.{category_id}&is_active=eq.true&order=sort_order",
            headers=_sb_headers(),
        ), await client.get(
            f"{SUPABASE_URL}/rest/v1/category_promos?category_id=eq.{category_id}&is_active=eq.true&order=sort_order",
            headers=_sb_headers(),
        ), await client.get(
            f"{SUPABASE_URL}/rest/v1/sub_categories?category_id=eq.{category_id}&is_active=eq.true&order=sort_order",
            headers=_sb_headers(),
        ), await client.get(
            f"{SUPABASE_URL}/rest/v1/services?category_id=eq.{category_id}&is_active=eq.true&order=sort_order,title",
            headers=_sb_headers(),
        )
        return {
            "category": (cat_r.json()[0] if cat_r.is_success and cat_r.json() else None),
            "banners": banners_r.json() if banners_r.is_success else [],
            "promos": promos_r.json() if promos_r.is_success else [],
            "sub_categories": subs_r.json() if subs_r.is_success else [],
            "services": svcs_r.json() if svcs_r.is_success else [],
        }


# ═════════════════════════════════════════════════════════════════
# Home page promo carousel slides (image OR video)
# ═════════════════════════════════════════════════════════════════
class HomePromoUpsert(BaseModel):
    id: Optional[str] = None
    title: str
    subtitle: Optional[str] = None
    price: Optional[str] = None
    original_price: Optional[str] = None
    discount_label: Optional[str] = None
    badge_emoji: Optional[str] = "🏷️"
    cta_text: Optional[str] = "Book now"
    link_url: Optional[str] = None
    media_type: str = "image"            # 'image' | 'video'
    media_url: str
    poster_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


@router.get("/home-promos")
async def list_home_promos(active_only: bool = False):
    q = "?select=*&order=sort_order,created_at"
    if active_only:
        q = "?select=*&is_active=eq.true&order=sort_order,created_at"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/home_promos{q}",
            headers=_sb_headers(),
        )
        return r.json() if r.is_success else []


@router.post("/home-promos")
async def create_home_promo(payload: HomePromoUpsert):
    body = payload.dict(exclude_none=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/home_promos",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        data = r.json()
        return data[0] if isinstance(data, list) else data


@router.patch("/home-promos/{promo_id}")
async def update_home_promo(promo_id: str, payload: HomePromoUpsert):
    body = payload.dict(exclude_unset=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/home_promos?id=eq.{promo_id}",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


@router.delete("/home-promos/{promo_id}")
async def delete_home_promo(promo_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/home_promos?id=eq.{promo_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


# ═════════════════════════════════════════════════════════════════
# Thoughtful Curations — home screen video tiles (admin managed)
# Table: home_curations (id, title, title_line2, thumbnail_url,
#        video_url, sort_order, is_active, created_at, updated_at)
# ═════════════════════════════════════════════════════════════════
class HomeCurationUpsert(BaseModel):
    id: Optional[str] = None
    title: str
    title_line2: Optional[str] = None
    thumbnail_url: str
    video_url: str
    sort_order: int = 0
    is_active: bool = True


@router.get("/home-curations")
async def list_home_curations(active_only: bool = False):
    q = "?select=*&order=sort_order,created_at"
    if active_only:
        q = "?select=*&is_active=eq.true&order=sort_order,created_at"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/home_curations{q}",
            headers=_sb_headers(),
        )
        return r.json() if r.is_success else []


@router.post("/home-curations")
async def create_home_curation(payload: HomeCurationUpsert):
    body = payload.dict(exclude_none=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/home_curations",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        data = r.json()
        return data[0] if isinstance(data, list) else data


@router.patch("/home-curations/{curation_id}")
async def update_home_curation(curation_id: str, payload: HomeCurationUpsert):
    body = payload.dict(exclude_unset=True, exclude={"id"})
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/home_curations?id=eq.{curation_id}",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}


@router.delete("/home-curations/{curation_id}")
async def delete_home_curation(curation_id: str):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.delete(
            f"{SUPABASE_URL}/rest/v1/home_curations?id=eq.{curation_id}",
            headers=_sb_headers(),
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
        return {"ok": True}
