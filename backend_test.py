"""
Backend API Testing for Admin Panel
Tests all CRUD operations for Services, Slots, Bookings, Offers, and Categories
"""
import requests
import json
from datetime import datetime, timedelta

# Backend URL from frontend/.env
BACKEND_URL = "https://code-hub-163.preview.emergentagent.com/api"

# Test results storage
test_results = {
    "services": {"get": None, "post": None, "patch": None, "delete": None},
    "slots": {"get": None, "post": None, "patch": None, "delete": None},
    "bookings": {"get": None, "patch": None},
    "offers": {"get": None, "post": None, "patch": None, "delete": None},
    "categories": {"get": None}
}

# Store created IDs for cleanup
created_ids = {
    "service_id": None,
    "slot_id": None,
    "offer_id": None
}

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"Testing: {test_name}")
    print(f"{'='*80}")

def print_result(endpoint, method, status_code, response_data, success=True):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} | {method} {endpoint} | Status: {status_code}")
    if not success or status_code >= 400:
        print(f"Response: {json.dumps(response_data, indent=2)}")
    elif isinstance(response_data, list):
        print(f"Response: {len(response_data)} items returned")
    else:
        print(f"Response: {json.dumps(response_data, indent=2)[:200]}...")

# ==================== SERVICES TESTS ====================

def test_get_services():
    """Test GET /api/admin/services"""
    print_test_header("GET /api/admin/services - List all services")
    try:
        response = requests.get(f"{BACKEND_URL}/admin/services", timeout=10)
        data = response.json() if response.status_code == 200 else response.text
        
        success = response.status_code == 200
        test_results["services"]["get"] = success
        print_result("/admin/services", "GET", response.status_code, data, success)
        
        return data if success else []
    except Exception as e:
        print(f"❌ FAIL | GET /admin/services | Error: {str(e)}")
        test_results["services"]["get"] = False
        return []

def test_create_service():
    """Test POST /api/admin/services"""
    print_test_header("POST /api/admin/services - Create new service")
    
    payload = {
        "name": "Test Electrical Service",
        "price": 599.99,
        "description": "Test service for electrical work",
        "offer": "10% off on first booking",
        "image": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/admin/services",
            json=payload,
            timeout=10
        )
        data = response.json() if response.status_code in [200, 201] else response.text
        
        success = response.status_code in [200, 201]
        test_results["services"]["post"] = success
        
        if success and isinstance(data, dict) and "id" in data:
            created_ids["service_id"] = data["id"]
            print_result("/admin/services", "POST", response.status_code, data, success)
        else:
            print_result("/admin/services", "POST", response.status_code, data, False)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | POST /admin/services | Error: {str(e)}")
        test_results["services"]["post"] = False
        return None

def test_update_service(service_id):
    """Test PATCH /api/admin/services/{id}"""
    print_test_header(f"PATCH /api/admin/services/{service_id} - Update service")
    
    if not service_id:
        print("⚠️ SKIP | No service_id available for update test")
        test_results["services"]["patch"] = None
        return None
    
    payload = {
        "price": 699.99,
        "is_active": False
    }
    
    try:
        response = requests.patch(
            f"{BACKEND_URL}/admin/services/{service_id}",
            json=payload,
            timeout=10
        )
        data = response.json() if response.status_code in [200, 204] else response.text
        
        success = response.status_code in [200, 204]
        test_results["services"]["patch"] = success
        print_result(f"/admin/services/{service_id}", "PATCH", response.status_code, data, success)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | PATCH /admin/services/{service_id} | Error: {str(e)}")
        test_results["services"]["patch"] = False
        return None

def test_delete_service(service_id):
    """Test DELETE /api/admin/services/{id}"""
    print_test_header(f"DELETE /api/admin/services/{service_id} - Delete service")
    
    if not service_id:
        print("⚠️ SKIP | No service_id available for delete test")
        test_results["services"]["delete"] = None
        return None
    
    try:
        response = requests.delete(
            f"{BACKEND_URL}/admin/services/{service_id}",
            timeout=10
        )
        data = response.json() if response.status_code in [200, 204] else response.text
        
        success = response.status_code in [200, 204]
        test_results["services"]["delete"] = success
        print_result(f"/admin/services/{service_id}", "DELETE", response.status_code, data, success)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | DELETE /admin/services/{service_id} | Error: {str(e)}")
        test_results["services"]["delete"] = False
        return None

# ==================== SLOTS TESTS ====================

def test_get_slots():
    """Test GET /api/admin/slots"""
    print_test_header("GET /api/admin/slots - List all slots")
    try:
        response = requests.get(f"{BACKEND_URL}/admin/slots", timeout=10)
        data = response.json() if response.status_code == 200 else response.text
        
        success = response.status_code == 200
        test_results["slots"]["get"] = success
        print_result("/admin/slots", "GET", response.status_code, data, success)
        
        return data if success else []
    except Exception as e:
        print(f"❌ FAIL | GET /admin/slots | Error: {str(e)}")
        test_results["slots"]["get"] = False
        return []

def test_create_slot():
    """Test POST /api/admin/slots"""
    print_test_header("POST /api/admin/slots - Create new slot")
    
    # Create slot for tomorrow
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    payload = {
        "date": tomorrow,
        "time": "10:00 AM",
        "available": True
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/admin/slots",
            json=payload,
            timeout=10
        )
        data = response.json() if response.status_code in [200, 201] else response.text
        
        success = response.status_code in [200, 201]
        test_results["slots"]["post"] = success
        
        if success and isinstance(data, dict) and "id" in data:
            created_ids["slot_id"] = data["id"]
            print_result("/admin/slots", "POST", response.status_code, data, success)
        else:
            print_result("/admin/slots", "POST", response.status_code, data, False)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | POST /admin/slots | Error: {str(e)}")
        test_results["slots"]["post"] = False
        return None

def test_update_slot(slot_id):
    """Test PATCH /api/admin/slots/{id}"""
    print_test_header(f"PATCH /api/admin/slots/{slot_id} - Update slot availability")
    
    if not slot_id:
        print("⚠️ SKIP | No slot_id available for update test")
        test_results["slots"]["patch"] = None
        return None
    
    payload = {
        "available": False
    }
    
    try:
        response = requests.patch(
            f"{BACKEND_URL}/admin/slots/{slot_id}",
            json=payload,
            timeout=10
        )
        data = response.json() if response.status_code in [200, 204] else response.text
        
        success = response.status_code in [200, 204]
        test_results["slots"]["patch"] = success
        print_result(f"/admin/slots/{slot_id}", "PATCH", response.status_code, data, success)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | PATCH /admin/slots/{slot_id} | Error: {str(e)}")
        test_results["slots"]["patch"] = False
        return None

def test_delete_slot(slot_id):
    """Test DELETE /api/admin/slots/{id}"""
    print_test_header(f"DELETE /api/admin/slots/{slot_id} - Delete slot")
    
    if not slot_id:
        print("⚠️ SKIP | No slot_id available for delete test")
        test_results["slots"]["delete"] = None
        return None
    
    try:
        response = requests.delete(
            f"{BACKEND_URL}/admin/slots/{slot_id}",
            timeout=10
        )
        data = response.json() if response.status_code in [200, 204] else response.text
        
        success = response.status_code in [200, 204]
        test_results["slots"]["delete"] = success
        print_result(f"/admin/slots/{slot_id}", "DELETE", response.status_code, data, success)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | DELETE /admin/slots/{slot_id} | Error: {str(e)}")
        test_results["slots"]["delete"] = False
        return None

# ==================== BOOKINGS TESTS ====================

def test_get_bookings():
    """Test GET /api/admin/bookings"""
    print_test_header("GET /api/admin/bookings - List all bookings")
    try:
        response = requests.get(f"{BACKEND_URL}/admin/bookings", timeout=10)
        data = response.json() if response.status_code == 200 else response.text
        
        success = response.status_code == 200
        test_results["bookings"]["get"] = success
        print_result("/admin/bookings", "GET", response.status_code, data, success)
        
        return data if success else []
    except Exception as e:
        print(f"❌ FAIL | GET /admin/bookings | Error: {str(e)}")
        test_results["bookings"]["get"] = False
        return []

def test_update_booking_status(bookings):
    """Test PATCH /api/admin/bookings/{id}/status"""
    
    if not bookings or len(bookings) == 0:
        print_test_header("PATCH /api/admin/bookings/{id}/status - Update booking status")
        print("⚠️ SKIP | No bookings available for status update test")
        test_results["bookings"]["patch"] = None
        return None
    
    booking_id = bookings[0].get("id")
    print_test_header(f"PATCH /api/admin/bookings/{booking_id}/status - Update booking status")
    
    payload = {
        "status": "confirmed"
    }
    
    try:
        response = requests.patch(
            f"{BACKEND_URL}/admin/bookings/{booking_id}/status",
            json=payload,
            timeout=10
        )
        data = response.json() if response.status_code in [200, 204] else response.text
        
        success = response.status_code in [200, 204]
        test_results["bookings"]["patch"] = success
        print_result(f"/admin/bookings/{booking_id}/status", "PATCH", response.status_code, data, success)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | PATCH /admin/bookings/{booking_id}/status | Error: {str(e)}")
        test_results["bookings"]["patch"] = False
        return None

# ==================== OFFERS TESTS ====================

def test_get_offers():
    """Test GET /api/admin/offers"""
    print_test_header("GET /api/admin/offers - List all offers")
    try:
        response = requests.get(f"{BACKEND_URL}/admin/offers", timeout=10)
        data = response.json() if response.status_code == 200 else response.text
        
        success = response.status_code == 200
        test_results["offers"]["get"] = success
        print_result("/admin/offers", "GET", response.status_code, data, success)
        
        return data if success else []
    except Exception as e:
        print(f"❌ FAIL | GET /admin/offers | Error: {str(e)}")
        test_results["offers"]["get"] = False
        return []

def test_create_offer():
    """Test POST /api/admin/offers"""
    print_test_header("POST /api/admin/offers - Create new offer")
    
    # Create offer valid for 30 days
    valid_until = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    payload = {
        "title": "Test Summer Sale",
        "subtitle": "Limited time offer",
        "code": "TESTSUMMER2026",
        "discount_percent": 25.0,
        "valid_until": valid_until,
        "banner_url": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400",
        "bg_color": "#FF6B6B"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/admin/offers",
            json=payload,
            timeout=10
        )
        data = response.json() if response.status_code in [200, 201] else response.text
        
        success = response.status_code in [200, 201]
        test_results["offers"]["post"] = success
        
        if success and isinstance(data, dict) and "id" in data:
            created_ids["offer_id"] = data["id"]
            print_result("/admin/offers", "POST", response.status_code, data, success)
        else:
            print_result("/admin/offers", "POST", response.status_code, data, False)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | POST /admin/offers | Error: {str(e)}")
        test_results["offers"]["post"] = False
        return None

def test_update_offer(offer_id):
    """Test PATCH /api/admin/offers/{id}"""
    print_test_header(f"PATCH /api/admin/offers/{offer_id} - Update offer")
    
    if not offer_id:
        print("⚠️ SKIP | No offer_id available for update test")
        test_results["offers"]["patch"] = None
        return None
    
    payload = {
        "discount_percent": 30.0,
        "title": "Test Summer Sale - Updated"
    }
    
    try:
        response = requests.patch(
            f"{BACKEND_URL}/admin/offers/{offer_id}",
            json=payload,
            timeout=10
        )
        data = response.json() if response.status_code in [200, 204] else response.text
        
        success = response.status_code in [200, 204]
        test_results["offers"]["patch"] = success
        print_result(f"/admin/offers/{offer_id}", "PATCH", response.status_code, data, success)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | PATCH /admin/offers/{offer_id} | Error: {str(e)}")
        test_results["offers"]["patch"] = False
        return None

def test_delete_offer(offer_id):
    """Test DELETE /api/admin/offers/{id}"""
    print_test_header(f"DELETE /api/admin/offers/{offer_id} - Delete offer")
    
    if not offer_id:
        print("⚠️ SKIP | No offer_id available for delete test")
        test_results["offers"]["delete"] = None
        return None
    
    try:
        response = requests.delete(
            f"{BACKEND_URL}/admin/offers/{offer_id}",
            timeout=10
        )
        data = response.json() if response.status_code in [200, 204] else response.text
        
        success = response.status_code in [200, 204]
        test_results["offers"]["delete"] = success
        print_result(f"/admin/offers/{offer_id}", "DELETE", response.status_code, data, success)
        
        return data if success else None
    except Exception as e:
        print(f"❌ FAIL | DELETE /admin/offers/{offer_id} | Error: {str(e)}")
        test_results["offers"]["delete"] = False
        return None

# ==================== CATEGORIES TESTS ====================

def test_get_categories():
    """Test GET /api/admin/categories"""
    print_test_header("GET /api/admin/categories - List all categories")
    try:
        response = requests.get(f"{BACKEND_URL}/admin/categories", timeout=10)
        data = response.json() if response.status_code == 200 else response.text
        
        success = response.status_code == 200
        test_results["categories"]["get"] = success
        print_result("/admin/categories", "GET", response.status_code, data, success)
        
        return data if success else []
    except Exception as e:
        print(f"❌ FAIL | GET /admin/categories | Error: {str(e)}")
        test_results["categories"]["get"] = False
        return []

# ==================== MAIN TEST RUNNER ====================

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    skipped_tests = 0
    
    for category, tests in test_results.items():
        print(f"\n{category.upper()}:")
        for method, result in tests.items():
            total_tests += 1
            if result is True:
                print(f"  ✅ {method.upper()}: PASS")
                passed_tests += 1
            elif result is False:
                print(f"  ❌ {method.upper()}: FAIL")
                failed_tests += 1
            else:
                print(f"  ⚠️  {method.upper()}: SKIP")
                skipped_tests += 1
    
    print("\n" + "="*80)
    print(f"Total: {total_tests} | Passed: {passed_tests} | Failed: {failed_tests} | Skipped: {skipped_tests}")
    print("="*80)
    
    return {
        "total": total_tests,
        "passed": passed_tests,
        "failed": failed_tests,
        "skipped": skipped_tests
    }

def run_all_tests():
    """Run all admin API tests"""
    print("\n" + "="*80)
    print("ADMIN PANEL BACKEND API TESTING")
    print("Backend URL:", BACKEND_URL)
    print("="*80)
    
    # Test Services
    print("\n\n### TESTING SERVICES CRUD ###")
    services = test_get_services()
    created_service = test_create_service()
    test_update_service(created_ids["service_id"])
    test_delete_service(created_ids["service_id"])
    
    # Test Slots
    print("\n\n### TESTING SLOTS CRUD ###")
    slots = test_get_slots()
    created_slot = test_create_slot()
    test_update_slot(created_ids["slot_id"])
    test_delete_slot(created_ids["slot_id"])
    
    # Test Bookings
    print("\n\n### TESTING BOOKINGS MANAGEMENT ###")
    bookings = test_get_bookings()
    test_update_booking_status(bookings)
    
    # Test Offers
    print("\n\n### TESTING OFFERS CRUD ###")
    offers = test_get_offers()
    created_offer = test_create_offer()
    test_update_offer(created_ids["offer_id"])
    test_delete_offer(created_ids["offer_id"])
    
    # Test Categories
    print("\n\n### TESTING CATEGORIES ###")
    categories = test_get_categories()
    
    # Print summary
    summary = print_summary()
    
    return summary

if __name__ == "__main__":
    summary = run_all_tests()
    
    # Exit with appropriate code
    if summary["failed"] > 0:
        exit(1)
    else:
        exit(0)
