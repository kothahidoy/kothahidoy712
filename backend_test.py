"""
Backend API Test Suite for Reverse Geocoding Endpoint
======================================================
Tests the NEW GET /api/geo/reverse endpoint
"""
import requests
import time
import json

# Backend URL from frontend/.env
BASE_URL = "https://koro-deploy.preview.emergentagent.com"

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(passed, message):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {message}")

def test_valid_coords_durgapur():
    """Test Case 1a: Valid coordinates in West Bengal (Durgapur)"""
    print_test_header("Valid Coordinates - Durgapur (lat=23.5204, lon=87.3119)")
    
    url = f"{BASE_URL}/api/geo/reverse"
    params = {"lat": 23.5204, "lon": 87.3119}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response JSON:\n{json.dumps(data, indent=2)}")
        
        # Verify all required fields are present
        required_fields = ["name", "area", "road", "city", "state", "pincode", 
                          "address_line", "display_name", "label", "latitude", "longitude"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing required fields: {missing_fields}")
            return False
        
        # Verify name is a real place name (not empty, not pure numbers, not plus-code)
        name = data.get("name", "")
        if not name:
            print_result(False, "Name field is empty")
            return False
        
        if name.isdigit():
            print_result(False, f"Name is pure numbers: {name}")
            return False
        
        # Check for plus-code pattern (e.g., "VGCQ+R5J")
        if "+" in name and len(name) < 15:
            print_result(False, f"Name appears to be a plus-code: {name}")
            return False
        
        # Verify display_name contains state/pincode/India
        display_name = data.get("display_name", "")
        if "India" not in display_name:
            print_result(False, f"display_name doesn't contain 'India': {display_name}")
            return False
        
        # Verify coordinates are returned
        if data.get("latitude") != 23.5204 or data.get("longitude") != 87.3119:
            print_result(False, f"Coordinates mismatch: lat={data.get('latitude')}, lon={data.get('longitude')}")
            return False
        
        print_result(True, f"Valid response with name='{name}', display_name contains India")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_valid_coords_kolkata():
    """Test Case 1b: Valid coordinates in West Bengal (Kolkata)"""
    print_test_header("Valid Coordinates - Kolkata (lat=22.5726, lon=88.3639)")
    
    url = f"{BASE_URL}/api/geo/reverse"
    params = {"lat": 22.5726, "lon": 88.3639}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response JSON:\n{json.dumps(data, indent=2)}")
        
        # Verify all required fields are present
        required_fields = ["name", "area", "road", "city", "state", "pincode", 
                          "address_line", "display_name", "label", "latitude", "longitude"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing required fields: {missing_fields}")
            return False
        
        # Verify name is a real place name
        name = data.get("name", "")
        if not name:
            print_result(False, "Name field is empty")
            return False
        
        if name.isdigit():
            print_result(False, f"Name is pure numbers: {name}")
            return False
        
        if "+" in name and len(name) < 15:
            print_result(False, f"Name appears to be a plus-code: {name}")
            return False
        
        # Verify display_name contains India
        display_name = data.get("display_name", "")
        if "India" not in display_name:
            print_result(False, f"display_name doesn't contain 'India': {display_name}")
            return False
        
        print_result(True, f"Valid response with name='{name}', display_name contains India")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_cache_functionality():
    """Test Case 2: Cache - call same coords twice"""
    print_test_header("Cache Test - Same Coordinates Twice")
    
    url = f"{BASE_URL}/api/geo/reverse"
    params = {"lat": 23.5204, "lon": 87.3119}
    
    try:
        # First call
        print("First call...")
        start1 = time.time()
        response1 = requests.get(url, params=params, timeout=10)
        duration1 = time.time() - start1
        
        if response1.status_code != 200:
            print_result(False, f"First call failed with status {response1.status_code}")
            return False
        
        data1 = response1.json()
        print(f"First call duration: {duration1:.3f}s")
        print(f"First call response: {json.dumps(data1, indent=2)}")
        
        # Second call (should be cached)
        print("\nSecond call (should be cached)...")
        start2 = time.time()
        response2 = requests.get(url, params=params, timeout=10)
        duration2 = time.time() - start2
        
        if response2.status_code != 200:
            print_result(False, f"Second call failed with status {response2.status_code}")
            return False
        
        data2 = response2.json()
        print(f"Second call duration: {duration2:.3f}s")
        
        # Verify payloads are identical
        if data1 != data2:
            print_result(False, "Payloads are not identical")
            print(f"Diff: First={data1}, Second={data2}")
            return False
        
        # Second call should be faster (cached), but we won't enforce this strictly
        # as network latency can vary
        print_result(True, f"Both calls returned 200 with identical payload (durations: {duration1:.3f}s, {duration2:.3f}s)")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_validation_invalid_lat():
    """Test Case 3a: Validation - invalid latitude (lat=999)"""
    print_test_header("Validation Test - Invalid Latitude (lat=999, lon=88)")
    
    url = f"{BASE_URL}/api/geo/reverse"
    params = {"lat": 999, "lon": 88}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 422:
            print_result(False, f"Expected 422 (Unprocessable Entity), got {response.status_code}")
            return False
        
        print_result(True, "Correctly returned 422 for invalid latitude")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_validation_missing_params():
    """Test Case 3b: Validation - missing parameters"""
    print_test_header("Validation Test - Missing Parameters")
    
    url = f"{BASE_URL}/api/geo/reverse"
    
    try:
        # Missing both lat and lon
        print("Test 3b.1: Missing both lat and lon")
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 422:
            print_result(False, f"Expected 422, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        print_result(True, "Correctly returned 422 for missing parameters")
        
        # Missing lon only
        print("\nTest 3b.2: Missing lon parameter")
        response = requests.get(url, params={"lat": 23.5}, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 422:
            print_result(False, f"Expected 422, got {response.status_code}")
            return False
        
        print_result(True, "Correctly returned 422 for missing lon")
        
        # Missing lat only
        print("\nTest 3b.3: Missing lat parameter")
        response = requests.get(url, params={"lon": 88.3}, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 422:
            print_result(False, f"Expected 422, got {response.status_code}")
            return False
        
        print_result(True, "Correctly returned 422 for missing lat")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_regression_root_endpoint():
    """Test Case 4a: Regression - GET /api/ (Hello World)"""
    print_test_header("Regression Test - GET /api/ (Hello World)")
    
    url = f"{BASE_URL}/api/"
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        if data.get("message") != "Hello World":
            print_result(False, f"Expected 'Hello World', got {data}")
            return False
        
        print_result(True, "Root endpoint still working correctly")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_regression_welcome_screen():
    """Test Case 4b: Regression - GET /api/admin/cms/welcome-screen"""
    print_test_header("Regression Test - GET /api/admin/cms/welcome-screen")
    
    url = f"{BASE_URL}/api/admin/cms/welcome-screen"
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response JSON:\n{json.dumps(data, indent=2)}")
        
        print_result(True, "Welcome screen endpoint still working correctly")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests and print summary"""
    print("\n" + "="*80)
    print("REVERSE GEOCODING ENDPOINT TEST SUITE")
    print("="*80)
    print(f"Backend URL: {BASE_URL}")
    print(f"Endpoint: GET /api/geo/reverse?lat=<float>&lon=<float>")
    
    results = {
        "Test 1a: Valid Coords - Durgapur": test_valid_coords_durgapur(),
        "Test 1b: Valid Coords - Kolkata": test_valid_coords_kolkata(),
        "Test 2: Cache Functionality": test_cache_functionality(),
        "Test 3a: Validation - Invalid Lat": test_validation_invalid_lat(),
        "Test 3b: Validation - Missing Params": test_validation_missing_params(),
        "Test 4a: Regression - Root Endpoint": test_regression_root_endpoint(),
        "Test 4b: Regression - Welcome Screen": test_regression_welcome_screen(),
    }
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed ({passed*100//total}%)")
    print(f"{'='*80}\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
