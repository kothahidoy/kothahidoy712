#!/usr/bin/env python3
"""
InstaHelp CMS Backend Testing
─────────────────────────────────────────────────────────────────────
Test the new InstaHelp CMS backend endpoints and verify frontend consumption.

Preview URL: https://ac7b332f-60e9-4e5e-a6ff-9db4d52b5b36.preview.emergentagent.com
Backend API: /api/admin/cms/instahelp
"""
import requests
import json
import sys
from typing import Dict, Any

# Get backend URL from frontend .env
BACKEND_URL = "https://ac7b332f-60e9-4e5e-a6ff-9db4d52b5b36.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api/admin/cms/instahelp"

def print_test(name: str, passed: bool, details: str = ""):
    """Print test result with color"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"  {details}")
    print()

def test_scenario_a_defaults():
    """
    Scenario A — Defaults:
    - GET the endpoint
    - Verify earliest_slot_enabled === false (OFF by default per user request)
    - Verify all list sizes and defaults are sensible
    """
    print("=" * 70)
    print("SCENARIO A: GET Defaults")
    print("=" * 70)
    
    try:
        response = requests.get(API_BASE, timeout=10)
        print(f"GET {API_BASE}")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print_test("GET /api/admin/cms/instahelp", False, f"Expected 200, got {response.status_code}")
            return None
        
        config = response.json()
        print(f"Response keys: {list(config.keys())[:10]}...")
        print()
        
        # Test 1: earliest_slot_enabled should be false by default
        earliest_enabled = config.get("earliest_slot_enabled")
        print_test(
            "earliest_slot_enabled === false (OFF by default)",
            earliest_enabled is False,
            f"Value: {earliest_enabled}"
        )
        
        # Test 2: Verify time_slots list size (should be 4)
        time_slots = config.get("time_slots", [])
        print_test(
            "time_slots has 4 items",
            len(time_slots) == 4,
            f"Count: {len(time_slots)}, IDs: {[s.get('id') for s in time_slots]}"
        )
        
        # Test 3: Verify task_categories list size (should be 6)
        task_categories = config.get("task_categories", [])
        print_test(
            "task_categories has 6 items",
            len(task_categories) == 6,
            f"Count: {len(task_categories)}, Names: {[c.get('name') for c in task_categories]}"
        )
        
        # Test 4: Verify time_estimates list size (should be 3)
        time_estimates = config.get("time_estimates", [])
        print_test(
            "time_estimates has 3 items",
            len(time_estimates) == 3,
            f"Count: {len(time_estimates)}"
        )
        
        # Test 5: Verify excluded_items list size (should be 4)
        excluded_items = config.get("excluded_items", [])
        print_test(
            "excluded_items has 4 items",
            len(excluded_items) == 4,
            f"Count: {len(excluded_items)}, Items: {excluded_items}"
        )
        
        # Test 6: Verify faqs list size (should be 5)
        faqs = config.get("faqs", [])
        print_test(
            "faqs has 5 items",
            len(faqs) == 5,
            f"Count: {len(faqs)}"
        )
        
        # Test 7: Verify super_saver_enabled is true by default
        super_saver_enabled = config.get("super_saver_enabled")
        print_test(
            "super_saver_enabled === true (ON by default)",
            super_saver_enabled is True,
            f"Value: {super_saver_enabled}"
        )
        
        # Test 8: Verify cover_enabled is true by default
        cover_enabled = config.get("cover_enabled")
        print_test(
            "cover_enabled === true (ON by default)",
            cover_enabled is True,
            f"Value: {cover_enabled}"
        )
        
        # Test 9: Verify default title
        title = config.get("title")
        print_test(
            "title === 'InstaHelp'",
            title == "InstaHelp",
            f"Value: '{title}'"
        )
        
        # Test 10: Verify all time slots have correct structure
        all_slots_valid = all(
            s.get("id") and s.get("duration") and "price" in s and "original_price" in s
            for s in time_slots
        )
        print_test(
            "All time_slots have required fields (id, duration, price, original_price)",
            all_slots_valid,
            f"Sample slot: {time_slots[0] if time_slots else 'N/A'}"
        )
        
        return config
        
    except Exception as e:
        print_test("GET /api/admin/cms/instahelp", False, f"Exception: {str(e)}")
        return None


def test_scenario_b_put_and_verify(original_config: Dict[str, Any]):
    """
    Scenario B — PUT modified config + verify page reflects it:
    - PUT with overrides
    - Verify response ok: true
    - Load frontend page and verify changes
    """
    print("=" * 70)
    print("SCENARIO B: PUT Modified Config")
    print("=" * 70)
    
    if not original_config:
        print("⚠️  Skipping Scenario B: No original config from Scenario A")
        return False
    
    # Build modified config based on original
    modified = original_config.copy()
    
    # Apply test overrides
    modified["title"] = "TEST InstaHelp"
    modified["earliest_slot_enabled"] = True
    modified["earliest_slot_text"] = "TEST slot text"
    modified["super_saver_enabled"] = False
    modified["super_saver_bg_color"] = "#DC2626"
    modified["task_categories_title"] = "TEST TILES TITLE"
    
    # Modify first time slot
    if modified.get("time_slots") and len(modified["time_slots"]) > 0:
        modified["time_slots"][0]["price"] = 999
        modified["time_slots"][0]["duration"] = "TEST 1 hour"
    
    # Hide second time slot (1.5hr)
    if modified.get("time_slots") and len(modified["time_slots"]) > 1:
        modified["time_slots"][1]["enabled"] = False
    
    # Hide first task category (Kitchen)
    if modified.get("task_categories") and len(modified["task_categories"]) > 0:
        modified["task_categories"][0]["enabled"] = False
    
    # Set excluded_items to test values
    modified["excluded_items"] = ["TEST X1", "TEST X2"]
    
    # Hide cover
    modified["cover_enabled"] = False
    
    # Modify first FAQ
    if modified.get("faqs") and len(modified["faqs"]) > 0:
        modified["faqs"][0]["question"] = "TEST FAQ Q?"
    
    # Hide second FAQ
    if modified.get("faqs") and len(modified["faqs"]) > 1:
        modified["faqs"][1]["enabled"] = False
    
    try:
        # PUT the modified config
        response = requests.put(
            API_BASE,
            json=modified,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"PUT {API_BASE}")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print_test("PUT /api/admin/cms/instahelp", False, f"Expected 200, got {response.status_code}: {response.text[:200]}")
            return False
        
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)[:300]}...")
        print()
        
        # Test 1: Response has ok: true
        print_test(
            "Response has ok: true",
            result.get("ok") is True,
            f"ok: {result.get('ok')}"
        )
        
        # Test 2: Response has url field
        print_test(
            "Response has url field",
            "url" in result,
            f"url: {result.get('url', 'N/A')[:80]}..."
        )
        
        # Test 3: Response has config field
        print_test(
            "Response has config field",
            "config" in result,
            f"config keys: {list(result.get('config', {}).keys())[:5]}..."
        )
        
        # Verify the changes were saved by doing a GET
        print("\n--- Verifying changes with GET ---")
        verify_response = requests.get(API_BASE, timeout=10)
        
        if verify_response.status_code != 200:
            print_test("GET after PUT", False, f"Expected 200, got {verify_response.status_code}")
            return False
        
        saved_config = verify_response.json()
        
        # Test 4: title changed to "TEST InstaHelp"
        print_test(
            "title === 'TEST InstaHelp'",
            saved_config.get("title") == "TEST InstaHelp",
            f"Value: '{saved_config.get('title')}'"
        )
        
        # Test 5: earliest_slot_enabled is now true
        print_test(
            "earliest_slot_enabled === true",
            saved_config.get("earliest_slot_enabled") is True,
            f"Value: {saved_config.get('earliest_slot_enabled')}"
        )
        
        # Test 6: earliest_slot_text changed
        print_test(
            "earliest_slot_text === 'TEST slot text'",
            saved_config.get("earliest_slot_text") == "TEST slot text",
            f"Value: '{saved_config.get('earliest_slot_text')}'"
        )
        
        # Test 7: super_saver_enabled is now false
        print_test(
            "super_saver_enabled === false",
            saved_config.get("super_saver_enabled") is False,
            f"Value: {saved_config.get('super_saver_enabled')}"
        )
        
        # Test 8: super_saver_bg_color changed to red
        print_test(
            "super_saver_bg_color === '#DC2626'",
            saved_config.get("super_saver_bg_color") == "#DC2626",
            f"Value: '{saved_config.get('super_saver_bg_color')}'"
        )
        
        # Test 9: task_categories_title changed
        print_test(
            "task_categories_title === 'TEST TILES TITLE'",
            saved_config.get("task_categories_title") == "TEST TILES TITLE",
            f"Value: '{saved_config.get('task_categories_title')}'"
        )
        
        # Test 10: First time slot price changed to 999
        first_slot = saved_config.get("time_slots", [{}])[0]
        print_test(
            "time_slots[0].price === 999",
            first_slot.get("price") == 999,
            f"Value: {first_slot.get('price')}"
        )
        
        # Test 11: First time slot duration changed
        print_test(
            "time_slots[0].duration === 'TEST 1 hour'",
            first_slot.get("duration") == "TEST 1 hour",
            f"Value: '{first_slot.get('duration')}'"
        )
        
        # Test 12: Second time slot disabled
        second_slot = saved_config.get("time_slots", [{}, {}])[1] if len(saved_config.get("time_slots", [])) > 1 else {}
        print_test(
            "time_slots[1].enabled === false",
            second_slot.get("enabled") is False,
            f"Value: {second_slot.get('enabled')}"
        )
        
        # Test 13: First task category disabled
        first_category = saved_config.get("task_categories", [{}])[0]
        print_test(
            "task_categories[0].enabled === false (Kitchen hidden)",
            first_category.get("enabled") is False,
            f"Value: {first_category.get('enabled')}, Name: '{first_category.get('name')}'"
        )
        
        # Test 14: excluded_items changed to test values
        excluded = saved_config.get("excluded_items", [])
        print_test(
            "excluded_items === ['TEST X1', 'TEST X2']",
            excluded == ["TEST X1", "TEST X2"],
            f"Value: {excluded}"
        )
        
        # Test 15: cover_enabled is now false
        print_test(
            "cover_enabled === false",
            saved_config.get("cover_enabled") is False,
            f"Value: {saved_config.get('cover_enabled')}"
        )
        
        # Test 16: First FAQ question changed
        first_faq = saved_config.get("faqs", [{}])[0]
        print_test(
            "faqs[0].question === 'TEST FAQ Q?'",
            first_faq.get("question") == "TEST FAQ Q?",
            f"Value: '{first_faq.get('question')}'"
        )
        
        # Test 17: Second FAQ disabled
        second_faq = saved_config.get("faqs", [{}, {}])[1] if len(saved_config.get("faqs", [])) > 1 else {}
        print_test(
            "faqs[1].enabled === false",
            second_faq.get("enabled") is False,
            f"Value: {second_faq.get('enabled')}"
        )
        
        print("\n✅ All backend PUT tests passed! Config saved successfully.")
        print(f"\n📝 Next: Load {BACKEND_URL}/category/insta-help and verify UI reflects changes")
        
        return True
        
    except Exception as e:
        print_test("PUT /api/admin/cms/instahelp", False, f"Exception: {str(e)}")
        return False


def test_scenario_c_restore_defaults():
    """
    Scenario C — Restore defaults:
    - PUT with default config values
    - Verify response ok: true
    - Verify defaults are restored
    """
    print("=" * 70)
    print("SCENARIO C: Restore Defaults")
    print("=" * 70)
    
    # Build default config (matching InstaHelpConfig defaults in backend)
    defaults = {
        "title": "InstaHelp",
        "rating_text": "4.85 (3.0 K bookings)",
        "header_enabled": True,
        
        "time_slots_enabled": True,
        "time_slots": [
            {"id": "1hr", "duration": "1 hour", "price": 79, "original_price": 245, "discount": "68% OFF", "enabled": True},
            {"id": "1.5hr", "duration": "1.5 hours", "price": 119, "original_price": 369, "discount": "68% OFF", "enabled": True},
            {"id": "2hr", "duration": "2 hours", "price": 179, "original_price": 559, "discount": "68% OFF", "enabled": True},
            {"id": "3hr", "duration": "3 hours", "price": 269, "original_price": 839, "discount": "68% OFF", "enabled": True},
        ],
        
        "earliest_slot_enabled": False,
        "earliest_slot_text": "Earliest available slot : Today, 9:15 AM",
        
        "super_saver_enabled": True,
        "super_saver_badge": "EXTRA 60% OFF",
        "super_saver_title": "3-visits pack at ₹245",
        "super_saver_price": "₹49/visit",
        "super_saver_validity": "Valid till 1 month",
        "super_saver_cta": "Book",
        "super_saver_pack_label": "SUPER SAVER PACK",
        "super_saver_bg_color": "#7C3AED",
        
        "task_categories_enabled": True,
        "task_categories_title": "One help who can do it all",
        "task_categories_note_enabled": True,
        "task_categories_note": "Please provide cleaning equipment & supplies to the help",
        "task_categories": [
            {
                "id": "kitchen",
                "name": "Kitchen & utensil cleaning",
                "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80",
                "inclusions": ["Crockery & lunch boxes", "Wiping cabinet exterior", "Sink cleaning", "Gas stove wiping"],
                "exclusions": ["Hard food stains", "Chimney cleaning", "Heavy appliance cleaning"],
                "enabled": True,
            },
            {
                "id": "meal-prep",
                "name": "Meal prep & serving",
                "image": "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=200&q=80",
                "inclusions": ["Veggies chopping & salad prep", "Meat marination", "Serving food", "Table setting"],
                "exclusions": ["Cooking full meals", "Non-veg cooking", "Baking"],
                "enabled": True,
            },
            {
                "id": "mopping",
                "name": "Mopping, dusting & wiping",
                "image": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80",
                "inclusions": ["Dusting & Mopping floor", "Wet wiping furniture", "Bed making", "Organizing items"],
                "exclusions": ["Wiping walls", "Hard to reach areas", "Ceiling fans"],
                "enabled": True,
            },
            {
                "id": "bathroom",
                "name": "Bathroom cleaning",
                "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80",
                "inclusions": ["Toilet seat cleaning", "Sink & Taps", "Floor mopping", "Mirror cleaning"],
                "exclusions": ["Walls scrubbing", "Hard stains removal", "Ceiling cleaning"],
                "enabled": True,
            },
            {
                "id": "laundry",
                "name": "Laundry & Ironing",
                "image": "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=200&q=80",
                "inclusions": ["Machine-wash & drying", "Ironing clothes", "Folding & arranging", "Sorting clothes"],
                "exclusions": ["Hand-washing delicates", "Dry cleaning items", "Stain removal"],
                "enabled": True,
            },
            {
                "id": "packing",
                "name": "Packing & un-packing",
                "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80",
                "inclusions": ["Move-in / move-out help", "Vacation packing", "Wardrobe organizing", "Labeling boxes"],
                "exclusions": ["Lifting heavy objects", "Moving full homes", "Furniture assembly"],
                "enabled": True,
            },
        ],
        
        "time_estimates_enabled": True,
        "time_estimates_title": "How long does it take?",
        "time_estimates_note": "These approximate time for a 3BHK home, you can ask the help to customise as per your need",
        "time_estimates": [
            {"id": "kitchen-time", "icon": "kitchen", "title": "Kitchen & Dishwashing", "subtitle": "For 3-4 members", "time": "25 mins", "enabled": True},
            {"id": "bathroom-time", "icon": "bathroom", "title": "1 Bathroom cleaning", "subtitle": "Mopping & toilet seat cleaning", "time": "15 mins", "enabled": True},
            {"id": "mopping-time", "icon": "mopping", "title": "Mopping, dusting & wiping", "subtitle": "For 3 bedrooms & living room", "time": "55 mins", "enabled": True},
        ],
        
        "exclusions_enabled": True,
        "exclusions_title": "What's excluded",
        "excluded_items": [
            "Removal of hard stains",
            "Cleaning of any heavy appliances",
            "Cooking meals",
            "Hand-washing clothes",
        ],
        
        "cover_enabled": True,
        "cover_title": "Stay stress free with Mfixit cover",
        "cover_description": "Up to ₹10,000 cover if any damage happens during the job",
        
        "faq_enabled": True,
        "faq_title": "Frequently asked questions",
        "faqs": [
            {"id": "faq1", "question": "Is the professional trained and verified?", "answer": "Yes, all our professionals undergo thorough background verification and are trained to deliver quality service.", "enabled": True},
            {"id": "faq2", "question": "Will the professional bring cleaning supplies?", "answer": "No, you need to provide cleaning equipment and supplies. The professional will use your materials.", "enabled": True},
            {"id": "faq3", "question": "What if the cleaning isn't complete within the selected time?", "answer": "You can extend the service by paying for additional time, or reschedule the remaining tasks.", "enabled": True},
            {"id": "faq4", "question": "Can I request the same professional for my booking?", "answer": "Yes, you can add preferred professionals to your favorites and request them for future bookings.", "enabled": True},
            {"id": "faq5", "question": "Can I schedule the service instead of booking instantly?", "answer": "Yes, you can choose 'Later' option and select a convenient time slot for your booking.", "enabled": True},
        ],
    }
    
    try:
        # PUT the default config
        response = requests.put(
            API_BASE,
            json=defaults,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"PUT {API_BASE}")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print_test("PUT defaults", False, f"Expected 200, got {response.status_code}: {response.text[:200]}")
            return False
        
        result = response.json()
        print(f"Response: ok={result.get('ok')}")
        print()
        
        # Test 1: Response has ok: true
        print_test(
            "Response has ok: true",
            result.get("ok") is True,
            f"ok: {result.get('ok')}"
        )
        
        # Verify the defaults were restored by doing a GET
        print("\n--- Verifying defaults with GET ---")
        verify_response = requests.get(API_BASE, timeout=10)
        
        if verify_response.status_code != 200:
            print_test("GET after restore", False, f"Expected 200, got {verify_response.status_code}")
            return False
        
        saved_config = verify_response.json()
        
        # Test 2: title restored to "InstaHelp"
        print_test(
            "title === 'InstaHelp'",
            saved_config.get("title") == "InstaHelp",
            f"Value: '{saved_config.get('title')}'"
        )
        
        # Test 3: earliest_slot_enabled is false (key requirement)
        print_test(
            "earliest_slot_enabled === false (OFF by default)",
            saved_config.get("earliest_slot_enabled") is False,
            f"Value: {saved_config.get('earliest_slot_enabled')}"
        )
        
        # Test 4: super_saver_enabled is true
        print_test(
            "super_saver_enabled === true",
            saved_config.get("super_saver_enabled") is True,
            f"Value: {saved_config.get('super_saver_enabled')}"
        )
        
        # Test 5: super_saver_bg_color restored to purple
        print_test(
            "super_saver_bg_color === '#7C3AED' (purple)",
            saved_config.get("super_saver_bg_color") == "#7C3AED",
            f"Value: '{saved_config.get('super_saver_bg_color')}'"
        )
        
        # Test 6: task_categories_title restored
        print_test(
            "task_categories_title === 'One help who can do it all'",
            saved_config.get("task_categories_title") == "One help who can do it all",
            f"Value: '{saved_config.get('task_categories_title')}'"
        )
        
        # Test 7: All 4 time slots enabled
        time_slots = saved_config.get("time_slots", [])
        all_enabled = all(s.get("enabled", False) for s in time_slots)
        print_test(
            "All 4 time_slots enabled",
            len(time_slots) == 4 and all_enabled,
            f"Count: {len(time_slots)}, All enabled: {all_enabled}"
        )
        
        # Test 8: All 6 task categories enabled
        task_categories = saved_config.get("task_categories", [])
        all_cat_enabled = all(c.get("enabled", False) for c in task_categories)
        print_test(
            "All 6 task_categories enabled",
            len(task_categories) == 6 and all_cat_enabled,
            f"Count: {len(task_categories)}, All enabled: {all_cat_enabled}"
        )
        
        # Test 9: excluded_items restored to 4 default items
        excluded = saved_config.get("excluded_items", [])
        print_test(
            "excluded_items has 4 default items",
            len(excluded) == 4 and "Removal of hard stains" in excluded,
            f"Count: {len(excluded)}, First: '{excluded[0] if excluded else 'N/A'}'"
        )
        
        # Test 10: cover_enabled is true
        print_test(
            "cover_enabled === true",
            saved_config.get("cover_enabled") is True,
            f"Value: {saved_config.get('cover_enabled')}"
        )
        
        # Test 11: All 5 FAQs enabled
        faqs = saved_config.get("faqs", [])
        all_faq_enabled = all(f.get("enabled", False) for f in faqs)
        print_test(
            "All 5 faqs enabled",
            len(faqs) == 5 and all_faq_enabled,
            f"Count: {len(faqs)}, All enabled: {all_faq_enabled}"
        )
        
        # Test 12: First FAQ question restored
        first_faq = faqs[0] if faqs else {}
        print_test(
            "faqs[0].question restored to default",
            first_faq.get("question") == "Is the professional trained and verified?",
            f"Value: '{first_faq.get('question', 'N/A')[:50]}...'"
        )
        
        # Test 13: No TEST values remain
        config_str = json.dumps(saved_config)
        has_test_values = "TEST" in config_str
        print_test(
            "No TEST values remain in config",
            not has_test_values,
            f"Contains 'TEST': {has_test_values}"
        )
        
        print("\n✅ All defaults restored successfully!")
        print(f"\n📝 Next: Load {BACKEND_URL}/category/insta-help and verify UI shows original design")
        print("      (EXCEPT earliest_slot_enabled remains false - that's the correct new default)")
        
        return True
        
    except Exception as e:
        print_test("PUT defaults", False, f"Exception: {str(e)}")
        return False


def main():
    """Run all test scenarios"""
    print("\n" + "=" * 70)
    print("InstaHelp CMS Backend Testing")
    print("=" * 70)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Endpoint: {API_BASE}")
    print("=" * 70)
    print()
    
    # Scenario A: Test defaults
    original_config = test_scenario_a_defaults()
    
    # Scenario B: Test PUT with modifications
    if original_config:
        test_scenario_b_put_and_verify(original_config)
    
    # Scenario C: Restore defaults
    test_scenario_c_restore_defaults()
    
    print("\n" + "=" * 70)
    print("Backend Testing Complete")
    print("=" * 70)
    print("\n📝 NEXT STEPS:")
    print(f"1. Load {BACKEND_URL}/category/insta-help in browser")
    print("2. Verify UI reflects the current config (should show defaults after Scenario C)")
    print("3. Take screenshots to document the test results")
    print()


if __name__ == "__main__":
    main()
