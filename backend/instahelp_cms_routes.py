"""
InstaHelp Screen CMS
──────────────────────────────────────────────────────────────────────
Admin-controllable content for `/app/frontend/app/category/insta-help.tsx`.

Follows the same JSON-blob-in-Storage pattern as welcome_cms_routes.py.

File path:  cms-media/instahelp-config.json
Public URL: {SUPABASE_URL}/storage/v1/object/public/cms-media/instahelp-config.json
"""
from __future__ import annotations

import os
import json
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

router = APIRouter(prefix="/api/admin/cms", tags=["admin-cms-instahelp"])

OBJECT_NAME = "instahelp-config.json"
PUBLIC_URL = f"{SUPABASE_URL}/storage/v1/object/public/cms-media/{OBJECT_NAME}"


# ── Sub-schemas ──────────────────────────────────────────────────────
class TimeSlot(BaseModel):
    id: str
    duration: str
    price: int
    original_price: int
    discount: str = ""
    enabled: bool = True


class TaskCategory(BaseModel):
    id: str
    name: str
    image: str
    inclusions: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    enabled: bool = True


class TimeEstimate(BaseModel):
    id: str
    # icon keyword (kitchen | bathroom | mopping | clock — falls back to clock)
    icon: str = "clock"
    title: str
    subtitle: str = ""
    time: str
    enabled: bool = True


class FAQItem(BaseModel):
    id: str
    question: str
    answer: str
    enabled: bool = True


class InstaHelpConfig(BaseModel):
    # ── Header ─────────────────────────────────────────
    title: str = "InstaHelp"
    rating_text: str = "4.85 (3.0 K bookings)"
    header_enabled: bool = True

    # ── Time slots (1hr / 1.5hr / 2hr / 3hr) ───────────
    time_slots_enabled: bool = True
    time_slots: List[TimeSlot] = Field(default_factory=lambda: [
        TimeSlot(id="1hr",   duration="1 hour",    price=79,  original_price=245, discount="68% OFF"),
        TimeSlot(id="1.5hr", duration="1.5 hours", price=119, original_price=369, discount="68% OFF"),
        TimeSlot(id="2hr",   duration="2 hours",   price=179, original_price=559, discount="68% OFF"),
        TimeSlot(id="3hr",   duration="3 hours",   price=269, original_price=839, discount="68% OFF"),
    ])

    # ── Earliest available slot text (OFF by default per user request) ──
    earliest_slot_enabled: bool = False
    earliest_slot_text: str = "Earliest available slot : Today, 9:15 AM"

    # ── 3-visits Super Saver Pack banner ────────────────
    super_saver_enabled: bool = True
    super_saver_badge: str = "EXTRA 60% OFF"
    super_saver_title: str = "3-visits pack at ₹245"
    super_saver_price: str = "₹49/visit"
    super_saver_validity: str = "Valid till 1 month"
    super_saver_cta: str = "Book"
    super_saver_pack_label: str = "SUPER SAVER PACK"
    super_saver_bg_color: str = "#7C3AED"

    # ── "One help who can do it all" ───────────────────
    task_categories_enabled: bool = True
    task_categories_title: str = "One help who can do it all"
    task_categories_note_enabled: bool = True
    task_categories_note: str = "Please provide cleaning equipment & supplies to the help"
    task_categories: List[TaskCategory] = Field(default_factory=lambda: [
        TaskCategory(
            id="kitchen",
            name="Kitchen & utensil cleaning",
            image="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80",
            inclusions=["Crockery & lunch boxes", "Wiping cabinet exterior", "Sink cleaning", "Gas stove wiping"],
            exclusions=["Hard food stains", "Chimney cleaning", "Heavy appliance cleaning"],
        ),
        TaskCategory(
            id="meal-prep",
            name="Meal prep & serving",
            image="https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=200&q=80",
            inclusions=["Veggies chopping & salad prep", "Meat marination", "Serving food", "Table setting"],
            exclusions=["Cooking full meals", "Non-veg cooking", "Baking"],
        ),
        TaskCategory(
            id="mopping",
            name="Mopping, dusting & wiping",
            image="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80",
            inclusions=["Dusting & Mopping floor", "Wet wiping furniture", "Bed making", "Organizing items"],
            exclusions=["Wiping walls", "Hard to reach areas", "Ceiling fans"],
        ),
        TaskCategory(
            id="bathroom",
            name="Bathroom cleaning",
            image="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80",
            inclusions=["Toilet seat cleaning", "Sink & Taps", "Floor mopping", "Mirror cleaning"],
            exclusions=["Walls scrubbing", "Hard stains removal", "Ceiling cleaning"],
        ),
        TaskCategory(
            id="laundry",
            name="Laundry & Ironing",
            image="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=200&q=80",
            inclusions=["Machine-wash & drying", "Ironing clothes", "Folding & arranging", "Sorting clothes"],
            exclusions=["Hand-washing delicates", "Dry cleaning items", "Stain removal"],
        ),
        TaskCategory(
            id="packing",
            name="Packing & un-packing",
            image="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80",
            inclusions=["Move-in / move-out help", "Vacation packing", "Wardrobe organizing", "Labeling boxes"],
            exclusions=["Lifting heavy objects", "Moving full homes", "Furniture assembly"],
        ),
    ])

    # ── "How long does it take?" ────────────────────────
    time_estimates_enabled: bool = True
    time_estimates_title: str = "How long does it take?"
    time_estimates_note: str = "These approximate time for a 3BHK home, you can ask the help to customise as per your need"
    time_estimates: List[TimeEstimate] = Field(default_factory=lambda: [
        TimeEstimate(id="kitchen-time",  icon="kitchen",  title="Kitchen & Dishwashing",    subtitle="For 3-4 members",             time="25 mins"),
        TimeEstimate(id="bathroom-time", icon="bathroom", title="1 Bathroom cleaning",       subtitle="Mopping & toilet seat cleaning", time="15 mins"),
        TimeEstimate(id="mopping-time",  icon="mopping",  title="Mopping, dusting & wiping", subtitle="For 3 bedrooms & living room",   time="55 mins"),
    ])

    # ── "What's excluded" ───────────────────────────────
    exclusions_enabled: bool = True
    exclusions_title: str = "What's excluded"
    excluded_items: List[str] = Field(default_factory=lambda: [
        "Removal of hard stains",
        "Cleaning of any heavy appliances",
        "Cooking meals",
        "Hand-washing clothes",
    ])

    # ── Mfixit cover ────────────────────────────────────
    cover_enabled: bool = True
    cover_title: str = "Stay stress free with Mfixit cover"
    cover_description: str = "Up to ₹10,000 cover if any damage happens during the job"

    # ── FAQ ─────────────────────────────────────────────
    faq_enabled: bool = True
    faq_title: str = "Frequently asked questions"
    faqs: List[FAQItem] = Field(default_factory=lambda: [
        FAQItem(id="faq1", question="Is the professional trained and verified?",
                answer="Yes, all our professionals undergo thorough background verification and are trained to deliver quality service."),
        FAQItem(id="faq2", question="Will the professional bring cleaning supplies?",
                answer="No, you need to provide cleaning equipment and supplies. The professional will use your materials."),
        FAQItem(id="faq3", question="What if the cleaning isn't complete within the selected time?",
                answer="You can extend the service by paying for additional time, or reschedule the remaining tasks."),
        FAQItem(id="faq4", question="Can I request the same professional for my booking?",
                answer="Yes, you can add preferred professionals to your favorites and request them for future bookings."),
        FAQItem(id="faq5", question="Can I schedule the service instead of booking instantly?",
                answer="Yes, you can choose 'Later' option and select a convenient time slot for your booking."),
    ])


def _service_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }


@router.get("/instahelp")
async def get_instahelp():
    """Fetch the current InstaHelp CMS config. Returns defaults if no
    config has been saved yet (first run)."""
    defaults = InstaHelpConfig().dict()
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


@router.put("/instahelp")
async def update_instahelp(payload: InstaHelpConfig):
    """Save the InstaHelp CMS config to Supabase Storage as a JSON file."""
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
