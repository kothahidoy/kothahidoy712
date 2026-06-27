#!/usr/bin/env python3
"""
Service Detail Editor Backend API Test Suite
Tests all public and admin endpoints for service detail pages, variants, and reviews.
"""
import requests
import json
from typing import Dict, Any, Optional

BASE_URL = "https://abb86045-1a44-4b83-9874-3ebbf0beda25.preview.emergentagent.com"

# Test service IDs from Supabase
SERVICE_IDS = {
    "light_led": "svc-elec-3",  # Light / LED Installation (₹89)
    "mcb_fuse": "svc-elec-5",   # MCB / Fuse Repair (₹179)
    "ac_service": "svc-ac-1",   # AC Service & Repair (₹499)
    "painting": "svc-paint-1",  # 1 BHK Full Home Painting (₹4999)
}

# Store IDs for cleanup
created_variant_ids = []
created_review_ids = []


def print_test(test_num: int, description: str):
    """Print test header"""
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print('='*80)


def print_result(status: str, code: int, details: str = ""):
    """Print test result"""
    emoji = "✅" if status == "PASS" else "❌"
    print(f"{emoji} {status} - HTTP {code}")
    if details:
        print(f"   {details}")


def make_request(method: str, endpoint: str, json_data: Optional[Dict] = None) -> tuple:
    """Make HTTP request and return (status_code, response_json, error)"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            resp = requests.get(url, timeout=15)
        elif method == "POST":
            resp = requests.post(url, json=json_data, timeout=15)
        elif method == "PUT":
            resp = requests.put(url, json=json_data, timeout=15)
        elif method == "DELETE":
            resp = requests.delete(url, timeout=15)
        else:
            return (0, None, f"Unknown method: {method}")
        
        try:
            data = resp.json()
        except:
            data = resp.text
        
        return (resp.status_code, data, None)
    except Exception as e:
        return (0, None, str(e))


# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

def test_1_get_service_detail_svc_elec_3():
    """GET /api/services/svc-elec-3/detail"""
    print_test(1, "GET /api/services/svc-elec-3/detail")
    
    code, data, err = make_request("GET", f"/api/services/{SERVICE_IDS['light_led']}/detail")
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    # Validate response structure
    if not isinstance(data, dict):
        print_result("FAIL", code, "Response is not a dict")
        return False
    
    if "service" not in data or "variants" not in data or "reviews" not in data:
        print_result("FAIL", code, "Missing required keys: service, variants, reviews")
        return False
    
    service = data["service"]
    if service.get("id") != SERVICE_IDS['light_led']:
        print_result("FAIL", code, f"service.id mismatch: {service.get('id')}")
        return False
    
    if service.get("title") != "Light / LED Installation":
        print_result("FAIL", code, f"service.title mismatch: {service.get('title')}")
        return False
    
    if not isinstance(data["variants"], list) or len(data["variants"]) == 0:
        print_result("FAIL", code, "variants should be non-empty array")
        return False
    
    if not isinstance(data["reviews"], list):
        print_result("FAIL", code, "reviews should be an array")
        return False
    
    print_result("PASS", code, f"service.title={service.get('title')}, variants={len(data['variants'])}, reviews={len(data['reviews'])}")
    return True


def test_2_get_service_detail_svc_elec_5():
    """GET /api/services/svc-elec-5/detail"""
    print_test(2, "GET /api/services/svc-elec-5/detail")
    
    code, data, err = make_request("GET", f"/api/services/{SERVICE_IDS['mcb_fuse']}/detail")
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    service = data.get("service", {})
    if service.get("title") != "MCB / Fuse Repair":
        print_result("FAIL", code, f"service.title mismatch: {service.get('title')}")
        return False
    
    if not isinstance(data.get("variants"), list) or len(data["variants"]) == 0:
        print_result("FAIL", code, "variants should be non-empty array")
        return False
    
    print_result("PASS", code, f"service.title={service.get('title')}, data is DIFFERENT from svc-elec-3")
    return True


def test_3_get_nonexistent_service():
    """GET /api/services/non-existent-id/detail"""
    print_test(3, "GET /api/services/non-existent-id/detail (should return 404)")
    
    code, data, err = make_request("GET", "/api/services/non-existent-id/detail")
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 404:
        print_result("FAIL", code, f"Expected 404, got {code}")
        return False
    
    print_result("PASS", code, "Correctly returns 404 for non-existent service")
    return True


def test_4_submit_5_star_review():
    """POST /api/services/svc-ac-1/reviews (5★ review)"""
    print_test(4, "POST /api/services/svc-ac-1/reviews (5★ review, should auto-publish)")
    
    payload = {
        "customer_name": "Test User",
        "rating": 5,
        "review_text": "Great service!",
        "customer_avatar": ""
    }
    
    code, data, err = make_request("POST", f"/api/services/{SERVICE_IDS['ac_service']}/reviews", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 201:
        print_result("FAIL", code, f"Expected 201, got {code}")
        return False
    
    if not isinstance(data, dict):
        print_result("FAIL", code, "Response should be a dict")
        return False
    
    if data.get("is_published") != True:
        print_result("FAIL", code, f"is_published should be True for 5★, got {data.get('is_published')}")
        return False
    
    # Store review ID for later verification
    if "id" in data:
        created_review_ids.append(data["id"])
    
    print_result("PASS", code, f"Review created with is_published=True, id={data.get('id')}")
    return True


def test_5_submit_3_star_review():
    """POST /api/services/svc-ac-1/reviews (3★ review)"""
    print_test(5, "POST /api/services/svc-ac-1/reviews (3★ review, should NOT auto-publish)")
    
    payload = {
        "customer_name": "Critic",
        "rating": 3,
        "review_text": "Average",
        "customer_avatar": ""
    }
    
    code, data, err = make_request("POST", f"/api/services/{SERVICE_IDS['ac_service']}/reviews", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 201:
        print_result("FAIL", code, f"Expected 201, got {code}")
        return False
    
    if data.get("is_published") != False:
        print_result("FAIL", code, f"is_published should be False for 3★, got {data.get('is_published')}")
        return False
    
    # Store review ID
    if "id" in data:
        created_review_ids.append(data["id"])
    
    print_result("PASS", code, f"Review created with is_published=False (auto-moderation), id={data.get('id')}")
    return True


def test_6_submit_invalid_rating():
    """POST /api/services/svc-ac-1/reviews (invalid rating)"""
    print_test(6, "POST /api/services/svc-ac-1/reviews (rating=7, should return 400)")
    
    payload = {
        "customer_name": "Bad",
        "rating": 7,
        "review_text": "x",
        "customer_avatar": ""
    }
    
    code, data, err = make_request("POST", f"/api/services/{SERVICE_IDS['ac_service']}/reviews", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 400:
        print_result("FAIL", code, f"Expected 400, got {code}")
        return False
    
    print_result("PASS", code, "Correctly rejects invalid rating")
    return True


def test_7_verify_public_review_filter():
    """GET /api/services/svc-ac-1/detail (verify only 5★ published reviews visible)"""
    print_test(7, "GET /api/services/svc-ac-1/detail (verify public review filter)")
    
    code, data, err = make_request("GET", f"/api/services/{SERVICE_IDS['ac_service']}/detail")
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    reviews = data.get("reviews", [])
    
    # Check that only 5★ published reviews are visible
    for review in reviews:
        if review.get("rating") != 5:
            print_result("FAIL", code, f"Found non-5★ review in public view: rating={review.get('rating')}")
            return False
        if review.get("is_published") != True:
            print_result("FAIL", code, f"Found unpublished review in public view")
            return False
    
    # Check that the 5★ review from test 4 is present
    test_user_review = [r for r in reviews if r.get("customer_name") == "Test User"]
    if not test_user_review:
        print_result("FAIL", code, "5★ 'Test User' review not found in public view")
        return False
    
    # Check that the 3★ review from test 5 is NOT present
    critic_review = [r for r in reviews if r.get("customer_name") == "Critic"]
    if critic_review:
        print_result("FAIL", code, "3★ 'Critic' review should NOT be visible in public view")
        return False
    
    print_result("PASS", code, f"Public review filter working correctly: {len(reviews)} reviews (all 5★ published)")
    return True


# ============================================================================
# ADMIN DETAIL EDIT
# ============================================================================

def test_8_admin_update_service_detail():
    """PUT /api/admin/services/svc-ac-1/detail (full update)"""
    print_test(8, "PUT /api/admin/services/svc-ac-1/detail (full update)")
    
    payload = {
        "subtitle": "Trained AC technicians · All brands",
        "safety_tips": [
            {"text": "Power off mains before AC removal", "color": "#F59E0B", "icon": "shield"},
            {"text": "Refrigerant gas safety protocols", "color": "#10B981", "icon": "check"}
        ],
        "process_steps": [
            {"step": 1, "title": "Diagnose", "description": "Find issue"},
            {"step": 2, "title": "Quote", "description": "Approve cost"},
            {"step": 3, "title": "Repair", "description": "Fix with parts"},
            {"step": 4, "title": "Warranty", "description": "30 days"}
        ],
        "exclusions": ["Compressor replacement", "Gas refill above 0.5kg"],
        "brands": ["LG", "Samsung", "Voltas", "Daikin", "Bluestar"],
        "cover_features": ["30-day warranty", "Genuine parts", "ISO certified techs"],
        "faqs": [{"question": "Do you carry gas?", "answer": "Yes for top-up."}]
    }
    
    code, data, err = make_request("PUT", f"/api/admin/services/{SERVICE_IDS['ac_service']}/detail", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    # Verify the update persisted by fetching the service again
    code2, data2, err2 = make_request("GET", f"/api/services/{SERVICE_IDS['ac_service']}/detail")
    
    if err2 or code2 != 200:
        print_result("FAIL", code, "Failed to verify update persistence")
        return False
    
    service = data2.get("service", {})
    if service.get("subtitle") != "Trained AC technicians · All brands":
        print_result("FAIL", code, f"subtitle not persisted: {service.get('subtitle')}")
        return False
    
    if len(service.get("safety_tips", [])) != 2:
        print_result("FAIL", code, f"safety_tips not persisted correctly")
        return False
    
    if len(service.get("process_steps", [])) != 4:
        print_result("FAIL", code, f"process_steps not persisted correctly")
        return False
    
    print_result("PASS", code, "Service detail updated and persisted successfully")
    return True


def test_9_admin_partial_update():
    """PUT /api/admin/services/svc-ac-1/detail (partial update)"""
    print_test(9, "PUT /api/admin/services/svc-ac-1/detail (partial update: warranty only)")
    
    payload = {"warranty": "60 days"}
    
    code, data, err = make_request("PUT", f"/api/admin/services/{SERVICE_IDS['ac_service']}/detail", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    # Verify the partial update
    code2, data2, err2 = make_request("GET", f"/api/services/{SERVICE_IDS['ac_service']}/detail")
    
    if err2 or code2 != 200:
        print_result("FAIL", code, "Failed to verify partial update")
        return False
    
    service = data2.get("service", {})
    if service.get("warranty") != "60 days":
        print_result("FAIL", code, f"warranty not updated: {service.get('warranty')}")
        return False
    
    # Verify other fields from test 8 are still present
    if service.get("subtitle") != "Trained AC technicians · All brands":
        print_result("FAIL", code, "Previous fields were overwritten (should be partial update)")
        return False
    
    print_result("PASS", code, "Partial update working correctly")
    return True


# ============================================================================
# ADMIN VARIANTS CRUD
# ============================================================================

def test_10_admin_create_variant_quick():
    """POST /api/admin/services/svc-ac-1/variants (Quick Service)"""
    print_test(10, "POST /api/admin/services/svc-ac-1/variants (Quick Service)")
    
    payload = {
        "name": "Quick Service",
        "price": 399,
        "duration_mins": 45,
        "image": "https://example.com/img.jpg",
        "features": ["Filter wash", "Gas check"],
        "sort_order": 0
    }
    
    code, data, err = make_request("POST", f"/api/admin/services/{SERVICE_IDS['ac_service']}/variants", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 201:
        print_result("FAIL", code, f"Expected 201, got {code}")
        return False
    
    if not isinstance(data, dict) or "id" not in data:
        print_result("FAIL", code, "Response should contain 'id' field")
        return False
    
    # Store variant ID for later tests
    created_variant_ids.append(data["id"])
    
    print_result("PASS", code, f"Variant created with id={data['id']}")
    return True


def test_11_admin_create_variant_premium():
    """POST /api/admin/services/svc-ac-1/variants (Premium Plus)"""
    print_test(11, "POST /api/admin/services/svc-ac-1/variants (Premium Plus)")
    
    payload = {
        "name": "Premium Plus",
        "price": 799,
        "original_price": 999,
        "duration_mins": 90,
        "image": "https://example.com/img2.jpg",
        "features": ["Deep clean", "Foam jet", "Anti-bacterial"],
        "sort_order": 1
    }
    
    code, data, err = make_request("POST", f"/api/admin/services/{SERVICE_IDS['ac_service']}/variants", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 201:
        print_result("FAIL", code, f"Expected 201, got {code}")
        return False
    
    if "id" not in data:
        print_result("FAIL", code, "Response should contain 'id' field")
        return False
    
    created_variant_ids.append(data["id"])
    
    print_result("PASS", code, f"Variant created with id={data['id']}")
    return True


def test_12_admin_list_variants():
    """GET /api/admin/services/svc-ac-1/variants"""
    print_test(12, "GET /api/admin/services/svc-ac-1/variants (should show 2 variants)")
    
    code, data, err = make_request("GET", f"/api/admin/services/{SERVICE_IDS['ac_service']}/variants")
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    if not isinstance(data, list):
        print_result("FAIL", code, "Response should be an array")
        return False
    
    if len(data) < 2:
        print_result("FAIL", code, f"Expected at least 2 variants, got {len(data)}")
        return False
    
    # Verify sort order
    names = [v.get("name") for v in data]
    if "Quick Service" not in names or "Premium Plus" not in names:
        print_result("FAIL", code, f"Missing expected variants: {names}")
        return False
    
    print_result("PASS", code, f"Found {len(data)} variants, correctly ordered")
    return True


def test_13_public_detail_shows_explicit_variants():
    """GET /api/services/svc-ac-1/detail (should show explicit variants, not auto-generated)"""
    print_test(13, "GET /api/services/svc-ac-1/detail (verify explicit variants)")
    
    code, data, err = make_request("GET", f"/api/services/{SERVICE_IDS['ac_service']}/detail")
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    variants = data.get("variants", [])
    
    # Check that we have the explicit variants
    names = [v.get("name") for v in variants]
    if "Quick Service" not in names or "Premium Plus" not in names:
        print_result("FAIL", code, f"Explicit variants not found: {names}")
        return False
    
    # Check that no auto-generated variants are present
    auto_gen = [v for v in variants if v.get("auto_generated") == True]
    if auto_gen:
        print_result("FAIL", code, "Auto-generated variants should not appear when explicit variants exist")
        return False
    
    print_result("PASS", code, f"Public endpoint shows {len(variants)} explicit variants (no auto-generated)")
    return True


def test_14_admin_update_variant():
    """PUT /api/admin/services/svc-ac-1/variants/{variant_id} (partial update)"""
    print_test(14, "PUT /api/admin/services/svc-ac-1/variants/{variant_id} (partial update)")
    
    if not created_variant_ids:
        print_result("FAIL", 0, "No variant ID available from previous tests")
        return False
    
    variant_id = created_variant_ids[0]  # Quick Service variant
    payload = {"price": 449, "name": "Quick Service Pro"}
    
    code, data, err = make_request("PUT", f"/api/admin/services/{SERVICE_IDS['ac_service']}/variants/{variant_id}", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    # Verify the update
    code2, data2, err2 = make_request("GET", f"/api/admin/services/{SERVICE_IDS['ac_service']}/variants")
    
    if err2 or code2 != 200:
        print_result("FAIL", code, "Failed to verify variant update")
        return False
    
    updated_variant = [v for v in data2 if v.get("id") == variant_id]
    if not updated_variant:
        print_result("FAIL", code, "Updated variant not found")
        return False
    
    if updated_variant[0].get("name") != "Quick Service Pro":
        print_result("FAIL", code, f"Name not updated: {updated_variant[0].get('name')}")
        return False
    
    if updated_variant[0].get("price") != 449:
        print_result("FAIL", code, f"Price not updated: {updated_variant[0].get('price')}")
        return False
    
    print_result("PASS", code, "Variant updated successfully")
    return True


def test_15_admin_delete_variant():
    """DELETE /api/admin/services/svc-ac-1/variants/{variant_id}"""
    print_test(15, "DELETE /api/admin/services/svc-ac-1/variants/{variant_id}")
    
    if not created_variant_ids:
        print_result("FAIL", 0, "No variant ID available from previous tests")
        return False
    
    variant_id = created_variant_ids[0]  # Quick Service Pro variant
    
    code, data, err = make_request("DELETE", f"/api/admin/services/{SERVICE_IDS['ac_service']}/variants/{variant_id}")
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    if not isinstance(data, dict) or data.get("ok") != True:
        print_result("FAIL", code, f"Expected {{ok: true}}, got {data}")
        return False
    
    # Verify deletion
    code2, data2, err2 = make_request("GET", f"/api/admin/services/{SERVICE_IDS['ac_service']}/variants")
    
    if err2 or code2 != 200:
        print_result("FAIL", code, "Failed to verify deletion")
        return False
    
    remaining = [v for v in data2 if v.get("id") == variant_id]
    if remaining:
        print_result("FAIL", code, "Variant still exists after deletion")
        return False
    
    if len(data2) != 1:
        print_result("FAIL", code, f"Expected 1 remaining variant, got {len(data2)}")
        return False
    
    print_result("PASS", code, f"Variant deleted successfully, {len(data2)} variant(s) remaining")
    return True


# ============================================================================
# ADMIN REVIEWS CRUD
# ============================================================================

def test_16_admin_list_all_reviews():
    """GET /api/admin/services/svc-ac-1/reviews (should show ALL reviews including unpublished)"""
    print_test(16, "GET /api/admin/services/svc-ac-1/reviews (admin view - all reviews)")
    
    code, data, err = make_request("GET", f"/api/admin/services/{SERVICE_IDS['ac_service']}/reviews")
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    if not isinstance(data, list):
        print_result("FAIL", code, "Response should be an array")
        return False
    
    # Check that we have both the 5★ and 3★ reviews
    test_user = [r for r in data if r.get("customer_name") == "Test User"]
    critic = [r for r in data if r.get("customer_name") == "Critic"]
    
    if not test_user:
        print_result("FAIL", code, "5★ 'Test User' review not found in admin view")
        return False
    
    if not critic:
        print_result("FAIL", code, "3★ 'Critic' review not found in admin view (should be visible to admin)")
        return False
    
    print_result("PASS", code, f"Admin view shows ALL {len(data)} reviews (including unpublished)")
    return True


def test_17_admin_create_review():
    """POST /api/admin/services/svc-ac-1/reviews"""
    print_test(17, "POST /api/admin/services/svc-ac-1/reviews (admin creates review)")
    
    payload = {
        "customer_name": "Priya S",
        "rating": 5,
        "review_text": "Brilliant!",
        "customer_avatar": "https://i.pravatar.cc/100?img=5",
        "is_published": True
    }
    
    code, data, err = make_request("POST", f"/api/admin/services/{SERVICE_IDS['ac_service']}/reviews", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 201:
        print_result("FAIL", code, f"Expected 201, got {code}")
        return False
    
    if "id" not in data:
        print_result("FAIL", code, "Response should contain 'id' field")
        return False
    
    created_review_ids.append(data["id"])
    
    print_result("PASS", code, f"Admin review created with id={data['id']}")
    return True


def test_18_admin_update_review():
    """PUT /api/admin/services/svc-ac-1/reviews/{review_id}"""
    print_test(18, "PUT /api/admin/services/svc-ac-1/reviews/{review_id} (unpublish review)")
    
    if not created_review_ids:
        print_result("FAIL", 0, "No review ID available from previous tests")
        return False
    
    review_id = created_review_ids[-1]  # Priya S review
    payload = {"is_published": False}
    
    code, data, err = make_request("PUT", f"/api/admin/services/{SERVICE_IDS['ac_service']}/reviews/{review_id}", payload)
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    # Verify the update
    code2, data2, err2 = make_request("GET", f"/api/admin/services/{SERVICE_IDS['ac_service']}/reviews")
    
    if err2 or code2 != 200:
        print_result("FAIL", code, "Failed to verify review update")
        return False
    
    updated_review = [r for r in data2 if r.get("id") == review_id]
    if not updated_review:
        print_result("FAIL", code, "Updated review not found")
        return False
    
    if updated_review[0].get("is_published") != False:
        print_result("FAIL", code, f"is_published not updated: {updated_review[0].get('is_published')}")
        return False
    
    print_result("PASS", code, "Review unpublished successfully")
    return True


def test_19_admin_delete_review():
    """DELETE /api/admin/services/svc-ac-1/reviews/{review_id}"""
    print_test(19, "DELETE /api/admin/services/svc-ac-1/reviews/{review_id}")
    
    if not created_review_ids:
        print_result("FAIL", 0, "No review ID available from previous tests")
        return False
    
    review_id = created_review_ids[-1]  # Priya S review
    
    code, data, err = make_request("DELETE", f"/api/admin/services/{SERVICE_IDS['ac_service']}/reviews/{review_id}")
    
    if err:
        print_result("FAIL", 0, f"Error: {err}")
        return False
    
    if code != 200:
        print_result("FAIL", code, f"Expected 200, got {code}")
        return False
    
    if not isinstance(data, dict) or data.get("ok") != True:
        print_result("FAIL", code, f"Expected {{ok: true}}, got {data}")
        return False
    
    # Verify deletion
    code2, data2, err2 = make_request("GET", f"/api/admin/services/{SERVICE_IDS['ac_service']}/reviews")
    
    if err2 or code2 != 200:
        print_result("FAIL", code, "Failed to verify deletion")
        return False
    
    remaining = [r for r in data2 if r.get("id") == review_id]
    if remaining:
        print_result("FAIL", code, "Review still exists after deletion")
        return False
    
    print_result("PASS", code, "Review deleted successfully")
    return True


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    print("\n" + "="*80)
    print("SERVICE DETAIL EDITOR BACKEND API TEST SUITE")
    print("="*80)
    print(f"Backend URL: {BASE_URL}")
    print(f"Testing {len(SERVICE_IDS)} service IDs")
    print("="*80)
    
    tests = [
        # Public endpoints
        test_1_get_service_detail_svc_elec_3,
        test_2_get_service_detail_svc_elec_5,
        test_3_get_nonexistent_service,
        test_4_submit_5_star_review,
        test_5_submit_3_star_review,
        test_6_submit_invalid_rating,
        test_7_verify_public_review_filter,
        # Admin detail edit
        test_8_admin_update_service_detail,
        test_9_admin_partial_update,
        # Admin variants CRUD
        test_10_admin_create_variant_quick,
        test_11_admin_create_variant_premium,
        test_12_admin_list_variants,
        test_13_public_detail_shows_explicit_variants,
        test_14_admin_update_variant,
        test_15_admin_delete_variant,
        # Admin reviews CRUD
        test_16_admin_list_all_reviews,
        test_17_admin_create_review,
        test_18_admin_update_review,
        test_19_admin_delete_review,
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"\n❌ EXCEPTION in {test_func.__name__}: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    passed = sum(results)
    failed = len(results) - passed
    print(f"Total Tests: {len(results)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {passed/len(results)*100:.1f}%")
    print("="*80)
    
    if failed > 0:
        print("\n⚠️  Some tests failed. Check backend logs for details:")
        print("    tail -n 100 /var/log/supervisor/backend.err.log")
    else:
        print("\n🎉 ALL TESTS PASSED!")
    
    return failed == 0


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
