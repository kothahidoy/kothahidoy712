#!/usr/bin/env python3
"""
Seed sensible defaults into the new CMS tables so the admin doesn't start from a blank slate.
  • Hero banners  — 1 per category (image, with title text)
  • Promos        — 1 per category (e.g. "Get 25% off upto 200")
  • Sub-categories — per category, the typical buckets users see (Facials, Waxing etc.)
  • Link existing services to a matching sub-category by heuristic
"""
import os, json, requests
from pathlib import Path

env = Path("/app/backend/.env")
for line in env.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1); os.environ.setdefault(k.strip(), v.strip())

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}


def req(m, p, **kw):
    r = requests.request(m, f"{SUPABASE_URL}/rest/v1{p}", headers=H, timeout=20, **kw)
    if not r.ok:
        print(f"   ⚠ {m} {p} → {r.status_code} {r.text[:200]}")
    return r

# ────────────── BANNERS  (one per category to start)
BANNERS = {
    "salon-women":   ("Salon, at your home",      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"),
    "salon-men":     ("Grooming, at your door",   "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80"),
    "cleaning-pest": ("Sparkling clean homes",    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"),
    "painting":      ("Painting, made hassle-free", "https://images.unsplash.com/photo-1562184552-f8d6e9e8aafc?auto=format&fit=crop&w=1200&q=80"),
    "ac-appliance":  ("AC summer-ready in 60 mins", "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=1200&q=80"),
    "electrician":   ("Electrical help, on demand", "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80"),
    "insta-help":    ("Instant help, in 30 mins",   "https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=1200"),
    "plumber":       ("Leak fix in under 60 mins",  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1200&q=80"),
    "carpenter":     ("Carpentry, at your home",    "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=1200&q=80"),
}

print("\n=== 1. Seeding category banners ===")
for cat, (title, url) in BANNERS.items():
    req("POST", "/category_banners", data=json.dumps({
        "category_id": cat, "title": title, "media_type": "image", "media_url": url,
        "sort_order": 1, "is_active": True,
    }))
print(f"   ✓ {len(BANNERS)} banners")

# ────────────── PROMOS
PROMOS = {
    "salon-women":   ("Get 25% off upto ₹200", "For new salon users", 25, 200),
    "salon-men":     ("Flat 20% off",           "For new users",        20, 150),
    "cleaning-pest": ("Get ₹300 off",           "On orders above ₹1499", 0,  300),
    "painting":      ("Flat ₹500 off",          "On any painting service", 0, 500),
    "ac-appliance":  ("Get 15% off",            "On AC service",        15, 150),
    "electrician":   ("Free inspection",        "Worth ₹99",             0,  99),
    "insta-help":    ("68% OFF — try at ₹79",   "1 hour booking",        0, 166),
    "plumber":       ("Get ₹100 off",           "First plumbing fix",    0, 100),
    "carpenter":     ("Free quote",             "Same day visit",        0,   0),
}
print("\n=== 2. Seeding promo strips ===")
for cat, (label, sub, pct, max_off) in PROMOS.items():
    req("POST", "/category_promos", data=json.dumps({
        "category_id": cat, "label": label, "sub_label": sub,
        "discount_pct": pct, "max_off": max_off, "min_cart": 0, "sort_order": 1, "is_active": True,
    }))
print(f"   ✓ {len(PROMOS)} promos")

# ────────────── SUB-CATEGORIES
SUBCATS = {
    "salon-women": [("Waxing","https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=600&q=80"),
                    ("Facials","https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80"),
                    ("Cleanup","https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"),
                    ("Pedicure & Manicure","https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80"),
                    ("Hair Care","https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80"),
                    ("Threading","https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&q=80")],
    "salon-men":   [("Haircut","https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80"),
                    ("Shave & Beard","https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80"),
                    ("Facial","https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"),
                    ("Massage","https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80"),
                    ("Hair Colour","https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80")],
    "cleaning-pest":[("Full Home","https://images.pexels.com/photos/6196694/pexels-photo-6196694.jpeg?auto=compress&cs=tinysrgb&w=600"),
                    ("Bathroom","https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"),
                    ("Kitchen","https://images.pexels.com/photos/6195274/pexels-photo-6195274.jpeg?auto=compress&cs=tinysrgb&w=600"),
                    ("Sofa & Carpet","https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80"),
                    ("Pest Control","https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=600&q=80")],
    "painting":    [("1 BHK","https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80"),
                    ("2 BHK","https://images.unsplash.com/photo-1562184552-f8d6e9e8aafc?auto=format&fit=crop&w=600&q=80"),
                    ("3 BHK","https://images.unsplash.com/photo-1572297474802-d0944a3c1da2?auto=format&fit=crop&w=600&q=80"),
                    ("Single Room","https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80"),
                    ("Waterproofing","https://images.unsplash.com/photo-1581922814484-0b48460b7010?auto=format&fit=crop&w=600&q=80"),
                    ("Wood Polish","https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=600&q=80")],
    "ac-appliance":[("AC","https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=600&q=80"),
                    ("Washing Machine","https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80"),
                    ("Refrigerator","https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80"),
                    ("Geyser","https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80"),
                    ("Television","https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80"),
                    ("Water Purifier","https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=600&q=80")],
    "electrician": [("Switch & Socket","https://images.unsplash.com/photo-1558002038-bb4237b50b11?auto=format&fit=crop&w=600&q=80"),
                    ("Fan","https://images.unsplash.com/photo-1582719478185-3c10aa9c95b6?auto=format&fit=crop&w=600&q=80"),
                    ("Lights","https://images.unsplash.com/photo-1565636192335-1e0a87d0b2f9?auto=format&fit=crop&w=600&q=80"),
                    ("Wiring","https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80"),
                    ("MCB","https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80")],
    "insta-help":  [("1 Hour","https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=600"),
                    ("1.5 Hours","https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=600"),
                    ("2 Hours","https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=600"),
                    ("3 Hours","https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=600")],
    "plumber":     [("Tap & Basin","https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"),
                    ("Toilet","https://images.unsplash.com/photo-1564540583246-934409427776?auto=format&fit=crop&w=600&q=80"),
                    ("Shower","https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80"),
                    ("Drainage","https://images.unsplash.com/photo-1517414204284-fb7e2e6e4f88?auto=format&fit=crop&w=600&q=80"),
                    ("Water Tank","https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80")],
    "carpenter":   [("Cupboard","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80"),
                    ("Kitchen Fittings","https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=600&q=80"),
                    ("Door","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80"),
                    ("Bed","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80"),
                    ("Shelf","https://images.unsplash.com/photo-1594224457860-23bcfbef9b69?auto=format&fit=crop&w=600&q=80")],
}

print("\n=== 3. Seeding sub-categories ===")
created_subs = {}
for cat, items in SUBCATS.items():
    for i, (name, img) in enumerate(items, 1):
        r = req("POST", "/sub_categories", data=json.dumps({
            "category_id": cat, "name": name, "image_url": img,
            "sort_order": i, "is_active": True,
        }))
        if r.ok:
            sub_id = r.json()[0]["id"] if isinstance(r.json(), list) else r.json()["id"]
            created_subs[(cat, name.lower())] = sub_id
print(f"   ✓ {len(created_subs)} sub-categories")

# ────────────── Link existing services to sub-categories by keyword
print("\n=== 4. Linking services to sub-categories ===")
KEYWORDS = {
    # category, keyword in title (lowercase) → sub-category name (lowercase)
    "salon-women": [("wax", "waxing"), ("facial", "facials"), ("cleanup", "cleanup"),
                    ("pedicure", "pedicure & manicure"), ("manicure", "pedicure & manicure"),
                    ("hair", "hair care"), ("spa", "hair care"), ("thread", "threading")],
    "salon-men":   [("haircut", "haircut"), ("shave", "shave & beard"), ("beard", "shave & beard"),
                    ("facial", "facial"), ("cleanup", "facial"), ("massage", "massage"),
                    ("colour", "hair colour"), ("pedicure", "haircut")],
    "cleaning-pest":[("full home", "full home"), ("bath", "bathroom"), ("kitchen", "kitchen"),
                    ("sofa", "sofa & carpet"), ("carpet", "sofa & carpet"), ("mattress", "sofa & carpet"),
                    ("pest", "pest control"), ("cockroach", "pest control"), ("termite", "pest control")],
    "painting":    [("1 bhk", "1 bhk"), ("2 bhk", "2 bhk"), ("3 bhk", "3 bhk"),
                    ("room", "single room"), ("waterproof", "waterproofing"), ("wood", "wood polish")],
    "ac-appliance":[("ac service", "ac"), ("washing", "washing machine"), ("refrig", "refrigerator"),
                    ("geyser", "geyser"), ("television", "television"), ("microwave", "television"),
                    ("chimney", "ac"), ("water purifier", "water purifier")],
    "electrician": [("switch", "switch & socket"), ("fan", "fan"), ("light", "lights"),
                    ("wiring", "wiring"), ("mcb", "mcb"), ("doorbell", "switch & socket")],
    "insta-help":  [("1 hour", "1 hour"), ("1.5", "1.5 hours"), ("2 hours", "2 hours"), ("3 hours", "3 hours")],
    "plumber":     [("tap", "tap & basin"), ("basin", "tap & basin"), ("toilet", "toilet"),
                    ("bath", "shower"), ("shower", "shower"), ("drain", "drainage"),
                    ("tank", "water tank"), ("pipe", "tap & basin")],
    "carpenter":   [("cupboard", "cupboard"), ("kitchen", "kitchen fittings"), ("door", "door"),
                    ("bed", "bed"), ("shelf", "shelf"), ("furniture", "shelf")],
}

svcs = req("GET", "/services?select=id,title,category_id").json()
updates = 0
for s in svcs:
    cat = s["category_id"]
    title_low = (s["title"] or "").lower()
    sub_name = None
    for kw, sn in KEYWORDS.get(cat, []):
        if kw in title_low:
            sub_name = sn; break
    if sub_name:
        sub_id = created_subs.get((cat, sub_name))
        if sub_id:
            r = req("PATCH", f"/services?id=eq.{s['id']}", data=json.dumps({"sub_category_id": sub_id}))
            if r.ok: updates += 1
print(f"   ✓ {updates}/{len(svcs)} services linked")

print("\n✅ CMS seed complete. Open /admin/cms in the app to manage everything.")
