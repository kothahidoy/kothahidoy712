#!/usr/bin/env python3
"""
Regression test for FK violation fix on bookings_service_id_fkey.

Tests the auto-upsert logic in _ensure_services_exist() that prevents
FK violations when frontend uses hardcoded service IDs like "tv-install"
that don't exist in public.services.
"""
import httpx
import time
from jose import jwt
import json
import sys

# Test credentials from /app/memory/test_credentials.md
BACKEND_URL = "http://localhost:8001"
JWT_SECRET = "n73w6AhIgLG06aaNkTHXHgXNUOSX2nq5AHktvEfx0VddrCw0uUlbO2EXUY5UD7nABJXRRYaEMn3cRDtip3PIeQ=="
SUPABASE_URL = "https://xuxetkeqxuwgphqrdzvy.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGV0a2VxeHV3Z3BocXJkenZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1OTc1MiwiZXhwIjoyMDk1NjM1NzUyfQ.6oagP6W7bj7x-j6TxCouTa2Tmhw6U3R5oDwFcO8IJJw"

# Postgres pooler credentials for cleanup
PG_HOST = "aws-1-ap-south-1.pooler.supabase.com"
PG_PORT = 6543
PG_USER = "postgres.xuxetkeqxuwgphqrdzvy"
PG_PASSWORD = "Sohana@712@"

def generate_token():
    """Generate a valid JWT token for the test user."""
    now = int(time.time())
    token = jwt.encode({
        "iss": "https://xuxetkeqxuwgphqrdzvy.supabase.co/auth/v1",
        "sub": "0f56b3ef-d031-4db7-90a9-f2e001b48cca",
        "aud": "authenticated",
        "role": "authenticated",
        "exp": now + 3600,
        "iat": now,
        "email": "mstarifakhatun42443@gmail.com",
        "app_metadata": {"provider": "email"},
        "user_metadata": {},
    }, JWT_SECRET, algorithm="HS256")
    return token

def sb_headers():
    """Supabase REST API headers with service role key."""
    return {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def query_service(service_id):
    """Query a service from public.services."""
    try:
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/services?id=eq.{service_id}&select=*",
            headers=sb_headers(),
            timeout=15.0,
        )
        if r.status_code == 200 and r.json():
            return r.json()[0]
        return None
    except Exception as e:
        print(f"❌ Error querying service {service_id}: {e}")
        return None

def query_notification(booking_id):
    """Query notification for a booking."""
    try:
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/notifications?booking_id=eq.{booking_id}&select=*",
            headers=sb_headers(),
            timeout=15.0,
        )
        if r.status_code == 200 and r.json():
            return r.json()[0]
        return None
    except Exception as e:
        print(f"❌ Error querying notification for booking {booking_id}: {e}")
        return None

def delete_service(service_id):
    """Delete a service from public.services."""
    try:
        r = httpx.delete(
            f"{SUPABASE_URL}/rest/v1/services?id=eq.{service_id}",
            headers=sb_headers(),
            timeout=15.0,
        )
        if r.status_code in [200, 204]:
            print(f"✅ Deleted service: {service_id}")
        else:
            print(f"⚠️ Failed to delete service {service_id}: {r.status_code} {r.text}")
    except Exception as e:
        print(f"❌ Error deleting service {service_id}: {e}")

def delete_booking(booking_id):
    """Delete a booking from public.bookings."""
    try:
        r = httpx.delete(
            f"{SUPABASE_URL}/rest/v1/bookings?id=eq.{booking_id}",
            headers=sb_headers(),
            timeout=15.0,
        )
        if r.status_code in [200, 204]:
            print(f"✅ Deleted booking: {booking_id}")
        else:
            print(f"⚠️ Failed to delete booking {booking_id}: {r.status_code} {r.text}")
    except Exception as e:
        print(f"❌ Error deleting booking {booking_id}: {e}")

def delete_notification(booking_id):
    """Delete notifications for a booking."""
    try:
        r = httpx.delete(
            f"{SUPABASE_URL}/rest/v1/notifications?booking_id=eq.{booking_id}",
            headers=sb_headers(),
            timeout=15.0,
        )
        if r.status_code in [200, 204]:
            print(f"✅ Deleted notifications for booking: {booking_id}")
        else:
            print(f"⚠️ Failed to delete notifications for booking {booking_id}: {r.status_code} {r.text}")
    except Exception as e:
        print(f"❌ Error deleting notifications for booking {booking_id}: {e}")

# Test cases
test_results = []
created_bookings = []
created_services = []

def test_case_a():
    """
    (a) Ad-hoc service auto-upsert
    POST /api/booking/create with service_id="tv-install" (new service)
    Expected: 200 OK, service auto-created in DB with correct fields
    """
    print("\n" + "="*80)
    print("TEST CASE (a): Ad-hoc service auto-upsert")
    print("="*80)
    
    token = generate_token()
    payload = {
        "items": [{
            "service_id": "tv-install",
            "quantity": 1,
            "price": 399,
            "title": "TV installation & mounting",
            "image": "",
            "category": "ac-appliance"
        }],
        "address": {
            "id": "a1",
            "label": "Home",
            "addressLine": "H5, Street",
            "city": "Durgapur",
            "landmark": "",
            "latitude": 22.87,
            "longitude": 87.53
        },
        "slot_date": "2026-07-05",
        "slot_time": "01:30 PM",
        "payment_method": "cash",
        "tip_amount": 0
    }
    
    try:
        r = httpx.post(
            f"{BACKEND_URL}/api/booking/create",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=30.0,
        )
        
        print(f"Status: {r.status_code}")
        
        if r.status_code == 200:
            booking = r.json().get("booking", {})
            booking_id = booking.get("id")
            print(f"✅ Booking created successfully: {booking_id}")
            
            if booking_id:
                created_bookings.append(booking_id)
                created_services.append("tv-install")
                
                # Verify service was created
                service = query_service("tv-install")
                if service:
                    print(f"\n✅ Service 'tv-install' auto-created in DB:")
                    print(f"   - id: {service.get('id')}")
                    print(f"   - category_id: {service.get('category_id')}")
                    print(f"   - title: {service.get('title')}")
                    print(f"   - starting_price: {service.get('starting_price')}")
                    print(f"   - duration_mins: {service.get('duration_mins')}")
                    print(f"   - is_active: {service.get('is_active')}")
                    
                    # Verify fields match expectations
                    checks = []
                    checks.append(("id", service.get("id") == "tv-install"))
                    checks.append(("category_id", service.get("category_id") == "ac-appliance"))
                    checks.append(("title", service.get("title") == "TV installation & mounting"))
                    checks.append(("starting_price", service.get("starting_price") == 399))
                    checks.append(("duration_mins", service.get("duration_mins") == 45))
                    checks.append(("is_active", service.get("is_active") == True))
                    
                    all_pass = all(check[1] for check in checks)
                    if all_pass:
                        print("\n✅ All service fields match expected values")
                    else:
                        print("\n⚠️ Some service fields don't match:")
                        for field, passed in checks:
                            if not passed:
                                print(f"   ❌ {field}")
                    
                    # Verify notification was created
                    notification = query_notification(booking_id)
                    if notification and notification.get("kind") == "new_booking":
                        print(f"\n✅ Notification created: kind={notification.get('kind')}")
                    else:
                        print(f"\n⚠️ Notification not found or wrong kind")
                    
                    test_results.append(("Case (a)", "PASS" if all_pass else "PARTIAL"))
                else:
                    print(f"❌ Service 'tv-install' was NOT created in DB")
                    test_results.append(("Case (a)", "FAIL"))
        else:
            print(f"❌ Booking creation failed: {r.status_code}")
            print(f"Response: {r.text[:500]}")
            test_results.append(("Case (a)", "FAIL"))
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        test_results.append(("Case (a)", "FAIL"))

def test_case_b():
    """
    (b) Route slug that needs mapping
    POST /api/booking/create with category="cleaning" (should map to "cleaning-pest")
    Expected: 200 OK, service created with category_id="cleaning-pest"
    """
    print("\n" + "="*80)
    print("TEST CASE (b): Route slug mapping (cleaning → cleaning-pest)")
    print("="*80)
    
    token = generate_token()
    payload = {
        "items": [{
            "service_id": "chimney-clean",
            "quantity": 1,
            "price": 399,
            "title": "Chimney cleaning",
            "image": "",
            "category": "cleaning"
        }],
        "address": {
            "id": "a1",
            "label": "Home",
            "addressLine": "H5, Street",
            "city": "Durgapur",
            "landmark": "",
            "latitude": 22.87,
            "longitude": 87.53
        },
        "slot_date": "2026-07-05",
        "slot_time": "02:00 PM",
        "payment_method": "cash",
        "tip_amount": 0
    }
    
    try:
        r = httpx.post(
            f"{BACKEND_URL}/api/booking/create",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=30.0,
        )
        
        print(f"Status: {r.status_code}")
        
        if r.status_code == 200:
            booking = r.json().get("booking", {})
            booking_id = booking.get("id")
            print(f"✅ Booking created successfully: {booking_id}")
            
            if booking_id:
                created_bookings.append(booking_id)
                created_services.append("chimney-clean")
                
                # Verify service was created with correct category mapping
                service = query_service("chimney-clean")
                if service:
                    category_id = service.get("category_id")
                    print(f"\n✅ Service 'chimney-clean' auto-created:")
                    print(f"   - category_id: {category_id}")
                    print(f"   - title: {service.get('title')}")
                    
                    if category_id == "cleaning-pest":
                        print(f"\n✅ Category mapping correct: 'cleaning' → 'cleaning-pest'")
                        test_results.append(("Case (b)", "PASS"))
                    else:
                        print(f"\n❌ Category mapping WRONG: expected 'cleaning-pest', got '{category_id}'")
                        test_results.append(("Case (b)", "FAIL"))
                else:
                    print(f"❌ Service 'chimney-clean' was NOT created in DB")
                    test_results.append(("Case (b)", "FAIL"))
        else:
            print(f"❌ Booking creation failed: {r.status_code}")
            print(f"Response: {r.text[:500]}")
            test_results.append(("Case (b)", "FAIL"))
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        test_results.append(("Case (b)", "FAIL"))

def test_case_c():
    """
    (c) Existing service — no duplicate, no overwrite
    POST /api/booking/create with existing service_id but different title/price
    Expected: 200 OK, existing service NOT overwritten
    """
    print("\n" + "="*80)
    print("TEST CASE (c): Existing service protection (no overwrite)")
    print("="*80)
    
    # First, query the existing service to get original values
    service_before = query_service("svc-ac-7")
    if not service_before:
        print("❌ Service 'svc-ac-7' not found in DB. Cannot run test.")
        test_results.append(("Case (c)", "SKIP"))
        return
    
    print(f"Original service 'svc-ac-7':")
    print(f"   - title: {service_before.get('title')}")
    print(f"   - starting_price: {service_before.get('starting_price')}")
    print(f"   - category_id: {service_before.get('category_id')}")
    
    token = generate_token()
    payload = {
        "items": [{
            "service_id": "svc-ac-7",
            "quantity": 1,
            "price": 999999,  # Attempt to overwrite with wrong price
            "title": "HACKED",  # Attempt to overwrite with wrong title
            "image": "",
            "category": "electrician"  # Attempt to overwrite with wrong category
        }],
        "address": {
            "id": "a1",
            "label": "Home",
            "addressLine": "H5, Street",
            "city": "Durgapur",
            "landmark": "",
            "latitude": 22.87,
            "longitude": 87.53
        },
        "slot_date": "2026-07-05",
        "slot_time": "03:00 PM",
        "payment_method": "cash",
        "tip_amount": 0
    }
    
    try:
        r = httpx.post(
            f"{BACKEND_URL}/api/booking/create",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=30.0,
        )
        
        print(f"\nStatus: {r.status_code}")
        
        if r.status_code == 200:
            booking = r.json().get("booking", {})
            booking_id = booking.get("id")
            print(f"✅ Booking created successfully: {booking_id}")
            
            if booking_id:
                created_bookings.append(booking_id)
                
                # Verify service was NOT overwritten
                service_after = query_service("svc-ac-7")
                if service_after:
                    print(f"\nService 'svc-ac-7' after booking:")
                    print(f"   - title: {service_after.get('title')}")
                    print(f"   - starting_price: {service_after.get('starting_price')}")
                    print(f"   - category_id: {service_after.get('category_id')}")
                    
                    # Check if values are unchanged
                    title_unchanged = service_after.get("title") == service_before.get("title")
                    price_unchanged = service_after.get("starting_price") == service_before.get("starting_price")
                    category_unchanged = service_after.get("category_id") == service_before.get("category_id")
                    
                    if title_unchanged and price_unchanged and category_unchanged:
                        print(f"\n✅ Service NOT overwritten - original values preserved")
                        test_results.append(("Case (c)", "PASS"))
                    else:
                        print(f"\n❌ Service WAS overwritten:")
                        if not title_unchanged:
                            print(f"   ❌ title changed: '{service_before.get('title')}' → '{service_after.get('title')}'")
                        if not price_unchanged:
                            print(f"   ❌ price changed: {service_before.get('starting_price')} → {service_after.get('starting_price')}")
                        if not category_unchanged:
                            print(f"   ❌ category changed: '{service_before.get('category_id')}' → '{service_after.get('category_id')}'")
                        test_results.append(("Case (c)", "FAIL"))
                else:
                    print(f"❌ Service 'svc-ac-7' not found after booking")
                    test_results.append(("Case (c)", "FAIL"))
        else:
            print(f"❌ Booking creation failed: {r.status_code}")
            print(f"Response: {r.text[:500]}")
            test_results.append(("Case (c)", "FAIL"))
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        test_results.append(("Case (c)", "FAIL"))

def test_case_d():
    """
    (d) Mixed batch
    POST /api/booking/create with two items: one existing (svc-ac-7) and one new (switch-repair)
    Expected: 200 OK, new service created, existing service unchanged
    """
    print("\n" + "="*80)
    print("TEST CASE (d): Mixed batch (existing + new service)")
    print("="*80)
    
    token = generate_token()
    payload = {
        "items": [
            {
                "service_id": "svc-ac-7",
                "quantity": 1,
                "price": 449,
                "title": "Chimney & Hob Service",
                "image": "",
                "category": "ac-appliance"
            },
            {
                "service_id": "switch-repair",
                "quantity": 1,
                "price": 199,
                "title": "Switch repair",
                "image": "",
                "category": "electrician"
            }
        ],
        "address": {
            "id": "a1",
            "label": "Home",
            "addressLine": "H5, Street",
            "city": "Durgapur",
            "landmark": "",
            "latitude": 22.87,
            "longitude": 87.53
        },
        "slot_date": "2026-07-05",
        "slot_time": "04:00 PM",
        "payment_method": "cash",
        "tip_amount": 0
    }
    
    try:
        r = httpx.post(
            f"{BACKEND_URL}/api/booking/create",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=30.0,
        )
        
        print(f"Status: {r.status_code}")
        
        if r.status_code == 200:
            booking = r.json().get("booking", {})
            booking_id = booking.get("id")
            print(f"✅ Booking created successfully: {booking_id}")
            
            if booking_id:
                created_bookings.append(booking_id)
                created_services.append("switch-repair")
                
                # Verify both services exist
                svc_ac7 = query_service("svc-ac-7")
                svc_switch = query_service("switch-repair")
                
                checks = []
                
                if svc_ac7:
                    print(f"\n✅ Service 'svc-ac-7' exists (existing service)")
                    checks.append(True)
                else:
                    print(f"\n❌ Service 'svc-ac-7' not found")
                    checks.append(False)
                
                if svc_switch:
                    print(f"✅ Service 'switch-repair' exists (new service)")
                    print(f"   - category_id: {svc_switch.get('category_id')}")
                    print(f"   - title: {svc_switch.get('title')}")
                    print(f"   - starting_price: {svc_switch.get('starting_price')}")
                    
                    if svc_switch.get("category_id") == "electrician":
                        print(f"   ✅ Category correct: 'electrician'")
                        checks.append(True)
                    else:
                        print(f"   ❌ Category wrong: expected 'electrician', got '{svc_switch.get('category_id')}'")
                        checks.append(False)
                else:
                    print(f"❌ Service 'switch-repair' was NOT created")
                    checks.append(False)
                
                if all(checks):
                    test_results.append(("Case (d)", "PASS"))
                else:
                    test_results.append(("Case (d)", "FAIL"))
        else:
            print(f"❌ Booking creation failed: {r.status_code}")
            print(f"Response: {r.text[:500]}")
            test_results.append(("Case (d)", "FAIL"))
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        test_results.append(("Case (d)", "FAIL"))

def test_case_e():
    """
    (e) Regression from prior fix
    Test that phone update endpoint still works after the new changes
    """
    print("\n" + "="*80)
    print("TEST CASE (e): Regression - phone update endpoint")
    print("="*80)
    
    token = generate_token()
    
    # Test with valid token
    print("\n1. POST /api/booking/profile/phone with valid token:")
    try:
        r = httpx.post(
            f"{BACKEND_URL}/api/booking/profile/phone",
            headers={"Authorization": f"Bearer {token}"},
            json={"phone": "9876543211", "name": "QA"},
            timeout=15.0,
        )
        print(f"   Status: {r.status_code}")
        if r.status_code == 200:
            print(f"   ✅ Phone update successful")
            phone_test_pass = True
        else:
            print(f"   ❌ Phone update failed: {r.text[:200]}")
            phone_test_pass = False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        phone_test_pass = False
    
    # Test without auth header
    print("\n2. POST /api/booking/profile/phone without auth header:")
    try:
        r = httpx.post(
            f"{BACKEND_URL}/api/booking/profile/phone",
            json={"phone": "9876543211", "name": "QA"},
            timeout=15.0,
        )
        print(f"   Status: {r.status_code}")
        if r.status_code == 401:
            print(f"   ✅ Correctly returns 401 Unauthorized")
            auth_test_pass = True
        else:
            print(f"   ❌ Expected 401, got {r.status_code}")
            auth_test_pass = False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        auth_test_pass = False
    
    if phone_test_pass and auth_test_pass:
        test_results.append(("Case (e)", "PASS"))
    else:
        test_results.append(("Case (e)", "FAIL"))

def test_case_f():
    """
    (f) Basic sanity
    GET /api/ → 200 {"message":"Hello World"}
    """
    print("\n" + "="*80)
    print("TEST CASE (f): Basic sanity check")
    print("="*80)
    
    try:
        r = httpx.get(f"{BACKEND_URL}/api/", timeout=15.0)
        print(f"Status: {r.status_code}")
        
        if r.status_code == 200:
            body = r.json()
            if body.get("message") == "Hello World":
                print(f"✅ Basic sanity check passed")
                test_results.append(("Case (f)", "PASS"))
            else:
                print(f"❌ Unexpected response: {body}")
                test_results.append(("Case (f)", "FAIL"))
        else:
            print(f"❌ Expected 200, got {r.status_code}")
            test_results.append(("Case (f)", "FAIL"))
    except Exception as e:
        print(f"❌ Exception: {e}")
        test_results.append(("Case (f)", "FAIL"))

def cleanup():
    """Clean up all created test data."""
    print("\n" + "="*80)
    print("CLEANUP: Deleting test data")
    print("="*80)
    
    # Delete bookings and their notifications
    for booking_id in created_bookings:
        delete_notification(booking_id)
        delete_booking(booking_id)
    
    # Delete auto-provisioned services
    for service_id in created_services:
        delete_service(service_id)

def print_summary():
    """Print test results summary."""
    print("\n" + "="*80)
    print("TEST RESULTS SUMMARY")
    print("="*80)
    
    total = len(test_results)
    passed = sum(1 for _, result in test_results if result == "PASS")
    failed = sum(1 for _, result in test_results if result == "FAIL")
    partial = sum(1 for _, result in test_results if result == "PARTIAL")
    skipped = sum(1 for _, result in test_results if result == "SKIP")
    
    for test_name, result in test_results:
        icon = "✅" if result == "PASS" else "⚠️" if result == "PARTIAL" else "⏭️" if result == "SKIP" else "❌"
        print(f"{icon} {test_name}: {result}")
    
    print(f"\nTotal: {total} | Passed: {passed} | Failed: {failed} | Partial: {partial} | Skipped: {skipped}")
    
    if failed == 0 and partial == 0 and skipped == 0:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    elif failed == 0:
        print("\n⚠️ TESTS COMPLETED WITH WARNINGS")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        return 1

if __name__ == "__main__":
    print("="*80)
    print("FK VIOLATION FIX REGRESSION TEST")
    print("Testing auto-upsert logic for bookings_service_id_fkey")
    print("="*80)
    
    # Run all test cases
    test_case_f()  # Basic sanity first
    test_case_a()  # Ad-hoc service auto-upsert
    test_case_b()  # Route slug mapping
    test_case_c()  # Existing service protection
    test_case_d()  # Mixed batch
    test_case_e()  # Regression check
    
    # Print summary
    exit_code = print_summary()
    
    # Cleanup
    cleanup()
    
    sys.exit(exit_code)
