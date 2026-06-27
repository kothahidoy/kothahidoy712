#!/usr/bin/env python3
"""
Backend Test Suite for Admin CMS Services & Sub-categories
Tests the bug fix verification for Services and Sub-cats tabs showing all items
"""
import requests
import json
from typing import Dict, List, Optional

# Backend URL from frontend/.env
BASE_URL = "https://e4c35254-e028-4511-bfb7-afe989ad3bd9.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api/admin/cms"

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    test_results["tests"].append({
        "name": name,
        "passed": passed,
        "details": details
    })
    if passed:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1
    print(f"{status}: {name}")
    if details:
        print(f"  Details: {details}")

def test_get_services_all_salon_women():
    """Test 1: GET /api/admin/cms/services?category_id=salon-women should return 7 services"""
    print("\n" + "="*80)
    print("TEST 1: Get all services for salon-women category")
    print("="*80)
    
    try:
        response = requests.get(f"{API_BASE}/services?category_id=salon-women", timeout=15)
        
        if response.status_code != 200:
            log_test("GET services salon-women", False, f"Status {response.status_code}: {response.text[:200]}")
            return None
        
        services = response.json()
        
        # Check if we got 7 services
        if len(services) != 7:
            log_test("GET services salon-women count", False, f"Expected 7 services, got {len(services)}")
        else:
            log_test("GET services salon-women count", True, f"Got 7 services as expected")
        
        # Check if all services have sub_category_id populated
        services_without_subcat = [s for s in services if not s.get("sub_category_id")]
        if services_without_subcat:
            log_test("Services have sub_category_id", False, f"{len(services_without_subcat)} services missing sub_category_id")
        else:
            log_test("Services have sub_category_id", True, "All services have sub_category_id populated")
        
        # Print service details
        print("\nServices found:")
        for svc in services:
            print(f"  - {svc.get('title')} (₹{svc.get('starting_price')}) - sub_cat: {svc.get('sub_category_id')}")
        
        return services
        
    except Exception as e:
        log_test("GET services salon-women", False, f"Exception: {str(e)}")
        return None

def test_get_sub_categories_salon_women():
    """Test 2: GET /api/admin/cms/sub-categories?category_id=salon-women should return 6 sub-categories"""
    print("\n" + "="*80)
    print("TEST 2: Get all sub-categories for salon-women category")
    print("="*80)
    
    try:
        response = requests.get(f"{API_BASE}/sub-categories?category_id=salon-women", timeout=15)
        
        if response.status_code != 200:
            log_test("GET sub-categories salon-women", False, f"Status {response.status_code}: {response.text[:200]}")
            return None
        
        sub_cats = response.json()
        
        # Check if we got 6 sub-categories
        if len(sub_cats) != 6:
            log_test("GET sub-categories salon-women count", False, f"Expected 6 sub-categories, got {len(sub_cats)}")
        else:
            log_test("GET sub-categories salon-women count", True, f"Got 6 sub-categories as expected")
        
        # Print sub-category details
        print("\nSub-categories found:")
        for sc in sub_cats:
            print(f"  - {sc.get('name')} (id: {sc.get('id')})")
        
        return sub_cats
        
    except Exception as e:
        log_test("GET sub-categories salon-women", False, f"Exception: {str(e)}")
        return None

def test_get_services_filtered_by_subcat(sub_category_id: str):
    """Test 3: GET /api/admin/cms/services?category_id=salon-women&sub_category_id=<id>"""
    print("\n" + "="*80)
    print(f"TEST 3: Get services filtered by sub-category {sub_category_id}")
    print("="*80)
    
    try:
        response = requests.get(
            f"{API_BASE}/services?category_id=salon-women&sub_category_id={sub_category_id}",
            timeout=15
        )
        
        if response.status_code != 200:
            log_test(f"GET services filtered by sub-cat {sub_category_id}", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return None
        
        services = response.json()
        
        # Check that all returned services have the correct sub_category_id
        wrong_subcat = [s for s in services if s.get("sub_category_id") != sub_category_id]
        if wrong_subcat:
            log_test(f"Services filtered by sub-cat {sub_category_id}", False, 
                    f"{len(wrong_subcat)} services have wrong sub_category_id")
        else:
            log_test(f"Services filtered by sub-cat {sub_category_id}", True, 
                    f"All {len(services)} services have correct sub_category_id")
        
        print(f"\nServices in sub-category {sub_category_id}:")
        for svc in services:
            print(f"  - {svc.get('title')} (₹{svc.get('starting_price')})")
        
        return services
        
    except Exception as e:
        log_test(f"GET services filtered by sub-cat {sub_category_id}", False, f"Exception: {str(e)}")
        return None

def test_patch_service(service_id: str, original_title: str):
    """Test 4: PATCH /api/admin/cms/services/<id> - Update and revert"""
    print("\n" + "="*80)
    print(f"TEST 4: PATCH service {service_id}")
    print("="*80)
    
    try:
        # Update the service title
        new_title = f"{original_title} Updated"
        response = requests.patch(
            f"{API_BASE}/services/{service_id}",
            json={"title": new_title},
            timeout=15
        )
        
        if response.status_code not in (200, 204):
            log_test(f"PATCH service {service_id} (update)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return False
        
        log_test(f"PATCH service {service_id} (update)", True, f"Updated title to '{new_title}'")
        
        # Verify the update
        verify_response = requests.get(f"{API_BASE}/services?category_id=salon-women", timeout=15)
        if verify_response.status_code == 200:
            services = verify_response.json()
            updated_service = next((s for s in services if s.get("id") == service_id), None)
            if updated_service and updated_service.get("title") == new_title:
                log_test(f"PATCH service {service_id} (verify update)", True, "Title updated correctly")
            else:
                log_test(f"PATCH service {service_id} (verify update)", False, "Title not updated in database")
        
        # Revert the change
        revert_response = requests.patch(
            f"{API_BASE}/services/{service_id}",
            json={"title": original_title},
            timeout=15
        )
        
        if revert_response.status_code not in (200, 204):
            log_test(f"PATCH service {service_id} (revert)", False, 
                    f"Status {revert_response.status_code}: {revert_response.text[:200]}")
            return False
        
        log_test(f"PATCH service {service_id} (revert)", True, f"Reverted title to '{original_title}'")
        return True
        
    except Exception as e:
        log_test(f"PATCH service {service_id}", False, f"Exception: {str(e)}")
        return False

def test_create_and_delete_service(sub_category_id: str = None):
    """Test 5: POST and DELETE /api/admin/cms/services/<id>"""
    print("\n" + "="*80)
    print("TEST 5: POST (create) and DELETE service")
    print("="*80)
    
    temp_service_id = None
    
    try:
        # Create a temporary service
        temp_service = {
            "category_id": "salon-women",
            "sub_category_id": sub_category_id or "ffd723b0-72cb-43b5-b55b-86d08f279415",  # Waxing UUID
            "title": "TEST SERVICE - DELETE ME",
            "description": "Temporary test service",
            "starting_price": 99,
            "duration_mins": 15,
            "is_active": False  # Make it inactive so it doesn't show in frontend
        }
        
        create_response = requests.post(
            f"{API_BASE}/services",
            json=temp_service,
            timeout=15
        )
        
        if create_response.status_code not in (200, 201):
            log_test("POST service (create temp)", False, 
                    f"Status {create_response.status_code}: {create_response.text[:200]}")
            return False
        
        created_service = create_response.json()
        temp_service_id = created_service.get("id")
        
        log_test("POST service (create temp)", True, f"Created service with id: {temp_service_id}")
        
        # Delete the temporary service
        delete_response = requests.delete(
            f"{API_BASE}/services/{temp_service_id}",
            timeout=15
        )
        
        if delete_response.status_code not in (200, 204):
            log_test("DELETE service", False, 
                    f"Status {delete_response.status_code}: {delete_response.text[:200]}")
            return False
        
        log_test("DELETE service", True, f"Deleted service {temp_service_id}")
        
        # Verify deletion
        verify_response = requests.get(f"{API_BASE}/services?category_id=salon-women", timeout=15)
        if verify_response.status_code == 200:
            services = verify_response.json()
            deleted_service = next((s for s in services if s.get("id") == temp_service_id), None)
            if deleted_service:
                log_test("DELETE service (verify)", False, "Service still exists after deletion")
            else:
                log_test("DELETE service (verify)", True, "Service successfully deleted")
        
        return True
        
    except Exception as e:
        log_test("POST/DELETE service", False, f"Exception: {str(e)}")
        # Try to clean up if we created a service
        if temp_service_id:
            try:
                requests.delete(f"{API_BASE}/services/{temp_service_id}", timeout=15)
            except:
                pass
        return False

def test_patch_sub_category(sub_cat_id: str, original_name: str, category_id: str = "salon-women"):
    """Test 6: PATCH /api/admin/cms/sub-categories/<id> - Update and revert"""
    print("\n" + "="*80)
    print(f"TEST 6: PATCH sub-category {sub_cat_id}")
    print("="*80)
    
    try:
        # Update the sub-category name
        new_name = f"{original_name} Updated"
        response = requests.patch(
            f"{API_BASE}/sub-categories/{sub_cat_id}",
            json={"name": new_name, "category_id": category_id},
            timeout=15
        )
        
        if response.status_code not in (200, 204):
            log_test(f"PATCH sub-category {sub_cat_id} (update)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return False
        
        log_test(f"PATCH sub-category {sub_cat_id} (update)", True, f"Updated name to '{new_name}'")
        
        # Revert the change
        revert_response = requests.patch(
            f"{API_BASE}/sub-categories/{sub_cat_id}",
            json={"name": original_name, "category_id": category_id},
            timeout=15
        )
        
        if revert_response.status_code not in (200, 204):
            log_test(f"PATCH sub-category {sub_cat_id} (revert)", False, 
                    f"Status {revert_response.status_code}: {revert_response.text[:200]}")
            return False
        
        log_test(f"PATCH sub-category {sub_cat_id} (revert)", True, f"Reverted name to '{original_name}'")
        return True
        
    except Exception as e:
        log_test(f"PATCH sub-category {sub_cat_id}", False, f"Exception: {str(e)}")
        return False

def test_create_and_delete_sub_category():
    """Test 7: POST and DELETE /api/admin/cms/sub-categories/<id>"""
    print("\n" + "="*80)
    print("TEST 7: POST (create) and DELETE sub-category")
    print("="*80)
    
    temp_subcat_id = None
    
    try:
        # Create a temporary sub-category
        temp_subcat = {
            "category_id": "salon-women",
            "name": "TEST SUBCAT - DELETE ME",
            "slug": "test-subcat-delete-me",
            "is_active": False  # Make it inactive so it doesn't show in frontend
        }
        
        create_response = requests.post(
            f"{API_BASE}/sub-categories",
            json=temp_subcat,
            timeout=15
        )
        
        if create_response.status_code not in (200, 201):
            log_test("POST sub-category (create temp)", False, 
                    f"Status {create_response.status_code}: {create_response.text[:200]}")
            return False
        
        created_subcat = create_response.json()
        temp_subcat_id = created_subcat.get("id")
        
        log_test("POST sub-category (create temp)", True, f"Created sub-category with id: {temp_subcat_id}")
        
        # Delete the temporary sub-category
        delete_response = requests.delete(
            f"{API_BASE}/sub-categories/{temp_subcat_id}",
            timeout=15
        )
        
        if delete_response.status_code not in (200, 204):
            log_test("DELETE sub-category", False, 
                    f"Status {delete_response.status_code}: {delete_response.text[:200]}")
            return False
        
        log_test("DELETE sub-category", True, f"Deleted sub-category {temp_subcat_id}")
        
        # Verify deletion
        verify_response = requests.get(f"{API_BASE}/sub-categories?category_id=salon-women", timeout=15)
        if verify_response.status_code == 200:
            subcats = verify_response.json()
            deleted_subcat = next((s for s in subcats if s.get("id") == temp_subcat_id), None)
            if deleted_subcat:
                log_test("DELETE sub-category (verify)", False, "Sub-category still exists after deletion")
            else:
                log_test("DELETE sub-category (verify)", True, "Sub-category successfully deleted")
        
        return True
        
    except Exception as e:
        log_test("POST/DELETE sub-category", False, f"Exception: {str(e)}")
        # Try to clean up if we created a sub-category
        if temp_subcat_id:
            try:
                requests.delete(f"{API_BASE}/sub-categories/{temp_subcat_id}", timeout=15)
            except:
                pass
        return False

def test_all_categories():
    """Test 8: Verify all 9 categories return data without 500 errors"""
    print("\n" + "="*80)
    print("TEST 8: Test all 9 categories for 500 errors")
    print("="*80)
    
    categories = [
        "ac-appliance",
        "carpenter",
        "cleaning-pest",
        "electrician",
        "painting",
        "plumber",
        "salon-men",
        "salon-women",
        "insta-help"
    ]
    
    for cat_id in categories:
        try:
            # Test sub-categories endpoint
            subcat_response = requests.get(f"{API_BASE}/sub-categories?category_id={cat_id}", timeout=15)
            
            if subcat_response.status_code == 500:
                log_test(f"GET sub-categories {cat_id}", False, "500 Internal Server Error")
            elif subcat_response.status_code == 200:
                subcats = subcat_response.json()
                log_test(f"GET sub-categories {cat_id}", True, f"Returned {len(subcats)} sub-categories")
            else:
                log_test(f"GET sub-categories {cat_id}", False, f"Status {subcat_response.status_code}")
            
            # Test services endpoint
            services_response = requests.get(f"{API_BASE}/services?category_id={cat_id}", timeout=15)
            
            if services_response.status_code == 500:
                log_test(f"GET services {cat_id}", False, "500 Internal Server Error")
            elif services_response.status_code == 200:
                services = services_response.json()
                log_test(f"GET services {cat_id}", True, f"Returned {len(services)} services")
            else:
                log_test(f"GET services {cat_id}", False, f"Status {services_response.status_code}")
                
        except Exception as e:
            log_test(f"GET endpoints {cat_id}", False, f"Exception: {str(e)}")

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {test_results['passed'] + test_results['failed']}")
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    print(f"Success Rate: {test_results['passed'] / (test_results['passed'] + test_results['failed']) * 100:.1f}%")
    
    if test_results['failed'] > 0:
        print("\n" + "="*80)
        print("FAILED TESTS:")
        print("="*80)
        for test in test_results['tests']:
            if not test['passed']:
                print(f"❌ {test['name']}")
                if test['details']:
                    print(f"   {test['details']}")

def main():
    """Run all tests"""
    print("="*80)
    print("ADMIN CMS SERVICES & SUB-CATEGORIES BACKEND TEST SUITE")
    print("="*80)
    print(f"Backend URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    
    # Test 1: Get all services for salon-women
    services = test_get_services_all_salon_women()
    
    # Test 2: Get all sub-categories for salon-women
    sub_cats = test_get_sub_categories_salon_women()
    
    # Test 3: Get services filtered by sub-category (use first sub-cat if available)
    if sub_cats and len(sub_cats) > 0:
        test_get_services_filtered_by_subcat(sub_cats[0].get("id"))
    
    # Test 4: PATCH service (use "Cleanup" service if available)
    if services:
        cleanup_service = next((s for s in services if "Cleanup" in s.get("title", "")), None)
        if cleanup_service:
            test_patch_service(cleanup_service.get("id"), cleanup_service.get("title"))
        else:
            # Use first service if Cleanup not found
            test_patch_service(services[0].get("id"), services[0].get("title"))
    
    # Test 5: POST and DELETE service
    test_create_and_delete_service()
    
    # Test 6: PATCH sub-category (use first sub-cat if available)
    if sub_cats and len(sub_cats) > 0:
        test_patch_sub_category(sub_cats[0].get("id"), sub_cats[0].get("name"))
    
    # Test 7: POST and DELETE sub-category
    test_create_and_delete_sub_category()
    
    # Test 8: Test all categories
    test_all_categories()
    
    # Print summary
    print_summary()
    
    # Return exit code based on test results
    return 0 if test_results['failed'] == 0 else 1

if __name__ == "__main__":
    exit(main())
