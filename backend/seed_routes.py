"""
Seed Data API for Mfixit App
Initializes Supabase with categories, services, offers and spotlight banners
"""
from fastapi import APIRouter, HTTPException
import os
import httpx
import uuid

router = APIRouter(prefix="/api/seed", tags=["seed"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

def get_supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

# Seed Data
CATEGORIES = [
    {
        "id": "cat-salon-women",
        "name": "Women's Salon",
        "icon": "Scissors",
        "color": "#E11D48",
        "description": "Professional beauty services at your doorstep",
        "image_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400"
    },
    {
        "id": "cat-salon-men",
        "name": "Men's Salon",
        "icon": "Scissors",
        "color": "#2563EB",
        "description": "Grooming and styling for men",
        "image_url": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400"
    },
    {
        "id": "cat-cleaning",
        "name": "Cleaning & Pest Control",
        "icon": "SprayCanIcon",
        "color": "#16A34A",
        "description": "Deep cleaning and pest control services",
        "image_url": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400"
    },
    {
        "id": "cat-painting",
        "name": "Home Painting",
        "icon": "PaintBucket",
        "color": "#F59E0B",
        "description": "Interior and exterior painting",
        "image_url": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400"
    },
    {
        "id": "cat-ac-appliance",
        "name": "AC & Appliance Repair",
        "icon": "Wrench",
        "color": "#0EA5E9",
        "description": "AC, refrigerator, washing machine repairs",
        "image_url": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400"
    },
    {
        "id": "cat-electrician",
        "name": "Electrician",
        "icon": "Zap",
        "color": "#EAB308",
        "description": "Electrical repairs and installations",
        "image_url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400"
    },
    {
        "id": "cat-insta-help",
        "name": "Insta Help",
        "icon": "Clock",
        "color": "#7C3AED",
        "description": "Quick household help in 10 minutes",
        "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"
    },
    {
        "id": "cat-plumber",
        "name": "Plumber",
        "icon": "Droplet",
        "color": "#06B6D4",
        "description": "Plumbing repairs and installations",
        "image_url": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400"
    },
    {
        "id": "cat-carpenter",
        "name": "Carpenter",
        "icon": "Hammer",
        "color": "#A16207",
        "description": "Furniture repair and woodwork",
        "image_url": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400"
    }
]

SERVICES = [
    # Women's Salon
    {
        "id": "svc-wax-full",
        "category_id": "cat-salon-women",
        "title": "Full Body Waxing",
        "description": "Complete body waxing with premium wax",
        "starting_price": 999,
        "duration_mins": 90,
        "rating": 4.8,
        "review_count": 1240,
        "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400",
        "popular": True,
        "top_rated": True,
        "recommended": False
    },
    {
        "id": "svc-facial-cleanup",
        "category_id": "cat-salon-women",
        "title": "Facial & Cleanup",
        "description": "Deep cleansing facial for glowing skin",
        "starting_price": 649,
        "duration_mins": 60,
        "rating": 4.7,
        "review_count": 890,
        "image": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400",
        "popular": True,
        "top_rated": False,
        "recommended": True
    },
    {
        "id": "svc-manicure-pedicure",
        "category_id": "cat-salon-women",
        "title": "Manicure & Pedicure",
        "description": "Complete nail care and treatment",
        "starting_price": 549,
        "duration_mins": 75,
        "rating": 4.6,
        "review_count": 650,
        "image": "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400",
        "popular": False,
        "top_rated": False,
        "recommended": True
    },
    # Men's Salon
    {
        "id": "svc-haircut-men",
        "category_id": "cat-salon-men",
        "title": "Men's Haircut",
        "description": "Professional haircut at your doorstep",
        "starting_price": 299,
        "duration_mins": 30,
        "rating": 4.8,
        "review_count": 2100,
        "image": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400",
        "popular": True,
        "top_rated": True,
        "recommended": False
    },
    {
        "id": "svc-beard-trim",
        "category_id": "cat-salon-men",
        "title": "Beard Trim & Styling",
        "description": "Expert beard grooming and shaping",
        "starting_price": 199,
        "duration_mins": 20,
        "rating": 4.7,
        "review_count": 1560,
        "image": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400",
        "popular": True,
        "top_rated": False,
        "recommended": False
    },
    # Cleaning
    {
        "id": "svc-deep-clean",
        "category_id": "cat-cleaning",
        "title": "Deep Home Cleaning",
        "description": "Thorough cleaning of your entire home",
        "starting_price": 1499,
        "duration_mins": 180,
        "rating": 4.6,
        "review_count": 980,
        "image": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
        "popular": True,
        "top_rated": False,
        "recommended": True
    },
    {
        "id": "svc-bathroom-clean",
        "category_id": "cat-cleaning",
        "title": "Bathroom Deep Clean",
        "description": "Complete bathroom sanitization",
        "starting_price": 449,
        "duration_mins": 60,
        "rating": 4.5,
        "review_count": 720,
        "image": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400",
        "popular": False,
        "top_rated": False,
        "recommended": True
    },
    {
        "id": "svc-kitchen-clean",
        "category_id": "cat-cleaning",
        "title": "Kitchen Deep Clean",
        "description": "Complete kitchen cleaning including appliances",
        "starting_price": 599,
        "duration_mins": 90,
        "rating": 4.7,
        "review_count": 540,
        "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
        "popular": True,
        "top_rated": True,
        "recommended": False
    },
    # AC & Appliance
    {
        "id": "svc-ac-service",
        "category_id": "cat-ac-appliance",
        "title": "AC Service & Repair",
        "description": "Complete AC servicing and gas refill",
        "starting_price": 499,
        "duration_mins": 60,
        "rating": 4.8,
        "review_count": 1890,
        "image": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400",
        "popular": True,
        "top_rated": True,
        "recommended": True
    },
    {
        "id": "svc-washing-repair",
        "category_id": "cat-ac-appliance",
        "title": "Washing Machine Repair",
        "description": "All brands washing machine repair",
        "starting_price": 349,
        "duration_mins": 60,
        "rating": 4.5,
        "review_count": 670,
        "image": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400",
        "popular": False,
        "top_rated": False,
        "recommended": True
    },
    # Electrician
    {
        "id": "svc-wiring-switch",
        "category_id": "cat-electrician",
        "title": "Wiring & Switch Fix",
        "description": "Electrical wiring and switch repairs",
        "starting_price": 199,
        "duration_mins": 45,
        "rating": 4.8,
        "review_count": 1240,
        "image": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400",
        "popular": True,
        "top_rated": True,
        "recommended": False
    },
    {
        "id": "svc-fan-install",
        "category_id": "cat-electrician",
        "title": "Fan Installation",
        "description": "Ceiling fan and exhaust fan installation",
        "starting_price": 249,
        "duration_mins": 30,
        "rating": 4.6,
        "review_count": 890,
        "image": "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400",
        "popular": False,
        "top_rated": False,
        "recommended": True
    },
    # Plumber
    {
        "id": "svc-tap-leak",
        "category_id": "cat-plumber",
        "title": "Tap & Leak Fix",
        "description": "Tap repair and leak fixing",
        "starting_price": 179,
        "duration_mins": 30,
        "rating": 4.7,
        "review_count": 690,
        "image": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400",
        "popular": True,
        "top_rated": False,
        "recommended": True
    },
    {
        "id": "svc-drain-clean",
        "category_id": "cat-plumber",
        "title": "Drain Cleaning",
        "description": "Blocked drain and pipe cleaning",
        "starting_price": 299,
        "duration_mins": 45,
        "rating": 4.5,
        "review_count": 450,
        "image": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400",
        "popular": False,
        "top_rated": False,
        "recommended": False
    },
    # Carpenter
    {
        "id": "svc-furniture-repair",
        "category_id": "cat-carpenter",
        "title": "Furniture Repair",
        "description": "All types of furniture repairs",
        "starting_price": 299,
        "duration_mins": 60,
        "rating": 4.6,
        "review_count": 520,
        "image": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400",
        "popular": True,
        "top_rated": False,
        "recommended": True
    },
    # Insta Help
    {
        "id": "svc-insta-clean",
        "category_id": "cat-insta-help",
        "title": "Quick House Help",
        "description": "Trained help when your maid is on leave",
        "starting_price": 79,
        "duration_mins": 120,
        "rating": 4.4,
        "review_count": 340,
        "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
        "popular": True,
        "top_rated": False,
        "recommended": True
    }
]

OFFERS = [
    {
        "id": 1,
        "title": "Summer Special",
        "subtitle": "Beat the heat with AC services",
        "code": "SUMMER25",
        "discount_percent": 25,
        "valid_until": "2025-08-31",
        "banner_url": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600",
        "bg_color": "#0EA5E9"
    },
    {
        "id": 2,
        "title": "First Booking",
        "subtitle": "Flat discount on your first service",
        "code": "FIRST50",
        "discount_percent": 50,
        "valid_until": "2025-12-31",
        "banner_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600",
        "bg_color": "#7C3AED"
    },
    {
        "id": 3,
        "title": "Cleaning Week",
        "subtitle": "Deep clean your home at special prices",
        "code": "CLEAN20",
        "discount_percent": 20,
        "valid_until": "2025-07-31",
        "banner_url": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600",
        "bg_color": "#16A34A"
    }
]

SPOTLIGHT_BANNERS = [
    {
        "id": "spot-1",
        "title": "Get your AC",
        "title_line2": "summer-ready",
        "subtitle": "Foam-jet AC service",
        "bg_color": "#F5F5F5",
        "text_color": "#1a1a1a",
        "image": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400",
        "link_to": "/category/cat-ac-appliance",
        "sort_order": 1,
        "is_active": True
    },
    {
        "id": "spot-2",
        "title": "Insta Help",
        "title_line2": "in 10 mins",
        "subtitle": "Trained house help when your maid is on leave",
        "bg_color": "#7C3AED",
        "text_color": "#FFFFFF",
        "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
        "link_to": "/category/cat-insta-help",
        "sort_order": 2,
        "is_active": True
    },
    {
        "id": "spot-3",
        "title": "Home repairs at",
        "title_line2": "affordable prices",
        "subtitle": "Electricians, plumbers, carpenters",
        "bg_color": "#2563EB",
        "text_color": "#FFFFFF",
        "image": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
        "link_to": "/category/cat-electrician",
        "sort_order": 3,
        "is_active": True
    },
    {
        "id": "spot-4",
        "title": "Expert haircut at",
        "title_line2": "your doorstep",
        "subtitle": "Salon for men",
        "bg_color": "#0EA5E9",
        "text_color": "#FFFFFF",
        "image": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400",
        "link_to": "/category/cat-salon-men",
        "sort_order": 4,
        "is_active": True
    }
]

@router.post("/all")
async def seed_all_data():
    """Seed all data to Supabase"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    results = {
        "categories": {"success": 0, "failed": 0},
        "services": {"success": 0, "failed": 0},
        "offers": {"success": 0, "failed": 0},
        "spotlight_banners": {"success": 0, "failed": 0}
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Seed Categories
        for cat in CATEGORIES:
            try:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/categories",
                    headers={**get_supabase_headers(), "Prefer": "resolution=merge-duplicates"},
                    json=cat
                )
                if response.status_code in [200, 201, 409]:
                    results["categories"]["success"] += 1
                else:
                    results["categories"]["failed"] += 1
                    print(f"Category failed: {cat['name']} - {response.text}")
            except Exception as e:
                results["categories"]["failed"] += 1
                print(f"Category error: {cat['name']} - {e}")
        
        # Seed Services
        for svc in SERVICES:
            try:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/services",
                    headers={**get_supabase_headers(), "Prefer": "resolution=merge-duplicates"},
                    json={**svc, "is_active": True}
                )
                if response.status_code in [200, 201, 409]:
                    results["services"]["success"] += 1
                else:
                    results["services"]["failed"] += 1
                    print(f"Service failed: {svc['title']} - {response.text}")
            except Exception as e:
                results["services"]["failed"] += 1
                print(f"Service error: {svc['title']} - {e}")
        
        # Seed Offers
        for offer in OFFERS:
            try:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/offers",
                    headers={**get_supabase_headers(), "Prefer": "resolution=merge-duplicates"},
                    json=offer
                )
                if response.status_code in [200, 201, 409]:
                    results["offers"]["success"] += 1
                else:
                    results["offers"]["failed"] += 1
                    print(f"Offer failed: {offer['title']} - {response.text}")
            except Exception as e:
                results["offers"]["failed"] += 1
                print(f"Offer error: {offer['title']} - {e}")
        
        # Seed Spotlight Banners
        for banner in SPOTLIGHT_BANNERS:
            try:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/spotlight_banners",
                    headers={**get_supabase_headers(), "Prefer": "resolution=merge-duplicates"},
                    json=banner
                )
                if response.status_code in [200, 201, 409]:
                    results["spotlight_banners"]["success"] += 1
                else:
                    results["spotlight_banners"]["failed"] += 1
                    print(f"Spotlight failed: {banner['title']} - {response.text}")
            except Exception as e:
                results["spotlight_banners"]["failed"] += 1
                print(f"Spotlight error: {banner['title']} - {e}")
    
    return {
        "message": "Seed completed",
        "results": results
    }

@router.get("/status")
async def check_tables():
    """Check if required tables exist and have data"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    tables = ["categories", "services", "offers", "spotlight_banners", "cart_items", "bookings", "users"]
    status = {}
    
    async with httpx.AsyncClient() as client:
        for table in tables:
            try:
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/{table}?select=id&limit=1",
                    headers=get_supabase_headers()
                )
                if response.status_code == 200:
                    count_response = await client.get(
                        f"{SUPABASE_URL}/rest/v1/{table}?select=id",
                        headers={**get_supabase_headers(), "Prefer": "count=exact"}
                    )
                    count = count_response.headers.get("content-range", "0").split("/")[-1]
                    status[table] = {"exists": True, "count": int(count) if count.isdigit() else 0}
                else:
                    status[table] = {"exists": False, "error": response.text}
            except Exception as e:
                status[table] = {"exists": False, "error": str(e)}
    
    return status
