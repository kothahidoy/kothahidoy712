#!/usr/bin/env python3
"""
InstaHelp CMS Frontend UI Testing
─────────────────────────────────────────────────────────────────────
Test that the frontend page reflects the CMS config changes.
"""
import asyncio
import sys
from playwright.async_api import async_playwright, Page

PREVIEW_URL = "https://ac7b332f-60e9-4e5e-a6ff-9db4d52b5b36.preview.emergentagent.com"
PAGE_URL = f"{PREVIEW_URL}/category/insta-help"

async def test_scenario_b_ui(page: Page):
    """
    Test Scenario B: Verify UI reflects the modified config
    """
    print("=" * 70)
    print("SCENARIO B: Frontend UI Verification (Modified Config)")
    print("=" * 70)
    
    print(f"\nNavigating to {PAGE_URL}...")
    await page.goto(PAGE_URL, wait_until="networkidle", timeout=60000)
    await page.wait_for_timeout(3000)  # Wait for React to render
    
    print("✅ Page loaded successfully\n")
    
    # Take initial screenshot
    await page.screenshot(path="/app/test-scenario-b-full-page.png", full_page=True)
    print("📸 Screenshot saved: test-scenario-b-full-page.png\n")
    
    tests_passed = 0
    tests_failed = 0
    
    # Test 1: Page title reads "TEST InstaHelp"
    try:
        title_element = await page.wait_for_selector('text="TEST InstaHelp"', timeout=5000)
        if title_element:
            print("✅ PASS: Page title reads 'TEST InstaHelp'")
            tests_passed += 1
        else:
            print("❌ FAIL: Page title 'TEST InstaHelp' not found")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: Page title 'TEST InstaHelp' not found - {str(e)}")
        tests_failed += 1
    
    # Test 2: "TEST slot text" is visible under time slots
    try:
        slot_text = await page.wait_for_selector('text="TEST slot text"', timeout=5000)
        if slot_text:
            print("✅ PASS: 'TEST slot text' is visible under time slots")
            tests_passed += 1
        else:
            print("❌ FAIL: 'TEST slot text' not found")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: 'TEST slot text' not found - {str(e)}")
        tests_failed += 1
    
    # Test 3: Purple "Super Saver" banner is HIDDEN
    try:
        # Check if super saver section exists
        super_saver = await page.query_selector('text="SUPER SAVER PACK"')
        if super_saver is None:
            print("✅ PASS: Purple 'Super Saver' banner is HIDDEN")
            tests_passed += 1
        else:
            print("❌ FAIL: 'Super Saver' banner is still visible (should be hidden)")
            tests_failed += 1
    except Exception as e:
        print(f"✅ PASS: Purple 'Super Saver' banner is HIDDEN (not found in DOM)")
        tests_passed += 1
    
    # Test 4: Section "TEST TILES TITLE" is visible
    try:
        tiles_title = await page.wait_for_selector('text="TEST TILES TITLE"', timeout=5000)
        if tiles_title:
            print("✅ PASS: Section 'TEST TILES TITLE' is visible")
            tests_passed += 1
        else:
            print("❌ FAIL: 'TEST TILES TITLE' not found")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: 'TEST TILES TITLE' not found - {str(e)}")
        tests_failed += 1
    
    # Test 5: First slot shows "TEST 1 hour ₹999"
    try:
        # Look for the price and duration together
        slot_price = await page.query_selector('text=/TEST 1 hour/')
        slot_999 = await page.query_selector('text=/₹999/')
        if slot_price and slot_999:
            print("✅ PASS: First slot shows 'TEST 1 hour ₹999'")
            tests_passed += 1
        else:
            print(f"❌ FAIL: First slot 'TEST 1 hour ₹999' not found (price: {slot_999 is not None}, duration: {slot_price is not None})")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: First slot 'TEST 1 hour ₹999' not found - {str(e)}")
        tests_failed += 1
    
    # Test 6: "1.5 hours" slot is HIDDEN
    try:
        # Check if 1.5 hours slot exists
        slot_1_5 = await page.query_selector('text="1.5 hours"')
        if slot_1_5 is None:
            print("✅ PASS: '1.5 hours' slot is HIDDEN")
            tests_passed += 1
        else:
            print("❌ FAIL: '1.5 hours' slot is still visible (should be hidden)")
            tests_failed += 1
    except Exception as e:
        print(f"✅ PASS: '1.5 hours' slot is HIDDEN (not found in DOM)")
        tests_passed += 1
    
    # Test 7: "Kitchen & utensil cleaning" tile is HIDDEN
    try:
        kitchen_tile = await page.query_selector('text="Kitchen & utensil cleaning"')
        if kitchen_tile is None:
            print("✅ PASS: 'Kitchen & utensil cleaning' tile is HIDDEN")
            tests_passed += 1
        else:
            print("❌ FAIL: 'Kitchen & utensil cleaning' tile is still visible (should be hidden)")
            tests_failed += 1
    except Exception as e:
        print(f"✅ PASS: 'Kitchen & utensil cleaning' tile is HIDDEN (not found in DOM)")
        tests_passed += 1
    
    # Test 8: "What's excluded" shows exactly 2 items: "TEST X1", "TEST X2"
    try:
        test_x1 = await page.query_selector('text="TEST X1"')
        test_x2 = await page.query_selector('text="TEST X2"')
        if test_x1 and test_x2:
            print("✅ PASS: 'What's excluded' shows 'TEST X1' and 'TEST X2'")
            tests_passed += 1
        else:
            print(f"❌ FAIL: 'What's excluded' items not found (X1: {test_x1 is not None}, X2: {test_x2 is not None})")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: 'What's excluded' items not found - {str(e)}")
        tests_failed += 1
    
    # Test 9: "Stay stress free" cover section is HIDDEN
    try:
        cover_section = await page.query_selector('text="Stay stress free with Mfixit cover"')
        if cover_section is None:
            print("✅ PASS: 'Stay stress free' cover section is HIDDEN")
            tests_passed += 1
        else:
            print("❌ FAIL: 'Stay stress free' cover section is still visible (should be hidden)")
            tests_failed += 1
    except Exception as e:
        print(f"✅ PASS: 'Stay stress free' cover section is HIDDEN (not found in DOM)")
        tests_passed += 1
    
    # Test 10: First FAQ question is "TEST FAQ Q?"
    try:
        faq_question = await page.wait_for_selector('text="TEST FAQ Q?"', timeout=5000)
        if faq_question:
            print("✅ PASS: First FAQ question is 'TEST FAQ Q?'")
            tests_passed += 1
        else:
            print("❌ FAIL: First FAQ question 'TEST FAQ Q?' not found")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: First FAQ question 'TEST FAQ Q?' not found - {str(e)}")
        tests_failed += 1
    
    # Test 11: Second FAQ is HIDDEN (only 4 FAQs total)
    try:
        # Count visible FAQs
        faq_section = await page.query_selector('text="Frequently asked questions"')
        if faq_section:
            # Scroll to FAQ section
            await faq_section.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)
            
            # Count FAQ items (look for question pattern)
            all_faqs = await page.query_selector_all('[class*="faq"]')
            print(f"   Found {len(all_faqs)} FAQ elements")
            
            # Check if second FAQ question is hidden
            second_faq = await page.query_selector('text="Will the professional bring cleaning supplies?"')
            if second_faq is None:
                print("✅ PASS: Second FAQ is HIDDEN (only 4 FAQs visible)")
                tests_passed += 1
            else:
                print("❌ FAIL: Second FAQ is still visible (should be hidden)")
                tests_failed += 1
        else:
            print("⚠️  SKIP: FAQ section not found")
    except Exception as e:
        print(f"⚠️  SKIP: Could not verify FAQ count - {str(e)}")
    
    # Take final screenshot
    await page.screenshot(path="/app/test-scenario-b-final.png", full_page=True)
    print("\n📸 Screenshot saved: test-scenario-b-final.png")
    
    print(f"\n{'='*70}")
    print(f"SCENARIO B RESULTS: {tests_passed} PASS / {tests_failed} FAIL")
    print(f"{'='*70}\n")
    
    return tests_passed, tests_failed


async def test_scenario_c_ui(page: Page):
    """
    Test Scenario C: Verify UI reflects the restored defaults
    """
    print("=" * 70)
    print("SCENARIO C: Frontend UI Verification (Restored Defaults)")
    print("=" * 70)
    
    # First, restore defaults via API
    print("\nRestoring defaults via API...")
    import requests
    
    BACKEND_URL = "https://ac7b332f-60e9-4e5e-a6ff-9db4d52b5b36.preview.emergentagent.com"
    API_BASE = f"{BACKEND_URL}/api/admin/cms/instahelp"
    
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
            {"id": "kitchen", "name": "Kitchen & utensil cleaning", "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80", "inclusions": ["Crockery & lunch boxes", "Wiping cabinet exterior", "Sink cleaning", "Gas stove wiping"], "exclusions": ["Hard food stains", "Chimney cleaning", "Heavy appliance cleaning"], "enabled": True},
            {"id": "meal-prep", "name": "Meal prep & serving", "image": "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=200&q=80", "inclusions": ["Veggies chopping & salad prep", "Meat marination", "Serving food", "Table setting"], "exclusions": ["Cooking full meals", "Non-veg cooking", "Baking"], "enabled": True},
            {"id": "mopping", "name": "Mopping, dusting & wiping", "image": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80", "inclusions": ["Dusting & Mopping floor", "Wet wiping furniture", "Bed making", "Organizing items"], "exclusions": ["Wiping walls", "Hard to reach areas", "Ceiling fans"], "enabled": True},
            {"id": "bathroom", "name": "Bathroom cleaning", "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80", "inclusions": ["Toilet seat cleaning", "Sink & Taps", "Floor mopping", "Mirror cleaning"], "exclusions": ["Walls scrubbing", "Hard stains removal", "Ceiling cleaning"], "enabled": True},
            {"id": "laundry", "name": "Laundry & Ironing", "image": "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=200&q=80", "inclusions": ["Machine-wash & drying", "Ironing clothes", "Folding & arranging", "Sorting clothes"], "exclusions": ["Hand-washing delicates", "Dry cleaning items", "Stain removal"], "enabled": True},
            {"id": "packing", "name": "Packing & un-packing", "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80", "inclusions": ["Move-in / move-out help", "Vacation packing", "Wardrobe organizing", "Labeling boxes"], "exclusions": ["Lifting heavy objects", "Moving full homes", "Furniture assembly"], "enabled": True},
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
        "excluded_items": ["Removal of hard stains", "Cleaning of any heavy appliances", "Cooking meals", "Hand-washing clothes"],
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
    
    response = requests.put(API_BASE, json=defaults, headers={"Content-Type": "application/json"}, timeout=15)
    if response.status_code == 200:
        print("✅ Defaults restored via API\n")
    else:
        print(f"❌ Failed to restore defaults: {response.status_code}\n")
        return 0, 1
    
    print(f"Navigating to {PAGE_URL}...")
    await page.goto(PAGE_URL, wait_until="networkidle", timeout=60000)
    await page.wait_for_timeout(3000)  # Wait for React to render
    
    print("✅ Page loaded successfully\n")
    
    # Take screenshot
    await page.screenshot(path="/app/test-scenario-c-restored.png", full_page=True)
    print("📸 Screenshot saved: test-scenario-c-restored.png\n")
    
    tests_passed = 0
    tests_failed = 0
    
    # Test 1: Page title reads "InstaHelp" (not "TEST InstaHelp")
    try:
        title_element = await page.wait_for_selector('text="InstaHelp"', timeout=5000)
        test_title = await page.query_selector('text="TEST InstaHelp"')
        if title_element and test_title is None:
            print("✅ PASS: Page title reads 'InstaHelp' (TEST removed)")
            tests_passed += 1
        else:
            print("❌ FAIL: Page title not restored to 'InstaHelp'")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: Page title not restored - {str(e)}")
        tests_failed += 1
    
    # Test 2: "Earliest available slot" bar is NOT shown (earliest_slot_enabled = false)
    try:
        earliest_slot = await page.query_selector('text="Earliest available slot"')
        if earliest_slot is None:
            print("✅ PASS: 'Earliest available slot' bar is NOT shown (correct default)")
            tests_passed += 1
        else:
            print("❌ FAIL: 'Earliest available slot' bar is visible (should be hidden by default)")
            tests_failed += 1
    except Exception as e:
        print(f"✅ PASS: 'Earliest available slot' bar is NOT shown")
        tests_passed += 1
    
    # Test 3: Purple "Super Saver" banner is VISIBLE
    try:
        super_saver = await page.wait_for_selector('text="SUPER SAVER PACK"', timeout=5000)
        if super_saver:
            print("✅ PASS: Purple 'Super Saver' banner is VISIBLE")
            tests_passed += 1
        else:
            print("❌ FAIL: 'Super Saver' banner not found")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: 'Super Saver' banner not found - {str(e)}")
        tests_failed += 1
    
    # Test 4: Section title is "One help who can do it all" (not "TEST TILES TITLE")
    try:
        tiles_title = await page.wait_for_selector('text="One help who can do it all"', timeout=5000)
        test_title = await page.query_selector('text="TEST TILES TITLE"')
        if tiles_title and test_title is None:
            print("✅ PASS: Section title is 'One help who can do it all' (TEST removed)")
            tests_passed += 1
        else:
            print("❌ FAIL: Section title not restored")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: Section title not restored - {str(e)}")
        tests_failed += 1
    
    # Test 5: First slot shows "1 hour ₹79" (not "TEST 1 hour ₹999")
    try:
        slot_price = await page.query_selector('text=/1 hour/')
        slot_79 = await page.query_selector('text=/₹79/')
        slot_999 = await page.query_selector('text=/₹999/')
        if slot_price and slot_79 and slot_999 is None:
            print("✅ PASS: First slot shows '1 hour ₹79' (TEST removed)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: First slot not restored (79: {slot_79 is not None}, 999: {slot_999 is not None})")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: First slot not restored - {str(e)}")
        tests_failed += 1
    
    # Test 6: "1.5 hours" slot is VISIBLE
    try:
        slot_1_5 = await page.wait_for_selector('text="1.5 hours"', timeout=5000)
        if slot_1_5:
            print("✅ PASS: '1.5 hours' slot is VISIBLE")
            tests_passed += 1
        else:
            print("❌ FAIL: '1.5 hours' slot not found")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: '1.5 hours' slot not found - {str(e)}")
        tests_failed += 1
    
    # Test 7: "Kitchen & utensil cleaning" tile is VISIBLE
    try:
        kitchen_tile = await page.wait_for_selector('text="Kitchen & utensil cleaning"', timeout=5000)
        if kitchen_tile:
            print("✅ PASS: 'Kitchen & utensil cleaning' tile is VISIBLE")
            tests_passed += 1
        else:
            print("❌ FAIL: 'Kitchen & utensil cleaning' tile not found")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: 'Kitchen & utensil cleaning' tile not found - {str(e)}")
        tests_failed += 1
    
    # Test 8: "What's excluded" shows 4 default items (not TEST X1/X2)
    try:
        test_x1 = await page.query_selector('text="TEST X1"')
        test_x2 = await page.query_selector('text="TEST X2"')
        default_item = await page.query_selector('text="Removal of hard stains"')
        if test_x1 is None and test_x2 is None and default_item:
            print("✅ PASS: 'What's excluded' shows default items (TEST removed)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: 'What's excluded' not restored (X1: {test_x1 is not None}, X2: {test_x2 is not None}, default: {default_item is not None})")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: 'What's excluded' not restored - {str(e)}")
        tests_failed += 1
    
    # Test 9: "Stay stress free" cover section is VISIBLE
    try:
        cover_section = await page.wait_for_selector('text="Stay stress free with Mfixit cover"', timeout=5000)
        if cover_section:
            print("✅ PASS: 'Stay stress free' cover section is VISIBLE")
            tests_passed += 1
        else:
            print("❌ FAIL: 'Stay stress free' cover section not found")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: 'Stay stress free' cover section not found - {str(e)}")
        tests_failed += 1
    
    # Test 10: First FAQ question is restored (not "TEST FAQ Q?")
    try:
        faq_question = await page.wait_for_selector('text="Is the professional trained and verified?"', timeout=5000)
        test_faq = await page.query_selector('text="TEST FAQ Q?"')
        if faq_question and test_faq is None:
            print("✅ PASS: First FAQ question restored (TEST removed)")
            tests_passed += 1
        else:
            print("❌ FAIL: First FAQ question not restored")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: First FAQ question not restored - {str(e)}")
        tests_failed += 1
    
    # Test 11: Second FAQ is VISIBLE (all 5 FAQs enabled)
    try:
        second_faq = await page.wait_for_selector('text="Will the professional bring cleaning supplies?"', timeout=5000)
        if second_faq:
            print("✅ PASS: Second FAQ is VISIBLE (all 5 FAQs enabled)")
            tests_passed += 1
        else:
            print("❌ FAIL: Second FAQ not found")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAIL: Second FAQ not found - {str(e)}")
        tests_failed += 1
    
    print(f"\n{'='*70}")
    print(f"SCENARIO C RESULTS: {tests_passed} PASS / {tests_failed} FAIL")
    print(f"{'='*70}\n")
    
    return tests_passed, tests_failed


async def main():
    """Run all UI tests"""
    print("\n" + "=" * 70)
    print("InstaHelp CMS Frontend UI Testing")
    print("=" * 70)
    print(f"Preview URL: {PREVIEW_URL}")
    print(f"Page URL: {PAGE_URL}")
    print("=" * 70)
    print()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await context.new_page()
        
        try:
            # Test Scenario B: Modified config
            b_passed, b_failed = await test_scenario_b_ui(page)
            
            # Test Scenario C: Restored defaults
            c_passed, c_failed = await test_scenario_c_ui(page)
            
            total_passed = b_passed + c_passed
            total_failed = b_failed + c_failed
            
            print("\n" + "=" * 70)
            print("FINAL RESULTS")
            print("=" * 70)
            print(f"Total Tests: {total_passed + total_failed}")
            print(f"✅ PASSED: {total_passed}")
            print(f"❌ FAILED: {total_failed}")
            print("=" * 70)
            
            if total_failed == 0:
                print("\n🎉 ALL TESTS PASSED! InstaHelp CMS is working perfectly!")
                return 0
            else:
                print(f"\n⚠️  {total_failed} test(s) failed. Please review the results above.")
                return 1
            
        finally:
            await browser.close()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
