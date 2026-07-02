#!/usr/bin/env python3
"""
Regression test for auth fix in /app/backend/booking_routes.py

Bug being fixed:
- User logged in via email OTP was seeing 401 errors on POST /api/booking/profile/phone
  and POST /api/booking/create
- Root cause: _user_id_from_token() was flaky, and booking creation used flat address columns

Fix:
- _user_id_from_token() now verifies JWT locally + auto-provisions users
- POST /api/booking/create now packs address into JSONB column
"""
import time
import requests
from jose import jwt

# Test configuration
BACKEND_URL = "https://80fb5554-c4b4-4eb1-8649-fef8ec889902.preview.emergentagent.com"
JWT_SECRET = "n73w6AhIgLG06aaNkTHXHgXNUOSX2nq5AHktvEfx0VddrCw0uUlbO2EXUY5UD7nABJXRRYaEMn3cRDtip3PIeQ=="
TEST_USER_EMAIL = "mstarifakhatun42443@gmail.com"
TEST_USER_AUTH_ID = "0f56b3ef-d031-4db7-90a9-f2e001b48cca"
TEST_USER_PUBLIC_ID = "83758fe8-143d-4b1e-bcd0-9fdc085ccdd6"

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def generate_token():
    """Generate a valid JWT token for testing"""
    now = int(time.time())
    token = jwt.encode({
        "iss": "https://xuxetkeqxuwgphqrdzvy.supabase.co/auth/v1",
        "sub": TEST_USER_AUTH_ID,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": now + 3600,
        "iat": now,
        "email": TEST_USER_EMAIL,
        "app_metadata": {"provider": "email"},
        "user_metadata": {},
    }, JWT_SECRET, algorithm="HS256")
    return token

def print_test_header(test_name):
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST: {test_name}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")

def print_result(passed, message):
    if passed:
        print(f"{GREEN}✅ PASS:{RESET} {message}")
    else:
        print(f"{RED}❌ FAIL:{RESET} {message}")
    return passed

def print_info(message):
    print(f"{YELLOW}ℹ️  INFO:{RESET} {message}")

def print_response(response):
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.text[:500]}")

# Test counters
total_tests = 0
passed_tests = 0

def run_test(test_func):
    global total_tests, passed_tests
    total_tests += 1
    if test_func():
        passed_tests += 1

# ============================================================================
# TEST 1: POST /api/booking/profile/phone
# ============================================================================
def test_profile_phone_no_auth():
    print_test_header("POST /api/booking/profile/phone - No Authorization Header")
    url = f"{BACKEND_URL}/api/booking/profile/phone"
    payload = {"phone": "9876543210", "name": "QA Tester"}
    
    response = requests.post(url, json=payload)
    print_response(response)
    
    passed = response.status_code == 401
    if passed:
        try:
            data = response.json()
            passed = passed and "sign in" in data.get("detail", "").lower()
        except:
            passed = False
    
    return print_result(passed, "Returns 401 with 'Please sign in' message")

def test_profile_phone_invalid_token():
    print_test_header("POST /api/booking/profile/phone - Invalid Bearer Token")
    url = f"{BACKEND_URL}/api/booking/profile/phone"
    headers = {"Authorization": "Bearer garbage_invalid_token_12345"}
    payload = {"phone": "9876543210", "name": "QA Tester"}
    
    response = requests.post(url, json=payload, headers=headers)
    print_response(response)
    
    passed = response.status_code == 401
    return print_result(passed, "Returns 401 for invalid token")

def test_profile_phone_valid_token():
    print_test_header("POST /api/booking/profile/phone - Valid Token")
    token = generate_token()
    url = f"{BACKEND_URL}/api/booking/profile/phone"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"phone": "9876543210", "name": "QA Tester"}
    
    response = requests.post(url, json=payload, headers=headers)
    print_response(response)
    
    passed = response.status_code == 200
    if passed:
        try:
            data = response.json()
            passed = passed and data.get("ok") == True
            passed = passed and data.get("user") is not None
            if passed:
                user = data["user"]
                print_info(f"User ID: {user.get('id')}")
                print_info(f"Phone: {user.get('phone')}")
                print_info(f"Name: {user.get('full_name')}")
        except Exception as e:
            print_info(f"Error parsing response: {e}")
            passed = False
    
    return print_result(passed, "Returns 200 OK with user object")

def test_profile_phone_short_phone():
    print_test_header("POST /api/booking/profile/phone - Short Phone Number")
    token = generate_token()
    url = f"{BACKEND_URL}/api/booking/profile/phone"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"phone": "12", "name": "QA Tester"}
    
    response = requests.post(url, json=payload, headers=headers)
    print_response(response)
    
    passed = response.status_code == 400
    if passed:
        try:
            data = response.json()
            passed = passed and "valid phone" in data.get("detail", "").lower()
        except:
            passed = False
    
    return print_result(passed, "Returns 400 for short phone number")

# ============================================================================
# TEST 2: POST /api/booking/create
# ============================================================================
def test_booking_create_no_auth():
    print_test_header("POST /api/booking/create - No Authorization Header")
    url = f"{BACKEND_URL}/api/booking/create"
    payload = {
        "items": [{"service_id": "svc-ac-7", "quantity": 1, "price": 449, "title": "Chimney & Hob Service", "image": ""}],
        "address": {"id": "a1", "label": "Home", "addressLine": "House 5, X Street", "city": "Durgapur", "landmark": "Near park", "latitude": 22.87, "longitude": 87.53},
        "slot_date": "2026-07-05",
        "slot_time": "01:30 PM",
        "payment_method": "cash",
        "tip_amount": 0
    }
    
    response = requests.post(url, json=payload)
    print_response(response)
    
    passed = response.status_code == 401
    return print_result(passed, "Returns 401 without authorization")

def test_booking_create_empty_items():
    print_test_header("POST /api/booking/create - Empty Items Array")
    token = generate_token()
    url = f"{BACKEND_URL}/api/booking/create"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "items": [],
        "address": {"id": "a1", "label": "Home", "addressLine": "House 5, X Street", "city": "Durgapur"},
        "slot_date": "2026-07-05",
        "slot_time": "01:30 PM",
        "payment_method": "cash",
        "tip_amount": 0
    }
    
    response = requests.post(url, json=payload, headers=headers)
    print_response(response)
    
    passed = response.status_code == 400
    if passed:
        try:
            data = response.json()
            passed = passed and "empty" in data.get("detail", "").lower()
        except:
            passed = False
    
    return print_result(passed, "Returns 400 with 'Cart is empty' message")

def test_booking_create_valid():
    print_test_header("POST /api/booking/create - Valid Booking")
    token = generate_token()
    url = f"{BACKEND_URL}/api/booking/create"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "items": [{"service_id": "svc-ac-7", "quantity": 1, "price": 449, "title": "Chimney & Hob Service", "image": ""}],
        "address": {
            "id": "a1",
            "label": "Home",
            "addressLine": "House 5, X Street",
            "city": "Durgapur",
            "landmark": "Near park",
            "latitude": 22.87,
            "longitude": 87.53
        },
        "slot_date": "2026-07-05",
        "slot_time": "01:30 PM",
        "payment_method": "cash",
        "tip_amount": 0
    }
    
    response = requests.post(url, json=payload, headers=headers)
    print_response(response)
    
    passed = response.status_code == 200
    booking_id = None
    if passed:
        try:
            data = response.json()
            booking = data.get("booking")
            passed = passed and booking is not None
            passed = passed and booking.get("id") is not None
            passed = passed and booking.get("customer_id") == TEST_USER_PUBLIC_ID
            passed = passed and booking.get("status") == "pending"
            
            # CRITICAL: Verify address is stored as JSONB object, not flat columns
            address = booking.get("address")
            passed = passed and isinstance(address, dict)
            passed = passed and address.get("addressLine") == "House 5, X Street"
            passed = passed and address.get("city") == "Durgapur"
            passed = passed and address.get("landmark") == "Near park"
            
            if passed:
                booking_id = booking["id"]
                print_info(f"Booking ID: {booking_id}")
                print_info(f"Customer ID: {booking.get('customer_id')}")
                print_info(f"Status: {booking.get('status')}")
                print_info(f"Address (JSONB): {address}")
        except Exception as e:
            print_info(f"Error parsing response: {e}")
            passed = False
    
    result = print_result(passed, "Returns 200 OK with booking object and JSONB address")
    
    # Store booking_id for notification check
    if booking_id:
        globals()['last_booking_id'] = booking_id
    
    return result

def test_booking_notification_trigger():
    print_test_header("Notification Trigger - Verify new_booking notification")
    
    if 'last_booking_id' not in globals():
        print_info("Skipping: No booking ID from previous test")
        return print_result(False, "Cannot verify notification (no booking created)")
    
    booking_id = globals()['last_booking_id']
    print_info(f"Checking notifications for booking_id: {booking_id}")
    
    # Query Supabase notifications table via REST API
    supabase_url = "https://xuxetkeqxuwgphqrdzvy.supabase.co"
    service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGV0a2VxeHV3Z3BocXJkenZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1OTc1MiwiZXhwIjoyMDk1NjM1NzUyfQ.6oagP6W7bj7x-j6TxCouTa2Tmhw6U3R5oDwFcO8IJJw"
    
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }
    
    url = f"{supabase_url}/rest/v1/notifications?booking_id=eq.{booking_id}&kind=eq.new_booking&target_type=eq.admin"
    
    try:
        response = requests.get(url, headers=headers)
        print_response(response)
        
        passed = response.status_code == 200
        if passed:
            data = response.json()
            passed = passed and len(data) > 0
            if passed:
                notification = data[0]
                print_info(f"Notification ID: {notification.get('id')}")
                print_info(f"Kind: {notification.get('kind')}")
                print_info(f"Target Type: {notification.get('target_type')}")
            else:
                print_info("No notification found for this booking")
        
        return print_result(passed, "Notification trigger fired successfully")
    except Exception as e:
        print_info(f"Error checking notifications: {e}")
        return print_result(False, "Failed to verify notification")

# ============================================================================
# TEST 3: Regression Sanity Checks
# ============================================================================
def test_root_endpoint():
    print_test_header("GET /api/ - Root Endpoint")
    url = f"{BACKEND_URL}/api/"
    
    response = requests.get(url)
    print_response(response)
    
    passed = response.status_code == 200
    if passed:
        try:
            data = response.json()
            passed = passed and "message" in data
        except:
            passed = False
    
    return print_result(passed, "Returns 200 with message")

def test_slots_endpoint():
    print_test_header("GET /api/booking/slots?date=2026-07-05")
    url = f"{BACKEND_URL}/api/booking/slots?date=2026-07-05"
    
    response = requests.get(url)
    print_response(response)
    
    passed = response.status_code == 200
    if passed:
        try:
            data = response.json()
            passed = passed and "slots" in data
            print_info(f"Slots returned: {len(data.get('slots', []))}")
        except:
            passed = False
    
    return print_result(passed, "Returns 200 with slots array")

def test_slots_dates_endpoint():
    print_test_header("GET /api/booking/slots/dates?days=7")
    url = f"{BACKEND_URL}/api/booking/slots/dates?days=7"
    
    response = requests.get(url)
    print_response(response)
    
    passed = response.status_code == 200
    if passed:
        try:
            data = response.json()
            passed = passed and "dates" in data
            passed = passed and len(data.get("dates", [])) == 7
            print_info(f"Dates returned: {len(data.get('dates', []))}")
        except:
            passed = False
    
    return print_result(passed, "Returns 200 with 7 dates")

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def main():
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}REGRESSION TEST: Auth Fix in /app/backend/booking_routes.py{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test User: {TEST_USER_EMAIL}")
    print(f"User ID: {TEST_USER_PUBLIC_ID}")
    
    # Test 1: POST /api/booking/profile/phone
    run_test(test_profile_phone_no_auth)
    run_test(test_profile_phone_invalid_token)
    run_test(test_profile_phone_valid_token)
    run_test(test_profile_phone_short_phone)
    
    # Test 2: POST /api/booking/create
    run_test(test_booking_create_no_auth)
    run_test(test_booking_create_empty_items)
    run_test(test_booking_create_valid)
    run_test(test_booking_notification_trigger)
    
    # Test 3: Regression sanity
    run_test(test_root_endpoint)
    run_test(test_slots_endpoint)
    run_test(test_slots_dates_endpoint)
    
    # Summary
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST SUMMARY{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"Total Tests: {total_tests}")
    print(f"{GREEN}Passed: {passed_tests}{RESET}")
    print(f"{RED}Failed: {total_tests - passed_tests}{RESET}")
    
    if passed_tests == total_tests:
        print(f"\n{GREEN}🎉 ALL TESTS PASSED! 🎉{RESET}")
    else:
        print(f"\n{RED}⚠️  SOME TESTS FAILED{RESET}")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
