"""
Booking API Routes for Mfixit App — Urban Company-style flow
Endpoints:
  GET  /api/booking/slots?date=YYYY-MM-DD       → available time slots for a date
  GET  /api/booking/slots/dates?days=7          → list of upcoming dates with slot availability
  GET  /api/booking/plus-plans                  → list active Plus membership plans
  GET  /api/booking/plus/status                 → current user's active Plus subscription (auth)
  POST /api/booking/plus/subscribe              → subscribe to a Plus plan (auth)
  GET  /api/booking/coupons?cart_total=X        → applicable coupons for a cart total
  POST /api/booking/coupons/apply               → validate + return discount for a coupon code
  GET  /api/booking/recommendations             → "People also take" - real services
  POST /api/booking/create                      → create a booking from cart (auth)
"""
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date as date_cls, datetime, timedelta
import os
import httpx

router = APIRouter(prefix="/api/booking", tags=["booking"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def _sb_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def _user_id_from_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {token}"},
        )
        if r.status_code != 200:
            return None
        auth_user_id = r.json().get("id")
        ur = await client.get(
            f"{SUPABASE_URL}/rest/v1/users?auth_user_id=eq.{auth_user_id}&select=id,phone,name",
            headers=_sb_headers(),
        )
        if ur.status_code == 200 and ur.json():
            return ur.json()[0]["id"]
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Slots
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/slots")
async def get_slots(date: str = Query(..., description="YYYY-MM-DD")):
    """Return all available time slots for a given date."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/slots?date=eq.{date}&available=eq.true&select=id,date,time,available&order=time",
            headers=_sb_headers(),
        )
        if r.status_code != 200:
            return {"date": date, "slots": []}
        return {"date": date, "slots": r.json()}


@router.get("/slots/dates")
async def get_slot_dates(days: int = Query(7, ge=1, le=30)):
    """Return list of upcoming dates with slot count (for the date picker)."""
    today = date_cls.today()
    end = today + timedelta(days=days - 1)
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/slots?date=gte.{today.isoformat()}&date=lte.{end.isoformat()}&available=eq.true&select=date",
            headers=_sb_headers(),
        )
        rows = r.json() if r.status_code == 200 else []
        # count per date
        counts: Dict[str, int] = {}
        for row in rows:
            counts[row["date"]] = counts.get(row["date"], 0) + 1
        result = []
        for i in range(days):
            d = today + timedelta(days=i)
            iso = d.isoformat()
            result.append({
                "date": iso,
                "day_name": d.strftime("%a"),
                "day_num": d.day,
                "slot_count": counts.get(iso, 0),
            })
        return {"dates": result}


# ─────────────────────────────────────────────────────────────────────────────
# Plus membership
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/plus-plans")
async def list_plus_plans():
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/plus_plans?is_active=eq.true&select=*&order=display_order",
            headers=_sb_headers(),
        )
        if r.status_code != 200:
            return {"plans": []}
        return {"plans": r.json()}


@router.get("/plus/status")
async def plus_status(authorization: Optional[str] = Header(None)):
    uid = await _user_id_from_token(authorization)
    if not uid:
        return {"active": False, "subscription": None}
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/plus_subscriptions"
            f"?user_id=eq.{uid}&is_active=eq.true&expires_at=gt.{datetime.utcnow().isoformat()}"
            f"&select=*,plus_plans(name,duration_months)&order=expires_at.desc&limit=1",
            headers=_sb_headers(),
        )
        if r.status_code != 200 or not r.json():
            return {"active": False, "subscription": None}
        return {"active": True, "subscription": r.json()[0]}


class PlusSubscribe(BaseModel):
    plan_id: str


@router.post("/plus/subscribe")
async def plus_subscribe(payload: PlusSubscribe, authorization: Optional[str] = Header(None)):
    uid = await _user_id_from_token(authorization)
    if not uid:
        raise HTTPException(401, "Please sign in")
    async with httpx.AsyncClient(timeout=15.0) as client:
        pr = await client.get(
            f"{SUPABASE_URL}/rest/v1/plus_plans?id=eq.{payload.plan_id}&select=*",
            headers=_sb_headers(),
        )
        if pr.status_code != 200 or not pr.json():
            raise HTTPException(404, "Plan not found")
        plan = pr.json()[0]
        expires = datetime.utcnow() + timedelta(days=30 * plan["duration_months"])
        # deactivate previous
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/plus_subscriptions?user_id=eq.{uid}&is_active=eq.true",
            headers=_sb_headers(),
            json={"is_active": False},
        )
        ins = await client.post(
            f"{SUPABASE_URL}/rest/v1/plus_subscriptions",
            headers=_sb_headers(),
            json={
                "user_id": uid,
                "plan_id": payload.plan_id,
                "expires_at": expires.isoformat(),
                "is_active": True,
            },
        )
        if ins.status_code not in (200, 201):
            raise HTTPException(ins.status_code, ins.text)
        sub = ins.json()
        if isinstance(sub, list):
            sub = sub[0]
        return {"subscription": sub, "plan": plan}


# ─────────────────────────────────────────────────────────────────────────────
# Coupons
# ─────────────────────────────────────────────────────────────────────────────
def _calc_discount(coupon: dict, cart_total: float) -> float:
    if cart_total < float(coupon.get("min_cart_value", 0) or 0):
        return 0.0
    if coupon["discount_type"] == "flat":
        d = float(coupon["discount_value"])
    else:  # percent
        d = cart_total * float(coupon["discount_value"]) / 100.0
    if coupon.get("max_discount"):
        d = min(d, float(coupon["max_discount"]))
    return round(d, 2)


@router.get("/coupons")
async def list_coupons(cart_total: float = Query(0)):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/coupons?is_active=eq.true&select=*&order=min_cart_value",
            headers=_sb_headers(),
        )
        if r.status_code != 200:
            return {"coupons": []}
        out = []
        for c in r.json():
            applicable = cart_total >= float(c.get("min_cart_value", 0) or 0)
            out.append({
                **c,
                "applicable": applicable,
                "discount": _calc_discount(c, cart_total) if applicable else 0.0,
            })
        return {"coupons": out}


class CouponApply(BaseModel):
    code: str
    cart_total: float


@router.post("/coupons/apply")
async def apply_coupon(payload: CouponApply):
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/coupons?code=eq.{payload.code}&is_active=eq.true&select=*",
            headers=_sb_headers(),
        )
        if r.status_code != 200 or not r.json():
            raise HTTPException(404, "Invalid coupon code")
        c = r.json()[0]
        min_val = float(c.get("min_cart_value", 0) or 0)
        if payload.cart_total < min_val:
            raise HTTPException(400, f"Minimum cart value ₹{min_val:.0f} required")
        return {"coupon": c, "discount": _calc_discount(c, payload.cart_total)}


# ─────────────────────────────────────────────────────────────────────────────
# Recommendations — "People also take"
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/recommendations")
async def recommendations(
    category_id: Optional[str] = Query(None, description="single id OR comma-separated list of ids"),
    exclude: Optional[str] = Query(None, description="comma-separated service IDs to exclude"),
    limit: int = Query(8, ge=1, le=20),
):
    """Return top-rated / popular services for the 'People also take' carousel.
    Supports a single category_id OR a comma-separated list of categories
    (useful when one route maps to multiple DB categories, e.g. 'ac-appliance' → 'appliance,ac-repair').
    """
    exclude_ids = [x.strip() for x in (exclude or "").split(",") if x.strip()]
    cat_ids = [c.strip() for c in (category_id or "").split(",") if c.strip()]
    async with httpx.AsyncClient(timeout=15.0) as client:
        base = "select=id,title,image,starting_price,rating,review_count,duration_mins,category_id&order=rating.desc,review_count.desc"
        if cat_ids:
            if len(cat_ids) == 1:
                cat_filter = f"category_id=eq.{cat_ids[0]}"
            else:
                cat_filter = f"category_id=in.({','.join(cat_ids)})"
            url = f"{SUPABASE_URL}/rest/v1/services?is_active=eq.true&{cat_filter}&{base}&limit={limit + len(exclude_ids) + 4}"
        else:
            url = f"{SUPABASE_URL}/rest/v1/services?is_active=eq.true&{base}&limit={limit + len(exclude_ids) + 4}"
        r = await client.get(url, headers=_sb_headers())
        items = r.json() if r.status_code == 200 else []
        # if too few same-category, top up with general
        if cat_ids and len(items) < limit:
            r2 = await client.get(
                f"{SUPABASE_URL}/rest/v1/services?is_active=eq.true&{base}&limit={limit + 6}",
                headers=_sb_headers(),
            )
            extra = r2.json() if r2.status_code == 200 else []
            existing_ids = {i["id"] for i in items}
            for e in extra:
                if e["id"] not in existing_ids:
                    items.append(e)
        # filter excluded
        items = [i for i in items if i["id"] not in exclude_ids][:limit]
        return {"items": items}


# ─────────────────────────────────────────────────────────────────────────────
# Create Booking (from cart)
# ─────────────────────────────────────────────────────────────────────────────
class BookingItem(BaseModel):
    service_id: str
    quantity: int = 1
    price: float
    title: Optional[str] = None
    image: Optional[str] = None


class BookingCreate(BaseModel):
    items: List[BookingItem]
    address: Dict[str, Any]
    slot_date: str          # YYYY-MM-DD
    slot_time: str          # "03:30 PM"
    payment_method: str = "cash"  # "razorpay" or "cash"
    coupon_code: Optional[str] = None
    tip_amount: float = 0.0
    plus_plan_id: Optional[str] = None  # if user is also subscribing to Plus
    notes: Optional[str] = None


@router.post("/create")
async def create_booking(payload: BookingCreate, authorization: Optional[str] = Header(None)):
    uid = await _user_id_from_token(authorization)
    if not uid:
        raise HTTPException(401, "Please sign in")

    if not payload.items:
        raise HTTPException(400, "Cart is empty")

    item_total = sum(it.price * it.quantity for it in payload.items)
    coupon_discount = 0.0
    coupon_obj = None
    plus_discount = 0.0

    async with httpx.AsyncClient(timeout=15.0) as client:
        # Validate coupon
        if payload.coupon_code:
            cr = await client.get(
                f"{SUPABASE_URL}/rest/v1/coupons?code=eq.{payload.coupon_code}&is_active=eq.true&select=*",
                headers=_sb_headers(),
            )
            if cr.status_code == 200 and cr.json():
                coupon_obj = cr.json()[0]
                if item_total >= float(coupon_obj.get("min_cart_value", 0) or 0):
                    coupon_discount = _calc_discount(coupon_obj, item_total)

        # Check Plus active for user → apply 10% (or 15% for 12-month) up to plan max
        ps = await client.get(
            f"{SUPABASE_URL}/rest/v1/plus_subscriptions"
            f"?user_id=eq.{uid}&is_active=eq.true&expires_at=gt.{datetime.utcnow().isoformat()}"
            f"&select=*,plus_plans(duration_months)&limit=1",
            headers=_sb_headers(),
        )
        plus_active_now = ps.status_code == 200 and ps.json()
        # also: subscribing to plus now in this booking
        plus_subscribed_now = False
        plus_price = 0.0
        if payload.plus_plan_id:
            pr = await client.get(
                f"{SUPABASE_URL}/rest/v1/plus_plans?id=eq.{payload.plus_plan_id}&select=*",
                headers=_sb_headers(),
            )
            if pr.status_code == 200 and pr.json():
                plan = pr.json()[0]
                plus_price = float(plan["price"])
                # create subscription now
                expires = datetime.utcnow() + timedelta(days=30 * plan["duration_months"])
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/plus_subscriptions?user_id=eq.{uid}&is_active=eq.true",
                    headers=_sb_headers(),
                    json={"is_active": False},
                )
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/plus_subscriptions",
                    headers=_sb_headers(),
                    json={
                        "user_id": uid,
                        "plan_id": payload.plus_plan_id,
                        "expires_at": expires.isoformat(),
                        "is_active": True,
                    },
                )
                plus_subscribed_now = True

        if plus_active_now or plus_subscribed_now:
            pct = 15.0 if (plus_active_now and ps.json()[0].get("plus_plans", {}).get("duration_months", 0) >= 12) else 10.0
            d = item_total * pct / 100.0
            plus_discount = round(min(d, 100.0), 2)

        taxes = round((item_total - coupon_discount - plus_discount) * 0.08, 2)  # 8% taxes
        if taxes < 0:
            taxes = 0
        grand_total = round(item_total - coupon_discount - plus_discount + taxes + payload.tip_amount + plus_price, 2)

        # Get primary service for legacy fields
        primary = payload.items[0]
        # Map slot time → ISO datetime for scheduled_at
        scheduled_at = f"{payload.slot_date}T00:00:00+00:00"

        booking_row = {
            "user_id": uid,
            "service_id": primary.service_id,
            "scheduled_date": payload.slot_date,
            "time_slot": payload.slot_time,
            "address_line": payload.address.get("addressLine") or payload.address.get("address_line", ""),
            "city": payload.address.get("city", ""),
            "landmark": payload.address.get("landmark"),
            "latitude": payload.address.get("latitude"),
            "longitude": payload.address.get("longitude"),
            "notes": payload.notes,
            "price": grand_total,
            "status": "pending",
            "payment_method": payload.payment_method,
            "payment_status": "unpaid",
            "tip_amount": payload.tip_amount,
            "coupon_code": payload.coupon_code,
            "coupon_discount": coupon_discount,
            "plus_discount": plus_discount,
            "taxes_amount": taxes,
            "items": [it.dict() for it in payload.items],
        }
        ins = await client.post(
            f"{SUPABASE_URL}/rest/v1/bookings",
            headers=_sb_headers(),
            json=booking_row,
        )
        if ins.status_code not in (200, 201):
            raise HTTPException(ins.status_code, f"Booking insert failed: {ins.text}")
        booking = ins.json()
        if isinstance(booking, list):
            booking = booking[0]

        # ── Insert into booking_items (child table). Best-effort — gracefully
        # skip if the table doesn't exist yet (so the booking still completes).
        try:
            bi_rows = [
                {
                    "booking_id": booking["id"],
                    "service_id": it.service_id,
                    "title": it.title or "",
                    "image": it.image,
                    "price": it.price,
                    "quantity": it.quantity,
                }
                for it in payload.items
            ]
            bi_res = await client.post(
                f"{SUPABASE_URL}/rest/v1/booking_items",
                headers=_sb_headers(),
                json=bi_rows,
            )
            if bi_res.status_code not in (200, 201):
                # Don't fail the booking — log and continue. JSON `items` column still has the data.
                print(f"[booking_items] insert skipped: {bi_res.status_code} {bi_res.text[:200]}")
        except Exception as e:
            print(f"[booking_items] exception (non-fatal): {e}")

        # Mark slot as booked (best-effort)
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/slots?date=eq.{payload.slot_date}&time=eq.{payload.slot_time}",
            headers=_sb_headers(),
            json={"booked": 1},  # ideally increment, but Supabase REST doesn't support it cleanly
        )

        # Clear user's cart
        await client.delete(
            f"{SUPABASE_URL}/rest/v1/cart_items?user_id=eq.{uid}",
            headers=_sb_headers(),
        )

        return {
            "booking": booking,
            "summary": {
                "item_total": item_total,
                "coupon_discount": coupon_discount,
                "plus_discount": plus_discount,
                "plus_price": plus_price,
                "taxes": taxes,
                "tip": payload.tip_amount,
                "grand_total": grand_total,
            },
        }


# ─────────────────────────────────────────────────────────────────────────────
# Profile — update phone (used by Cart UI when user has email but no phone)
# ─────────────────────────────────────────────────────────────────────────────
class PhoneUpdate(BaseModel):
    phone: str
    name: Optional[str] = None  # optional, in case user wants to set name too


@router.post("/profile/phone")
async def update_phone(payload: PhoneUpdate, authorization: Optional[str] = Header(None)):
    uid = await _user_id_from_token(authorization)
    if not uid:
        raise HTTPException(401, "Please sign in")
    phone = payload.phone.strip()
    if len(phone.replace("+", "").replace("-", "").replace(" ", "")) < 8:
        raise HTTPException(400, "Please enter a valid phone number")
    body: dict = {"phone": phone}
    # `public.users.full_name` is the actual column — earlier this code used
    # the wrong column name "name" and the PATCH silently failed.
    if payload.name and payload.name.strip():
        body["full_name"] = payload.name.strip()
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{uid}",
            headers=_sb_headers(),
            json=body,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, f"Failed to update phone: {r.text}")
        # return updated user record
        u = await client.get(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{uid}&select=*",
            headers=_sb_headers(),
        )
        user = u.json()[0] if u.status_code == 200 and u.json() else None
        return {"ok": True, "user": user}
