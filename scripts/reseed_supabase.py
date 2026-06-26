#!/usr/bin/env python3
"""
Wipe old services + bookings from Supabase and reseed with the 9 new
categories + ~56 fresh services that match the Mfixit app's category pages.

Run:  python /app/scripts/reseed_supabase.py
"""
import os, sys, json, time, requests
from pathlib import Path

# Load /app/backend/.env explicitly so this script works standalone
env_path = Path("/app/backend/.env")
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

def req(method, path, **kw):
    url = f"{SUPABASE_URL}/rest/v1{path}"
    r = requests.request(method, url, headers=HEADERS, timeout=30, **kw)
    if not r.ok:
        print(f"ERROR {method} {path} -> {r.status_code}: {r.text[:300]}")
    return r

# ------------------------------------------------------------------
# 1. WIPE  (order matters because of FKs)
# ------------------------------------------------------------------
print("\n=== STEP 1: WIPE old data ===")

# Wipe any cart-style tables that reference services (best-effort)
for tbl in ["booking_items", "bookings", "services"]:
    print(f"  → deleting all rows from {tbl} ...", end=" ")
    r = req("DELETE", f"/{tbl}?id=neq.00000000-0000-0000-0000-000000000000")
    print("OK" if r.ok else f"SKIP ({r.status_code})")

# ------------------------------------------------------------------
# 2. RESEED CATEGORIES (upsert the 9 categories)
# ------------------------------------------------------------------
print("\n=== STEP 2: Upsert 9 categories ===")

CATEGORIES = [
    {"id": "salon-women", "name": "Women's Salon", "icon": "Sparkles", "color": "#FCE7F3"},
    {"id": "salon-men",   "name": "Men's Salon",   "icon": "Scissors", "color": "#FFEDD5"},
    {"id": "cleaning-pest","name": "Cleaning & Pest Control", "icon": "Sparkles", "color": "#DCFCE7"},
    {"id": "painting",    "name": "Home Painting", "icon": "PaintBucket", "color": "#FEF3C7"},
    {"id": "ac-appliance","name": "AC & Appliance Repair", "icon": "Wind", "color": "#CFFAFE"},
    {"id": "electrician", "name": "Electrician",   "icon": "Zap", "color": "#DBEAFE"},
    {"id": "insta-help",  "name": "Insta Help",    "icon": "Zap", "color": "#FEE2E2"},
    {"id": "plumber",     "name": "Plumber",       "icon": "Droplets", "color": "#DBEAFE"},
    {"id": "carpenter",   "name": "Carpenter",     "icon": "Hammer", "color": "#FED7AA"},
]

# First delete any old categories whose ids will not be reused
KEEP_IDS = {c["id"] for c in CATEGORIES}
r = req("GET", "/categories?select=id")
if r.ok:
    existing_ids = {row["id"] for row in r.json()}
    to_delete = existing_ids - KEEP_IDS
    for cid in to_delete:
        print(f"  → deleting old category '{cid}' ...", end=" ")
        r = req("DELETE", f"/categories?id=eq.{cid}")
        print("OK" if r.ok else "FAIL")

# Upsert the 9 categories (POST with on_conflict=id)
upsert_headers = {**HEADERS, "Prefer": "resolution=merge-duplicates,return=representation"}
r = requests.post(
    f"{SUPABASE_URL}/rest/v1/categories?on_conflict=id",
    data=json.dumps(CATEGORIES),
    headers=upsert_headers,
    timeout=30,
)
print(f"  Upsert categories status: {r.status_code} ({len(r.json()) if r.ok else 0} rows)")
if not r.ok:
    print(f"  Body: {r.text[:300]}")

# ------------------------------------------------------------------
# 3. INSERT NEW SERVICES
# ------------------------------------------------------------------
print("\n=== STEP 3: Insert new services ===")

IMG = {
    "ac": "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=800&q=80",
    "washer": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80",
    "fridge": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
    "tv": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80",
    "geyser": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    "microwave": "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80",
    "chimney": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
    "purifier": "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=800&q=80",
    "electrician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    "switch": "https://images.unsplash.com/photo-1558002038-bb4237b50b11?auto=format&fit=crop&w=800&q=80",
    "fan": "https://images.unsplash.com/photo-1582719478185-3c10aa9c95b6?auto=format&fit=crop&w=800&q=80",
    "light": "https://images.unsplash.com/photo-1565636192335-1e0a87d0b2f9?auto=format&fit=crop&w=800&q=80",
    "wiring": "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80",
    "plumber": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
    "tap": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "toilet": "https://images.unsplash.com/photo-1564540583246-934409427776?auto=format&fit=crop&w=800&q=80",
    "shower": "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80",
    "drain": "https://images.unsplash.com/photo-1517414204284-fb7e2e6e4f88?auto=format&fit=crop&w=800&q=80",
    "deepClean": "https://images.pexels.com/photos/6196694/pexels-photo-6196694.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=800",
    "bathClean": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "kitchenClean": "https://images.pexels.com/photos/6195274/pexels-photo-6195274.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=800",
    "sofaClean": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
    "carpetClean": "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80",
    "pest": "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=800&q=80",
    "termite": "https://images.unsplash.com/photo-1632935190508-bef6c4c2fcd9?auto=format&fit=crop&w=800&q=80",
    "painting1bhk": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
    "painting2bhk": "https://images.unsplash.com/photo-1562184552-f8d6e9e8aafc?auto=format&fit=crop&w=800&q=80",
    "painting3bhk": "https://images.unsplash.com/photo-1572297474802-d0944a3c1da2?auto=format&fit=crop&w=800&q=80",
    "wallPaint": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    "waterproof": "https://images.unsplash.com/photo-1581922814484-0b48460b7010?auto=format&fit=crop&w=800&q=80",
    "wood": "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=800&q=80",
    "carpenter": "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=800&q=80",
    "cupboard": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
    "door": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    "bed": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    "shelf": "https://images.unsplash.com/photo-1594224457860-23bcfbef9b69?auto=format&fit=crop&w=800&q=80",
    "salonMen": "https://images.unsplash.com/photo-1647140655214-e4a2d914971f?auto=format&fit=crop&w=800&q=80",
    "haircut": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80",
    "shave": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    "facial": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    "massage": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    "haircolor": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    "pedicure": "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    "salonWomen": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    "wax": "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=800&q=80",
    "facialWomen": "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80",
    "manicure": "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    "thread": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80",
    "hairspa": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    "insta": "https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=800",
}

SERVICES = [
    # ---------- AC & APPLIANCE REPAIR ----------
    {"id":"svc-ac-1","category_id":"ac-appliance","title":"AC Service & Repair","description":"Foam-jet deep clean, gas pressure check, filter wash & full diagnosis. Restores cooling and cuts power bills.","starting_price":499,"duration_mins":75,"rating":4.9,"review_count":2150,"image":IMG["ac"],"popular":True,"top_rated":True,"recommended":True,"inclusions":["Foam-jet chemical wash","Gas pressure check","Filter cleaning","30-day warranty"]},
    {"id":"svc-ac-2","category_id":"ac-appliance","title":"Washing Machine Repair","description":"Front-load & top-load diagnosis. Motor, drum, belt and water-inlet repair on the spot.","starting_price":279,"duration_mins":60,"rating":4.7,"review_count":960,"image":IMG["washer"],"popular":True,"inclusions":["Free inspection","Genuine parts","30-day warranty"]},
    {"id":"svc-ac-3","category_id":"ac-appliance","title":"Refrigerator Repair","description":"Cooling issues, gas refill, compressor & fan repair by certified technicians.","starting_price":299,"duration_mins":60,"rating":4.6,"review_count":780,"image":IMG["fridge"],"recommended":True,"inclusions":["Door seal check","Gas top-up","Thermostat test"]},
    {"id":"svc-ac-4","category_id":"ac-appliance","title":"Geyser Service & Install","description":"Descaling, heating-element repair and new geyser installation with wall mount.","starting_price":249,"duration_mins":45,"rating":4.7,"review_count":540,"image":IMG["geyser"],"inclusions":["Descaling","Element check","Safety test"]},
    {"id":"svc-ac-5","category_id":"ac-appliance","title":"Television Repair","description":"LED / LCD / Smart TV — panel, backlight, board and mounting service.","starting_price":399,"duration_mins":60,"rating":4.5,"review_count":420,"image":IMG["tv"],"inclusions":["Display test","Board diagnosis","Wall mount available"]},
    {"id":"svc-ac-6","category_id":"ac-appliance","title":"Microwave Repair","description":"Heating, turntable, magnetron and door-switch fix for all brands.","starting_price":349,"duration_mins":45,"rating":4.5,"review_count":310,"image":IMG["microwave"]},
    {"id":"svc-ac-7","category_id":"ac-appliance","title":"Chimney & Hob Service","description":"Filter clean, motor service, suction restore. Hob burner repair included.","starting_price":449,"duration_mins":60,"rating":4.6,"review_count":280,"image":IMG["chimney"]},
    {"id":"svc-ac-8","category_id":"ac-appliance","title":"Water Purifier Service","description":"RO / UV filter change, TDS test, leak repair and full sanitisation.","starting_price":199,"duration_mins":30,"rating":4.7,"review_count":650,"image":IMG["purifier"],"recommended":True,"inclusions":["Filter check","TDS test","Sanitisation"]},

    # ---------- ELECTRICIAN ----------
    {"id":"svc-elec-1","category_id":"electrician","title":"Switch & Socket Repair","description":"Switchboard replacement, loose socket fix and short-circuit diagnosis.","starting_price":99,"duration_mins":30,"rating":4.8,"review_count":1240,"image":IMG["switch"],"popular":True,"inclusions":["Safety inspection","Genuine parts","30-day warranty"]},
    {"id":"svc-elec-2","category_id":"electrician","title":"Fan Installation / Repair","description":"Ceiling, exhaust & wall fan install, regulator replacement and noise fix.","starting_price":149,"duration_mins":45,"rating":4.7,"review_count":820,"image":IMG["fan"],"recommended":True},
    {"id":"svc-elec-3","category_id":"electrician","title":"Light / LED Installation","description":"LED bulb, tube light, chandelier and false-ceiling light fitting.","starting_price":89,"duration_mins":30,"rating":4.7,"review_count":690,"image":IMG["light"]},
    {"id":"svc-elec-4","category_id":"electrician","title":"Full Home Wiring Inspection","description":"Complete circuit audit with load testing and earthing check.","starting_price":299,"duration_mins":90,"rating":4.8,"review_count":210,"image":IMG["wiring"],"top_rated":True,"inclusions":["Load test","Earthing check","Written report"]},
    {"id":"svc-elec-5","category_id":"electrician","title":"MCB / Fuse Repair","description":"Tripping MCB, blown fuse and main panel diagnostics.","starting_price":179,"duration_mins":45,"rating":4.6,"review_count":360,"image":IMG["electrician"]},
    {"id":"svc-elec-6","category_id":"electrician","title":"Doorbell & Security Install","description":"Doorbell, CCTV power, sensor light and intercom wiring.","starting_price":129,"duration_mins":30,"rating":4.7,"review_count":180,"image":IMG["electrician"]},

    # ---------- PLUMBER ----------
    {"id":"svc-plumb-1","category_id":"plumber","title":"Tap, Basin & Pipe Leak Fix","description":"Same-day fix for leaking taps, blocked drains, basin install & connection.","starting_price":179,"duration_mins":50,"rating":4.7,"review_count":690,"image":IMG["tap"],"popular":True,"inclusions":["Leak detection","Pipe sealant","30-day warranty"]},
    {"id":"svc-plumb-2","category_id":"plumber","title":"Toilet Repair & Install","description":"Western/Indian commode install, flush tank repair and seat replacement.","starting_price":229,"duration_mins":60,"rating":4.6,"review_count":420,"image":IMG["toilet"]},
    {"id":"svc-plumb-3","category_id":"plumber","title":"Bath & Shower Fitting","description":"Shower head, mixer, geyser pipe & bathtub plumbing service.","starting_price":249,"duration_mins":60,"rating":4.7,"review_count":380,"image":IMG["shower"],"recommended":True},
    {"id":"svc-plumb-4","category_id":"plumber","title":"Drainage & Blockage Clear","description":"Kitchen sink, bathroom drain & main line unblocking with motorised rod.","starting_price":199,"duration_mins":45,"rating":4.6,"review_count":510,"image":IMG["drain"]},
    {"id":"svc-plumb-5","category_id":"plumber","title":"Water Tank & Motor Service","description":"Tank cleaning, motor repair, foot-valve and submersible pump service.","starting_price":349,"duration_mins":75,"rating":4.7,"review_count":290,"image":IMG["plumber"],"inclusions":["Tank clean","Motor check","Voltage test"]},
    {"id":"svc-plumb-6","category_id":"plumber","title":"Pipe Connection / Replacement","description":"CPVC / GI pipe repair, new line laying and wall-cut work.","starting_price":299,"duration_mins":60,"rating":4.6,"review_count":340,"image":IMG["plumber"]},

    # ---------- CLEANING & PEST CONTROL ----------
    {"id":"svc-clean-1","category_id":"cleaning-pest","title":"Full Home Deep Cleaning","description":"Bathroom, kitchen, sofa & floor — chemical + machine deep clean by trained 2-person crew.","starting_price":1299,"duration_mins":240,"rating":4.8,"review_count":3120,"image":IMG["deepClean"],"popular":True,"top_rated":True,"inclusions":["All cleaning supplies","2-person crew","Eco-friendly chemicals"]},
    {"id":"svc-clean-2","category_id":"cleaning-pest","title":"Bathroom Deep Clean","description":"Tile scrubbing, descaling, fittings polish & sanitisation — 90 minute job.","starting_price":399,"duration_mins":90,"rating":4.7,"review_count":1480,"image":IMG["bathClean"],"recommended":True},
    {"id":"svc-clean-3","category_id":"cleaning-pest","title":"Kitchen Deep Cleaning","description":"Grease removal, chimney, hob, tile & cabinet deep clean.","starting_price":599,"duration_mins":120,"rating":4.7,"review_count":920,"image":IMG["kitchenClean"]},
    {"id":"svc-clean-4","category_id":"cleaning-pest","title":"Sofa & Upholstery Cleaning","description":"Foam shampoo + steam clean for fabric, leather and recliner sofas.","starting_price":499,"duration_mins":90,"rating":4.7,"review_count":640,"image":IMG["sofaClean"]},
    {"id":"svc-clean-5","category_id":"cleaning-pest","title":"Carpet & Mattress Cleaning","description":"Stain removal, vacuum + hot-water extraction for carpets and mattresses.","starting_price":299,"duration_mins":60,"rating":4.6,"review_count":480,"image":IMG["carpetClean"]},
    {"id":"svc-pest-1","category_id":"cleaning-pest","title":"General Pest Control","description":"Cockroach, ant & spider gel treatment. Odour-less and child-safe.","starting_price":899,"duration_mins":120,"rating":4.7,"review_count":670,"image":IMG["pest"],"recommended":True,"inclusions":["Odour-less","Child-safe","30-day re-treatment"]},
    {"id":"svc-pest-2","category_id":"cleaning-pest","title":"Cockroach / Ant Treatment","description":"Targeted gel & spray treatment for kitchen and bathroom areas.","starting_price":599,"duration_mins":60,"rating":4.7,"review_count":420,"image":IMG["pest"]},
    {"id":"svc-pest-3","category_id":"cleaning-pest","title":"Termite Treatment","description":"Deep injection treatment for walls, wood and flooring — 5-year warranty.","starting_price":1499,"duration_mins":180,"rating":4.8,"review_count":260,"image":IMG["termite"],"top_rated":True,"inclusions":["5-year warranty","Pre & post treatment","Safe chemicals"]},

    # ---------- HOME PAINTING ----------
    {"id":"svc-paint-1","category_id":"painting","title":"1 BHK Full Home Painting","description":"Premium emulsion with primer, putty work and 2 coats — furniture protected.","starting_price":4999,"duration_mins":480,"rating":4.7,"review_count":210,"image":IMG["painting1bhk"],"popular":True,"inclusions":["Putty + primer","2 coats premium emulsion","Furniture covering","Site cleanup"]},
    {"id":"svc-paint-2","category_id":"painting","title":"2 BHK Full Home Painting","description":"Premium emulsion painting for 2 BHK including ceiling and walls.","starting_price":7999,"duration_mins":720,"rating":4.7,"review_count":180,"image":IMG["painting2bhk"],"recommended":True,"inclusions":["Putty + primer","2 coats premium emulsion","Furniture covering","Site cleanup"]},
    {"id":"svc-paint-3","category_id":"painting","title":"3 BHK Full Home Painting","description":"Premium emulsion painting for 3 BHK including ceiling and walls.","starting_price":11999,"duration_mins":960,"rating":4.7,"review_count":120,"image":IMG["painting3bhk"]},
    {"id":"svc-paint-4","category_id":"painting","title":"Room Painting (per wall)","description":"Premium emulsion, primer & finish. Furniture protected.","starting_price":899,"duration_mins":360,"rating":4.7,"review_count":410,"image":IMG["wallPaint"]},
    {"id":"svc-paint-5","category_id":"painting","title":"Waterproofing","description":"Anti-leakage chemical coating for terrace, balcony and walls.","starting_price":2499,"duration_mins":480,"rating":4.6,"review_count":90,"image":IMG["waterproof"]},
    {"id":"svc-paint-6","category_id":"painting","title":"Wood Polish & Painting","description":"Furniture, door & cabinet polish or enamel paint restoration.","starting_price":1299,"duration_mins":240,"rating":4.7,"review_count":140,"image":IMG["wood"]},

    # ---------- CARPENTER ----------
    {"id":"svc-carp-1","category_id":"carpenter","title":"Cupboard & Drawer Repair","description":"Hinge alignment, drawer slider replacement and lock fitting.","starting_price":249,"duration_mins":60,"rating":4.6,"review_count":520,"image":IMG["cupboard"],"popular":True},
    {"id":"svc-carp-2","category_id":"carpenter","title":"Kitchen Fittings","description":"Modular drawer, basket, tandem & soft-close hinge installation.","starting_price":499,"duration_mins":120,"rating":4.7,"review_count":290,"image":IMG["carpenter"]},
    {"id":"svc-carp-3","category_id":"carpenter","title":"Shelves & Decor Install","description":"Wall shelf, photo frame, mirror and decor item fitting.","starting_price":299,"duration_mins":60,"rating":4.6,"review_count":210,"image":IMG["shelf"]},
    {"id":"svc-carp-4","category_id":"carpenter","title":"Wooden Door Repair","description":"Door alignment, hinge, lock, handle and frame repair.","starting_price":349,"duration_mins":75,"rating":4.6,"review_count":340,"image":IMG["door"]},
    {"id":"svc-carp-5","category_id":"carpenter","title":"Bed Repair / Assembly","description":"Wooden bed repair, hydraulic mechanism fix and new bed assembly.","starting_price":399,"duration_mins":90,"rating":4.7,"review_count":260,"image":IMG["bed"],"recommended":True},
    {"id":"svc-carp-6","category_id":"carpenter","title":"Furniture Assembly","description":"Flat-pack furniture (Ikea, Pepperfry, etc.) and modular unit assembly.","starting_price":299,"duration_mins":60,"rating":4.7,"review_count":180,"image":IMG["carpenter"]},

    # ---------- MEN'S SALON ----------
    {"id":"svc-mensalon-1","category_id":"salon-men","title":"Haircut & Styling","description":"Classic / modern haircut with shampoo and styling by trained barber.","starting_price":199,"duration_mins":45,"rating":4.9,"review_count":4120,"image":IMG["haircut"],"popular":True,"top_rated":True},
    {"id":"svc-mensalon-2","category_id":"salon-men","title":"Shave & Beard Grooming","description":"Hot-towel shave, beard trim & styling with premium products.","starting_price":149,"duration_mins":30,"rating":4.8,"review_count":2410,"image":IMG["shave"]},
    {"id":"svc-mensalon-3","category_id":"salon-men","title":"Facial & Cleanup","description":"Deep-cleansing facial with steam, scrub and mask. Sealed products.","starting_price":399,"duration_mins":60,"rating":4.8,"review_count":1820,"image":IMG["facial"],"recommended":True},
    {"id":"svc-mensalon-4","category_id":"salon-men","title":"Head Massage","description":"30-min relaxing head, neck & shoulder massage with aroma oil.","starting_price":249,"duration_mins":30,"rating":4.8,"review_count":640,"image":IMG["massage"]},
    {"id":"svc-mensalon-5","category_id":"salon-men","title":"Hair Colour","description":"Ammonia-free hair colour, beard colour and grey-coverage.","starting_price":599,"duration_mins":60,"rating":4.7,"review_count":420,"image":IMG["haircolor"]},
    {"id":"svc-mensalon-6","category_id":"salon-men","title":"Pedicure","description":"Foot scrub, nail care, massage and polish at your doorstep.","starting_price":349,"duration_mins":45,"rating":4.7,"review_count":280,"image":IMG["pedicure"]},

    # ---------- WOMEN'S SALON ----------
    {"id":"svc-womensalon-1","category_id":"salon-women","title":"Waxing (Full Body)","description":"Full body roll-on waxing with premium wax — hygienic single-use strips.","starting_price":799,"duration_mins":90,"rating":4.9,"review_count":3120,"image":IMG["wax"],"popular":True,"top_rated":True},
    {"id":"svc-womensalon-2","category_id":"salon-women","title":"Premium Facial","description":"Brand-name facial (O3+/VLCC/Lotus) with sealed product opened in front of you.","starting_price":699,"duration_mins":75,"rating":4.8,"review_count":2410,"image":IMG["facialWomen"],"recommended":True},
    {"id":"svc-womensalon-3","category_id":"salon-women","title":"Cleanup","description":"Express facial — cleanse, scrub, mask in 45 minutes.","starting_price":399,"duration_mins":45,"rating":4.8,"review_count":1920,"image":IMG["facialWomen"]},
    {"id":"svc-womensalon-4","category_id":"salon-women","title":"Pedicure & Manicure","description":"Hand and foot care with scrub, massage and nail finish.","starting_price":499,"duration_mins":60,"rating":4.8,"review_count":1420,"image":IMG["manicure"]},
    {"id":"svc-womensalon-5","category_id":"salon-women","title":"Threading & Face Hair Removal","description":"Eyebrow, upper-lip and forehead threading by skilled beautician.","starting_price":99,"duration_mins":20,"rating":4.8,"review_count":2810,"image":IMG["thread"],"popular":True},
    {"id":"svc-womensalon-6","category_id":"salon-women","title":"Hair Spa & Care","description":"Anti-dandruff or repair hair spa with head massage and steam.","starting_price":599,"duration_mins":90,"rating":4.8,"review_count":820,"image":IMG["hairspa"]},

    # ---------- INSTA HELP ----------
    {"id":"svc-insta-1","category_id":"insta-help","title":"1 Hour Help","description":"On-demand assistance for quick chores, lifting, fitting and house help.","starting_price":79,"duration_mins":60,"rating":4.7,"review_count":7900,"image":IMG["insta"],"popular":True},
    {"id":"svc-insta-2","category_id":"insta-help","title":"1.5 Hours Help","description":"90-min fast helper booking for cleaning, errand or fitting tasks.","starting_price":119,"duration_mins":90,"rating":4.7,"review_count":4200,"image":IMG["insta"]},
    {"id":"svc-insta-3","category_id":"insta-help","title":"2 Hours Help","description":"2-hour booking for cleaning, packing, lifting or general help.","starting_price":179,"duration_mins":120,"rating":4.7,"review_count":3100,"image":IMG["insta"],"recommended":True},
    {"id":"svc-insta-4","category_id":"insta-help","title":"3 Hours Help","description":"Half-day helper — ideal for shifting, deep tasks or party support.","starting_price":269,"duration_mins":180,"rating":4.7,"review_count":1800,"image":IMG["insta"]},
]

# Insert in batches — PostgREST requires every row to have the same keys
ALL_KEYS = set()
for s in SERVICES:
    ALL_KEYS.update(s.keys())

def normalize(s):
    out = {}
    for k in ALL_KEYS:
        if k in s:
            out[k] = s[k]
        else:
            # sensible defaults so PostgREST is happy and DB defaults still apply when None
            if k in ("popular", "top_rated", "recommended"):
                out[k] = False
            elif k == "inclusions":
                out[k] = []
            else:
                out[k] = None
    return out

normalized = [normalize(s) for s in SERVICES]

BATCH = 20
inserted = 0
for i in range(0, len(normalized), BATCH):
    chunk = normalized[i:i+BATCH]
    r = req("POST", "/services", data=json.dumps(chunk))
    if r.ok:
        inserted += len(chunk)
        print(f"  → inserted {inserted}/{len(normalized)}")
    else:
        print(f"  ✗ FAILED batch {i}: {r.text[:500]}")
        sys.exit(1)

print(f"\n✅ DONE. {inserted} services live. {len(CATEGORIES)} categories live.")

# Final verification
r = req("GET", "/services?select=id,category_id&limit=1000")
rows = r.json() if r.ok else []
print(f"   Verify GET /services count = {len(rows)}")
r = req("GET", "/categories?select=id,name&order=name")
print(f"   Categories now in DB: {[c['name'] for c in r.json()] if r.ok else '?'}")
