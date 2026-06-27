#!/usr/bin/env python3
"""Seed default Mfixit Cover sections + rate card items for all 9 categories,
so the admin panel shows pre-filled rows that can be edited (instead of empty)."""
import os, json, requests
from pathlib import Path

env = Path("/app/backend/.env")
for line in env.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1); os.environ.setdefault(k.strip(), v.strip())

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=representation,resolution=merge-duplicates"}

CATS = ["salon-women","salon-men","cleaning-pest","painting","ac-appliance","electrician","insta-help","plumber","carpenter"]

SECTIONS_DEFAULT = [
    ("warranty", "30-day warranty on repairs", [
        "Free repairs if the same issue arises",
        "One-click hassle-free claims",
        "Up to ₹10,000 cover if anything is damaged during the repair",
    ]),
    ("expert", "Expert verified repair quotes", [
        "We will verify the repair quote shared by the professional",
        "If you're still unsure, you can ask an expert for a second opinion",
    ]),
    ("rate", "Fixed rate card", [
        "All our prices are decided basis market standards",
        "If charged differently, reach out to our help centre",
    ]),
    ("benefits", "Category specific benefits", [
        "Quality materials only",
        "Trained & verified professionals",
        "Workmanship guarantee included",
    ]),
    ("support", "24/7 Customer support", [
        "Our support team is available round the clock to help",
        "Quick resolution within 24 hours for all warranty claims",
    ]),
]

# rate card per category - sensible defaults
RATE_CARDS = {
  "electrician":[("Switch / socket replacement","1-gang",99),("Fan installation","Ceiling/Wall",149),("Light/LED installation","",89),("MCB / Fuse repair","",179),("Doorbell install","",129)],
  "plumber":[("Tap / mixer repair","",149),("Toilet flush repair","",229),("Drain unblocking","Kitchen/Bath",199),("Pipe leak fix","",179),("Water tank cleaning","",349)],
  "ac-appliance":[("AC service","Per unit",499),("Washing machine repair","Top/Front",279),("Refrigerator gas refill","",699),("Geyser repair","",249),("Microwave repair","",349)],
  "carpenter":[("Door repair","Hinges/Lock",149),("Drawer slider replace","",299),("Bed assembly","",399),("Shelf installation","",199),("Wardrobe repair","",499)],
  "painting":[("Single wall painting","Per wall",899),("1 BHK painting","",4999),("Waterproofing","",2499),("Wood polish","",1299),("Touch-up","",499)],
  "cleaning-pest":[("Bathroom deep clean","Per bath",399),("Kitchen deep clean","",599),("Full home cleaning","",1299),("Pest control","Cockroach/Ant",899),("Termite treatment","",1499)],
  "salon-women":[("Waxing - full body","",799),("Premium facial","",699),("Cleanup","",399),("Pedicure & manicure","",499),("Threading","",99)],
  "salon-men":[("Haircut & styling","",199),("Shave & beard","",149),("Facial","",399),("Hair colour","",599),("Head massage","",249)],
  "insta-help":[("1 hour help","",79),("1.5 hours help","",119),("2 hours help","",179),("3 hours help","",269)],
}

print("=== Seed cover sections ===")
n = 0
for cat in CATS:
    for i, (key, title, bullets) in enumerate(SECTIONS_DEFAULT):
        r = requests.post(
            f"{URL}/rest/v1/mfixit_cover_sections?on_conflict=category_id,section_key",
            headers=H,
            data=json.dumps({"category_id": cat, "section_key": key, "title": title, "bullets": bullets, "sort_order": i, "is_active": True}),
            timeout=15
        )
        if r.ok: n += 1
        else: print(f"  ⚠ {cat}/{key}: {r.status_code} {r.text[:120]}")
print(f"✓ Upserted {n} cover sections")

print("\n=== Seed rate card items ===")
m = 0
for cat, items in RATE_CARDS.items():
    # Skip if rows already exist (avoid duplication)
    g = requests.get(f"{URL}/rest/v1/rate_card_items?category_id=eq.{cat}&select=id", headers=H, timeout=15)
    if g.ok and len(g.json()) >= len(items):
        print(f"  skip {cat} (already has rows)")
        continue
    for i, (name, sub, price) in enumerate(items):
        r = requests.post(
            f"{URL}/rest/v1/rate_card_items",
            headers=H,
            data=json.dumps({"category_id": cat, "service_name": name, "sub_label": sub or None, "price": price, "price_suffix": "onwards", "sort_order": i, "is_active": True}),
            timeout=15
        )
        if r.ok: m += 1
print(f"✓ Inserted {m} rate card items")
print("\nDone.")
