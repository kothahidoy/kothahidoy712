"""
Admin API Routes for Mfixit Admin Panel
Handles services, bookings, slots, and offers management
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
import uuid
import os
import httpx
import base64

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

def get_supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

# ==================== IMAGE UPLOAD ====================

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload image to Supabase Storage and return public URL"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    # Read file content
    content = await file.read()
    
    # Generate unique filename
    file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"service-{uuid.uuid4()}.{file_ext}"
    
    # Upload to Supabase Storage
    storage_url = f"{SUPABASE_URL}/storage/v1/object/service-images/{filename}"
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": file.content_type or "image/jpeg",
        "x-upsert": "true"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            storage_url,
            headers=headers,
            content=content
        )
        
        if response.status_code in [200, 201]:
            # Return public URL
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/service-images/{filename}"
            return {"url": public_url, "filename": filename}
        else:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Failed to upload image: {response.text}"
            )

class ImageUploadBase64(BaseModel):
    image_data: str  # Base64 encoded image
    filename: Optional[str] = None

@router.post("/upload-image-base64")
async def upload_image_base64(data: ImageUploadBase64):
    """Upload base64 encoded image to Supabase Storage"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Remove data URL prefix if present
        image_data = data.image_data
        if "," in image_data:
            image_data = image_data.split(",")[1]
        
        # Decode base64
        content = base64.b64decode(image_data)
        
        # Generate unique filename
        file_ext = "jpg"
        if data.filename:
            file_ext = data.filename.split(".")[-1]
        filename = f"service-{uuid.uuid4()}.{file_ext}"
        
        # Upload to Supabase Storage
        storage_url = f"{SUPABASE_URL}/storage/v1/object/service-images/{filename}"
        
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "image/jpeg",
            "x-upsert": "true"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                storage_url,
                headers=headers,
                content=content
            )
            
            if response.status_code in [200, 201]:
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/service-images/{filename}"
                return {"url": public_url, "filename": filename}
            else:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Failed to upload image: {response.text}"
                )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

# ==================== MODELS ====================

class ServiceCreate(BaseModel):
    name: str
    price: float
    description: Optional[str] = ""
    offer: Optional[str] = ""
    category_id: Optional[str] = None
    image: Optional[str] = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400"

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    offer: Optional[str] = None
    is_active: Optional[bool] = None
    image: Optional[str] = None
    category_id: Optional[str] = None

class ServiceResponse(BaseModel):
    id: str
    name: str
    price: float
    description: str
    offer: str
    is_active: bool
    category_id: Optional[str] = None
    image: Optional[str] = None
    created_at: Optional[str] = None

class SlotCreate(BaseModel):
    date: str  # ISO format date
    time: str
    available: bool = True

class SlotUpdate(BaseModel):
    available: Optional[bool] = None

class SlotResponse(BaseModel):
    id: str
    date: str
    time: str
    available: bool
    created_at: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: str  # pending, confirmed, assigned, in_progress, completed, cancelled

class BookingResponse(BaseModel):
    id: str
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    service_id: str
    service_title: Optional[str] = None
    status: str
    scheduled_date: str
    time_slot: str
    price: float
    created_at: Optional[str] = None

class OfferCreate(BaseModel):
    title: str
    subtitle: Optional[str] = ""
    code: str
    discount_percent: float
    valid_until: str
    banner_url: Optional[str] = ""
    bg_color: Optional[str] = "#2563EB"

class OfferUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    code: Optional[str] = None
    discount_percent: Optional[float] = None
    valid_until: Optional[str] = None
    banner_url: Optional[str] = None
    bg_color: Optional[str] = None

class OfferResponse(BaseModel):
    id: str
    title: str
    subtitle: str
    code: str
    discount_percent: float
    valid_until: str
    banner_url: str
    bg_color: str

# Spotlight Banner Models
class SpotlightBannerCreate(BaseModel):
    title: str
    title_line2: Optional[str] = ""
    subtitle: Optional[str] = ""
    bg_color: Optional[str] = "#F5F5F5"
    text_color: Optional[str] = "#1a1a1a"
    image: Optional[str] = ""
    link_to: Optional[str] = ""
    sort_order: Optional[int] = 0

class SpotlightBannerUpdate(BaseModel):
    title: Optional[str] = None
    title_line2: Optional[str] = None
    subtitle: Optional[str] = None
    bg_color: Optional[str] = None
    text_color: Optional[str] = None
    image: Optional[str] = None
    link_to: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class SpotlightBannerResponse(BaseModel):
    id: str
    title: str
    title_line2: Optional[str] = ""
    subtitle: Optional[str] = ""
    bg_color: str
    text_color: str
    image: Optional[str] = ""
    link_to: Optional[str] = ""
    sort_order: int
    is_active: bool

# ==================== TABLE INITIALIZATION ====================

@router.post("/init-tables")
async def init_tables():
    """Initialize required tables in Supabase if they don't exist"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    # SQL to create tables - these will be executed via Supabase RPC or direct SQL
    # For now, we'll check if tables exist and return status
    
    tables_sql = {
        "admin_services": """
            CREATE TABLE IF NOT EXISTS admin_services (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                price DECIMAL(10,2) NOT NULL DEFAULT 0,
                description TEXT DEFAULT '',
                offer TEXT DEFAULT '',
                is_active BOOLEAN DEFAULT true,
                category_id UUID REFERENCES categories(id),
                image TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """,
        "slots": """
            CREATE TABLE IF NOT EXISTS slots (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                date DATE NOT NULL,
                time TEXT NOT NULL,
                available BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(date, time)
            );
        """,
    }
    
    return {"message": "Tables should be created in Supabase dashboard", "tables": list(tables_sql.keys())}

# ==================== SERVICES CRUD ====================

@router.get("/services", response_model=List[ServiceResponse])
async def list_services():
    """List all services from Supabase"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/services?select=*&order=title",
            headers=get_supabase_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            return [
                ServiceResponse(
                    id=s.get("id", ""),
                    name=s.get("title", ""),
                    price=float(s.get("starting_price", 0)),
                    description=s.get("description", ""),
                    offer=s.get("offer", "") or "",
                    is_active=s.get("is_active", True),
                    category_id=s.get("category_id"),
                    image=s.get("image"),
                    created_at=s.get("created_at")
                )
                for s in data
            ]
        return []

@router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceCreate):
    """Create a new service"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    # Generate a unique ID for the service
    service_id = f"svc-{str(uuid.uuid4())[:8]}"
    
    payload = {
        "id": service_id,
        "title": service.name,
        "starting_price": service.price,
        "description": service.description,
        "is_active": True,
        "image": service.image,
        "category_id": service.category_id,
        "duration_mins": 60,
        "rating": 0,
        "review_count": 0
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/services",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                s = data[0]
            else:
                s = data
            return ServiceResponse(
                id=s.get("id", ""),
                name=s.get("title", ""),
                price=float(s.get("starting_price", 0)),
                description=s.get("description", ""),
                offer=s.get("offer", "") or "",
                is_active=s.get("is_active", True),
                category_id=s.get("category_id"),
                image=s.get("image"),
                created_at=s.get("created_at")
            )
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.patch("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, service: ServiceUpdate):
    """Update a service"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    payload = {}
    if service.name is not None:
        payload["title"] = service.name
    if service.price is not None:
        payload["starting_price"] = service.price
    if service.description is not None:
        payload["description"] = service.description
    # Note: 'offer' column doesn't exist in services table, skip it
    if service.is_active is not None:
        payload["is_active"] = service.is_active
    if service.image is not None:
        payload["image"] = service.image
    if service.category_id is not None:
        payload["category_id"] = service.category_id
    
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/services?id=eq.{service_id}",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 204]:
            # Fetch updated record
            get_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/services?id=eq.{service_id}",
                headers=get_supabase_headers()
            )
            if get_response.status_code == 200:
                data = get_response.json()
                if data:
                    s = data[0]
                    return ServiceResponse(
                        id=s.get("id", ""),
                        name=s.get("title", ""),
                        price=float(s.get("starting_price", 0)),
                        description=s.get("description", ""),
                        offer=s.get("offer", "") or "",
                        is_active=s.get("is_active", True),
                        category_id=s.get("category_id"),
                        image=s.get("image"),
                        created_at=s.get("created_at")
                    )
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.delete("/services/{service_id}")
async def delete_service(service_id: str):
    """Delete a service"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{SUPABASE_URL}/rest/v1/services?id=eq.{service_id}",
            headers=get_supabase_headers()
        )
        
        if response.status_code in [200, 204]:
            return {"message": "Service deleted"}
        raise HTTPException(status_code=response.status_code, detail=response.text)

# ==================== SLOTS CRUD ====================

@router.get("/slots", response_model=List[SlotResponse])
async def list_slots():
    """List all slots"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/slots?select=*&order=date,time",
            headers=get_supabase_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            return [
                SlotResponse(
                    id=s.get("id", ""),
                    date=s.get("date", ""),
                    time=s.get("time", ""),
                    available=s.get("available", True),
                    created_at=s.get("created_at")
                )
                for s in data
            ]
        return []

@router.post("/slots", response_model=SlotResponse)
async def create_slot(slot: SlotCreate):
    """Create a new slot"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    payload = {
        "date": slot.date,
        "time": slot.time,
        "available": slot.available
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/slots",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                s = data[0]
            else:
                s = data
            return SlotResponse(
                id=s.get("id", ""),
                date=s.get("date", ""),
                time=s.get("time", ""),
                available=s.get("available", True),
                created_at=s.get("created_at")
            )
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.patch("/slots/{slot_id}", response_model=SlotResponse)
async def update_slot(slot_id: str, slot: SlotUpdate):
    """Update slot availability (block/unblock)"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    payload = {}
    if slot.available is not None:
        payload["available"] = slot.available
    
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/slots?id=eq.{slot_id}",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 204]:
            get_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/slots?id=eq.{slot_id}",
                headers=get_supabase_headers()
            )
            if get_response.status_code == 200:
                data = get_response.json()
                if data:
                    s = data[0]
                    return SlotResponse(
                        id=s.get("id", ""),
                        date=s.get("date", ""),
                        time=s.get("time", ""),
                        available=s.get("available", True),
                        created_at=s.get("created_at")
                    )
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.delete("/slots/{slot_id}")
async def delete_slot(slot_id: str):
    """Delete a slot"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{SUPABASE_URL}/rest/v1/slots?id=eq.{slot_id}",
            headers=get_supabase_headers()
        )
        
        if response.status_code in [200, 204]:
            return {"message": "Slot deleted"}
        raise HTTPException(status_code=response.status_code, detail=response.text)

# ==================== BOOKINGS ====================

@router.get("/bookings", response_model=List[BookingResponse])
async def list_bookings():
    """List all bookings with customer info"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    
    async with httpx.AsyncClient() as client:
        # Get bookings with customer info
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/bookings?select=*,users:customer_id(full_name,phone)&order=created_at.desc",
            headers=get_supabase_headers()
        )
        
        if response.status_code == 200:
            bookings = response.json()
            
            # Get services for titles
            svc_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/services?select=id,title",
                headers=get_supabase_headers()
            )
            services = {}
            if svc_response.status_code == 200:
                for s in svc_response.json():
                    services[s["id"]] = s["title"]
            
            return [
                BookingResponse(
                    id=b.get("id", ""),
                    customer_name=b.get("users", {}).get("full_name") if b.get("users") else None,
                    phone=b.get("users", {}).get("phone") if b.get("users") else None,
                    service_id=b.get("service_id", ""),
                    service_title=services.get(b.get("service_id"), "Unknown Service"),
                    status=b.get("status", "pending"),
                    scheduled_date=b.get("scheduled_date", ""),
                    time_slot=b.get("time_slot", ""),
                    price=float(b.get("price", 0)),
                    created_at=b.get("created_at")
                )
                for b in bookings
            ]
        return []

@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, update: BookingStatusUpdate):
    """Update booking status"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    valid_statuses = ["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/bookings?id=eq.{booking_id}",
            headers=get_supabase_headers(),
            json={"status": update.status}
        )
        
        if response.status_code in [200, 204]:
            return {"message": f"Booking status updated to {update.status}"}
        raise HTTPException(status_code=response.status_code, detail=response.text)

# ==================== OFFERS CRUD ====================

@router.get("/offers", response_model=List[OfferResponse])
async def list_offers():
    """List all offers"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/offers?select=*&order=id",
            headers=get_supabase_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            return [
                OfferResponse(
                    id=str(o.get("id", "")),
                    title=o.get("title", ""),
                    subtitle=o.get("subtitle", "") or "",
                    code=o.get("code", ""),
                    discount_percent=float(o.get("discount_percent", 0)),
                    valid_until=o.get("valid_until", ""),
                    banner_url=o.get("banner_url", "") or "",
                    bg_color=o.get("bg_color", "#2563EB") or "#2563EB"
                )
                for o in data
            ]
        return []

@router.post("/offers", response_model=OfferResponse)
async def create_offer(offer: OfferCreate):
    """Create a new offer"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    # Generate a unique ID for the offer
    offer_id = int(datetime.utcnow().timestamp() * 1000) % 1000000  # Simple numeric ID
    
    payload = {
        "id": offer_id,
        "title": offer.title,
        "subtitle": offer.subtitle,
        "code": offer.code,
        "discount_percent": offer.discount_percent,
        "valid_until": offer.valid_until,
        "banner_url": offer.banner_url,
        "bg_color": offer.bg_color
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/offers",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                o = data[0]
            else:
                o = data
            return OfferResponse(
                id=str(o.get("id", "")),
                title=o.get("title", ""),
                subtitle=o.get("subtitle", "") or "",
                code=o.get("code", ""),
                discount_percent=float(o.get("discount_percent", 0)),
                valid_until=o.get("valid_until", ""),
                banner_url=o.get("banner_url", "") or "",
                bg_color=o.get("bg_color", "#2563EB") or "#2563EB"
            )
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.patch("/offers/{offer_id}", response_model=OfferResponse)
async def update_offer(offer_id: str, offer: OfferUpdate):
    """Update an offer"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    payload = {}
    if offer.title is not None:
        payload["title"] = offer.title
    if offer.subtitle is not None:
        payload["subtitle"] = offer.subtitle
    if offer.code is not None:
        payload["code"] = offer.code
    if offer.discount_percent is not None:
        payload["discount_percent"] = offer.discount_percent
    if offer.valid_until is not None:
        payload["valid_until"] = offer.valid_until
    if offer.banner_url is not None:
        payload["banner_url"] = offer.banner_url
    if offer.bg_color is not None:
        payload["bg_color"] = offer.bg_color
    
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/offers?id=eq.{offer_id}",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 204]:
            get_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/offers?id=eq.{offer_id}",
                headers=get_supabase_headers()
            )
            if get_response.status_code == 200:
                data = get_response.json()
                if data:
                    o = data[0]
                    return OfferResponse(
                        id=str(o.get("id", "")),
                        title=o.get("title", ""),
                        subtitle=o.get("subtitle", "") or "",
                        code=o.get("code", ""),
                        discount_percent=float(o.get("discount_percent", 0)),
                        valid_until=o.get("valid_until", ""),
                        banner_url=o.get("banner_url", "") or "",
                        bg_color=o.get("bg_color", "#2563EB") or "#2563EB"
                    )
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.delete("/offers/{offer_id}")
async def delete_offer(offer_id: str):
    """Delete an offer"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{SUPABASE_URL}/rest/v1/offers?id=eq.{offer_id}",
            headers=get_supabase_headers()
        )
        
        if response.status_code in [200, 204]:
            return {"message": "Offer deleted"}
        raise HTTPException(status_code=response.status_code, detail=response.text)

# ==================== CATEGORIES ====================

class CategoryCreate(BaseModel):
    id: str
    name: str
    icon: Optional[str] = ""
    color: Optional[str] = "#2563EB"
    description: Optional[str] = ""
    image_url: Optional[str] = ""

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

@router.get("/categories")
async def list_categories():
    """List all categories for service assignment"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/categories?select=*&order=name",
            headers=get_supabase_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        return []

@router.post("/categories")
async def create_category(category: CategoryCreate):
    """Create a new category"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    payload = {
        "id": category.id,
        "name": category.name,
        "icon": category.icon,
        "color": category.color,
        "description": category.description,
        "image_url": category.image_url,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/categories",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            return data[0] if isinstance(data, list) else data
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.patch("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryUpdate):
    """Update a category"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    payload = {}
    if category.name is not None:
        payload["name"] = category.name
    if category.icon is not None:
        payload["icon"] = category.icon
    if category.color is not None:
        payload["color"] = category.color
    if category.description is not None:
        payload["description"] = category.description
    if category.image_url is not None:
        payload["image_url"] = category.image_url
    
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/categories?id=eq.{category_id}",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 204]:
            return {"message": "Category updated"}
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a category"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{SUPABASE_URL}/rest/v1/categories?id=eq.{category_id}",
            headers=get_supabase_headers()
        )
        
        if response.status_code in [200, 204]:
            return {"message": "Category deleted"}
        raise HTTPException(status_code=response.status_code, detail=response.text)


# ==================== SPOTLIGHT BANNERS CRUD ====================

@router.get("/spotlight-banners", response_model=List[SpotlightBannerResponse])
async def list_spotlight_banners():
    """List all spotlight banners"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/spotlight_banners?select=*&order=sort_order",
            headers=get_supabase_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            return [
                SpotlightBannerResponse(
                    id=b.get("id", ""),
                    title=b.get("title", ""),
                    title_line2=b.get("title_line2", "") or "",
                    subtitle=b.get("subtitle", "") or "",
                    bg_color=b.get("bg_color", "#F5F5F5") or "#F5F5F5",
                    text_color=b.get("text_color", "#1a1a1a") or "#1a1a1a",
                    image=b.get("image", "") or "",
                    link_to=b.get("link_to", "") or "",
                    sort_order=b.get("sort_order", 0),
                    is_active=b.get("is_active", True)
                )
                for b in data
            ]
        return []

@router.post("/spotlight-banners", response_model=SpotlightBannerResponse)
async def create_spotlight_banner(banner: SpotlightBannerCreate):
    """Create a new spotlight banner"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    banner_id = f"spot-{str(uuid.uuid4())[:8]}"
    
    payload = {
        "id": banner_id,
        "title": banner.title,
        "title_line2": banner.title_line2,
        "subtitle": banner.subtitle,
        "bg_color": banner.bg_color,
        "text_color": banner.text_color,
        "image": banner.image,
        "link_to": banner.link_to,
        "sort_order": banner.sort_order,
        "is_active": True
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/spotlight_banners",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            if isinstance(data, list):
                data = data[0]
            return SpotlightBannerResponse(
                id=data.get("id", ""),
                title=data.get("title", ""),
                title_line2=data.get("title_line2", "") or "",
                subtitle=data.get("subtitle", "") or "",
                bg_color=data.get("bg_color", "#F5F5F5") or "#F5F5F5",
                text_color=data.get("text_color", "#1a1a1a") or "#1a1a1a",
                image=data.get("image", "") or "",
                link_to=data.get("link_to", "") or "",
                sort_order=data.get("sort_order", 0),
                is_active=data.get("is_active", True)
            )
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.patch("/spotlight-banners/{banner_id}", response_model=SpotlightBannerResponse)
async def update_spotlight_banner(banner_id: str, banner: SpotlightBannerUpdate):
    """Update a spotlight banner"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    payload = {}
    if banner.title is not None:
        payload["title"] = banner.title
    if banner.title_line2 is not None:
        payload["title_line2"] = banner.title_line2
    if banner.subtitle is not None:
        payload["subtitle"] = banner.subtitle
    if banner.bg_color is not None:
        payload["bg_color"] = banner.bg_color
    if banner.text_color is not None:
        payload["text_color"] = banner.text_color
    if banner.image is not None:
        payload["image"] = banner.image
    if banner.link_to is not None:
        payload["link_to"] = banner.link_to
    if banner.sort_order is not None:
        payload["sort_order"] = banner.sort_order
    if banner.is_active is not None:
        payload["is_active"] = banner.is_active
    
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/spotlight_banners?id=eq.{banner_id}",
            headers=get_supabase_headers(),
            json=payload
        )
        
        if response.status_code in [200, 204]:
            get_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/spotlight_banners?id=eq.{banner_id}",
                headers=get_supabase_headers()
            )
            if get_response.status_code == 200:
                data = get_response.json()
                if data:
                    b = data[0]
                    return SpotlightBannerResponse(
                        id=b.get("id", ""),
                        title=b.get("title", ""),
                        title_line2=b.get("title_line2", "") or "",
                        subtitle=b.get("subtitle", "") or "",
                        bg_color=b.get("bg_color", "#F5F5F5") or "#F5F5F5",
                        text_color=b.get("text_color", "#1a1a1a") or "#1a1a1a",
                        image=b.get("image", "") or "",
                        link_to=b.get("link_to", "") or "",
                        sort_order=b.get("sort_order", 0),
                        is_active=b.get("is_active", True)
                    )
        raise HTTPException(status_code=response.status_code, detail=response.text)

@router.delete("/spotlight-banners/{banner_id}")
async def delete_spotlight_banner(banner_id: str):
    """Delete a spotlight banner"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{SUPABASE_URL}/rest/v1/spotlight_banners?id=eq.{banner_id}",
            headers=get_supabase_headers()
        )
        
        if response.status_code in [200, 204]:
            return {"message": "Spotlight banner deleted"}
        raise HTTPException(status_code=response.status_code, detail=response.text)

# ==================== PUBLIC SPOTLIGHT API ====================

@router.get("/public/spotlight-banners")
async def get_public_spotlight_banners():
    """Get active spotlight banners for frontend"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/spotlight_banners?is_active=eq.true&select=*&order=sort_order",
            headers=get_supabase_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        return []
