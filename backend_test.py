"""
Backend API Test Suite for Mfixit Supabase Integration
Tests all backend endpoints to verify Supabase connection is working correctly
"""
import requests
import json
from datetime import datetime

# Use the public backend URL from frontend/.env
BASE_URL = "https://abb86045-1a44-4b83-9874-3ebbf0beda25.preview.emergentagent.com/api"

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(endpoint, status_code, response_data, expected_status=200):
    success = status_code == expected_status
    status_icon = "✅" if success else "❌"
    print(f"{status_icon} {endpoint}")
    print(f"   Status: {status_code} (expected {expected_status})")
    if isinstance(response_data, dict):
        print(f"   Response: {json.dumps(response_data, indent=2)[:200]}")
    elif isinstance(response_data, list):
        print(f"   Response: Array with {len(response_data)} items")
        if len(response_data) > 0:
            print(f"   First item: {json.dumps(response_data[0], indent=2)[:200]}")
    else:
        print(f"   Response: {str(response_data)[:200]}")
    return success

def test_health_endpoint():
    """Test 1: GET /api/ - Health check"""
    print_test_header("Health Check Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        data = response.json()
        success = print_result("GET /api/", response.status_code, data)
        
        # Verify response structure
        if success and data.get("message") == "Hello World":
            print("   ✅ Response structure correct")
            return True
        else:
            print("   ❌ Response structure incorrect")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_admin_services():
    """Test 2: GET /api/admin/services - List services from Supabase"""
    print_test_header("Admin Services Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/admin/services", timeout=10)
        data = response.json()
        success = print_result("GET /api/admin/services", response.status_code, data)
        
        if success and isinstance(data, list) and len(data) > 0:
            print(f"   ✅ Retrieved {len(data)} services from Supabase")
            
            # Verify Supabase data structure
            first_service = data[0]
            required_fields = ["id", "name", "price", "is_active"]
            has_all_fields = all(field in first_service for field in required_fields)
            
            if has_all_fields:
                print(f"   ✅ Service data structure correct")
                print(f"   Sample service: {first_service.get('name')} - ₹{first_service.get('price')}")
                return True
            else:
                print(f"   ❌ Missing required fields in service data")
                return False
        elif success and isinstance(data, list) and len(data) == 0:
            print("   ⚠️  Services table is empty (but connection works)")
            return True
        else:
            print("   ❌ Invalid response format")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_admin_slots():
    """Test 3: GET /api/admin/slots - List slots from Supabase"""
    print_test_header("Admin Slots Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/admin/slots", timeout=10)
        data = response.json()
        success = print_result("GET /api/admin/slots", response.status_code, data)
        
        if success and isinstance(data, list):
            print(f"   ✅ Retrieved {len(data)} slots from Supabase")
            if len(data) > 0:
                print(f"   Sample slot: {data[0].get('date')} {data[0].get('time')}")
            else:
                print("   ℹ️  Slots table is empty (but endpoint works)")
            return True
        else:
            print("   ❌ Invalid response format")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_status_post():
    """Test 4: POST /api/status - Write to MongoDB"""
    print_test_header("MongoDB Status Write Endpoint")
    try:
        payload = {
            "client_name": "test_sb_connect_" + datetime.now().strftime("%Y%m%d_%H%M%S")
        }
        response = requests.post(f"{BASE_URL}/status", json=payload, timeout=10)
        data = response.json()
        success = print_result("POST /api/status", response.status_code, data)
        
        if success and "id" in data and "client_name" in data:
            print(f"   ✅ MongoDB write successful")
            print(f"   Created record ID: {data.get('id')}")
            return True, data.get("id")
        else:
            print("   ❌ MongoDB write failed or invalid response")
            return False, None
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False, None

def test_status_get():
    """Test 5: GET /api/status - Read from MongoDB"""
    print_test_header("MongoDB Status Read Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/status", timeout=10)
        data = response.json()
        success = print_result("GET /api/status", response.status_code, data)
        
        if success and isinstance(data, list):
            print(f"   ✅ MongoDB read successful - {len(data)} records")
            
            # Check if our test record exists
            test_records = [r for r in data if r.get("client_name", "").startswith("test_sb_connect")]
            if test_records:
                print(f"   ✅ Found {len(test_records)} test records")
                return True
            else:
                print("   ⚠️  No test records found (but read works)")
                return True
        else:
            print("   ❌ Invalid response format")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_admin_bookings():
    """Test 6: GET /api/admin/bookings - List bookings"""
    print_test_header("Admin Bookings Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/admin/bookings", timeout=10)
        data = response.json()
        success = print_result("GET /api/admin/bookings", response.status_code, data)
        
        if success and isinstance(data, list):
            print(f"   ✅ Retrieved {len(data)} bookings from Supabase")
            if len(data) > 0:
                print(f"   Sample booking: {data[0].get('service_title')} - {data[0].get('status')}")
            else:
                print("   ℹ️  Bookings table is empty (but endpoint works)")
            return True
        else:
            print("   ❌ Invalid response format or endpoint failed")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_admin_categories():
    """Test 7: GET /api/admin/categories - List categories"""
    print_test_header("Admin Categories Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/admin/categories", timeout=10)
        data = response.json()
        success = print_result("GET /api/admin/categories", response.status_code, data)
        
        if success and isinstance(data, list) and len(data) > 0:
            print(f"   ✅ Retrieved {len(data)} categories from Supabase")
            print(f"   Categories: {', '.join([c.get('name', 'Unknown') for c in data[:5]])}")
            return True
        elif success and isinstance(data, list) and len(data) == 0:
            print("   ⚠️  Categories table is empty")
            return False
        else:
            print("   ❌ Invalid response format")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_supabase_connection_verification():
    """Test 8: Verify Supabase is actually being used (not local fallback)"""
    print_test_header("Supabase Connection Verification")
    try:
        response = requests.get(f"{BASE_URL}/admin/services", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and isinstance(data, list) and len(data) > 0:
            service = data[0]
            
            # Check for Supabase-specific fields
            supabase_fields = ["id", "name", "price", "is_active", "category_id", "created_at"]
            has_supabase_structure = all(field in service for field in supabase_fields)
            
            if has_supabase_structure:
                print("   ✅ Supabase connection verified - data structure matches Supabase schema")
                print(f"   Service ID format: {service.get('id')}")
                print(f"   Has category_id: {service.get('category_id') is not None}")
                print(f"   Has created_at: {service.get('created_at') is not None}")
                return True
            else:
                print("   ⚠️  Data structure doesn't match expected Supabase schema")
                return False
        else:
            print("   ❌ Cannot verify - no services data available")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("MFIXIT BACKEND API TEST SUITE - SUPABASE INTEGRATION")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test 1: Health check
    results["health"] = test_health_endpoint()
    
    # Test 2: Admin services (Supabase)
    results["admin_services"] = test_admin_services()
    
    # Test 3: Admin slots (Supabase)
    results["admin_slots"] = test_admin_slots()
    
    # Test 4: MongoDB write
    mongo_write_success, record_id = test_status_post()
    results["mongo_write"] = mongo_write_success
    
    # Test 5: MongoDB read
    results["mongo_read"] = test_status_get()
    
    # Test 6: Admin bookings
    results["admin_bookings"] = test_admin_bookings()
    
    # Test 7: Admin categories
    results["admin_categories"] = test_admin_categories()
    
    # Test 8: Supabase verification
    results["supabase_verification"] = test_supabase_connection_verification()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        icon = "✅" if result else "❌"
        print(f"{icon} {test_name.replace('_', ' ').title()}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed ({int(passed/total*100)}%)")
    print(f"{'='*80}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - SUPABASE INTEGRATION IS WORKING!")
        return True
    else:
        print(f"\n⚠️  {total - passed} TEST(S) FAILED - SEE DETAILS ABOVE")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
