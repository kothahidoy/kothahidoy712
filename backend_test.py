#!/usr/bin/env python3
"""
Backend test for service detail extra fields (gallery, loveus, process step image_url).

Test the new editable service-detail fields added to /app/backend/service_detail_routes.py.

Service ID: svc-14fca0482d (category salon-women)
Backend URL: http://localhost:8001
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8001"
SERVICE_ID = "svc-14fca0482d"

def print_test(step_num, description):
    print(f"\n{'='*80}")
    print(f"TEST {step_num}: {description}")
    print('='*80)

def print_result(passed, message):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {message}")

def test_step_1():
    """GET /api/admin/services/{service_id}/detail - must return 200 with service, variants, reviews"""
    print_test(1, "GET admin service detail endpoint")
    
    url = f"{BASE_URL}/api/admin/services/{SERVICE_ID}/detail"
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            has_service = "service" in data
            has_variants = "variants" in data
            has_reviews = "reviews" in data
            
            print(f"Response keys: {list(data.keys())}")
            if has_service:
                print(f"Service ID: {data['service'].get('id')}")
                print(f"Service title: {data['service'].get('title')}")
            
            if has_service and has_variants and has_reviews:
                print_result(True, "Admin detail endpoint returns correct structure")
                return True
            else:
                print_result(False, f"Missing keys - service:{has_service}, variants:{has_variants}, reviews:{has_reviews}")
                return False
        else:
            print(f"Response: {response.text[:500]}")
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_2():
    """PUT with process_steps including image_url - should work because process_steps is JSONB"""
    print_test(2, "PUT with process_steps containing image_url")
    
    url = f"{BASE_URL}/api/admin/services/{SERVICE_ID}/detail"
    print(f"URL: {url}")
    
    payload = {
        "process_steps": [
            {
                "step": 1,
                "title": "Inspection",
                "description": "Initial check",
                "image_url": "https://example.com/step1.jpg"
            },
            {
                "step": 2,
                "title": "Cleaning",
                "description": "Deep clean",
                "image_url": ""
            }
        ]
    }
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.put(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            # Now GET to verify the image_url was saved
            get_response = requests.get(url, timeout=10)
            if get_response.status_code == 200:
                data = get_response.json()
                process_steps = data.get("service", {}).get("process_steps", [])
                
                if process_steps and len(process_steps) > 0:
                    first_step = process_steps[0]
                    image_url = first_step.get("image_url", "")
                    
                    print(f"\nVerification GET:")
                    print(f"First process step: {json.dumps(first_step, indent=2)}")
                    
                    if image_url == "https://example.com/step1.jpg":
                        print_result(True, "Process step image_url saved and retrieved correctly")
                        return True
                    else:
                        print_result(False, f"Expected image_url 'https://example.com/step1.jpg', got '{image_url}'")
                        return False
                else:
                    print_result(False, "No process_steps found in GET response")
                    return False
            else:
                print_result(False, f"Verification GET failed with status {get_response.status_code}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_3():
    """PUT with new fields - should return 500 with PGRST204 error (migration not applied)"""
    print_test(3, "PUT with new fields (gallery_title, gallery_images, loveus_title, loveus_items)")
    
    url = f"{BASE_URL}/api/admin/services/{SERVICE_ID}/detail"
    print(f"URL: {url}")
    
    payload = {
        "gallery_title": "Glow like never before",
        "gallery_images": [
            {
                "image_url": "https://a.jpg",
                "badge": "Radiant"
            }
        ],
        "loveus_title": "Why women love us",
        "loveus_items": [
            {
                "icon": "heart",
                "color": "#DB2777",
                "title": "4.9★",
                "description": "Happy customers"
            }
        ]
    }
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.put(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 500:
            response_text = response.text.lower()
            # Check for PostgREST PGRST204 error about missing column
            if "pgrst204" in response_text or "could not find" in response_text:
                if "gallery_images" in response_text or "gallery_title" in response_text or "loveus" in response_text:
                    print_result(True, "Expected PGRST204 error for missing columns (migration not applied)")
                    return True
                else:
                    print_result(False, "Got 500 error but not about the expected missing columns")
                    return False
            else:
                print_result(False, "Got 500 error but not a PostgREST schema cache error")
                return False
        else:
            print_result(False, f"Expected 500 with PGRST204 error, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_4():
    """GET public /api/services/{service_id}/detail - should return 200 with process_steps including image_url"""
    print_test(4, "GET public service detail endpoint")
    
    url = f"{BASE_URL}/api/services/{SERVICE_ID}/detail"
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            process_steps = data.get("service", {}).get("process_steps", [])
            
            print(f"Response keys: {list(data.keys())}")
            print(f"Process steps count: {len(process_steps)}")
            
            if process_steps and len(process_steps) > 0:
                first_step = process_steps[0]
                print(f"First process step: {json.dumps(first_step, indent=2)}")
                
                # Check if image_url field exists (from step 2)
                if "image_url" in first_step:
                    print_result(True, "Public endpoint returns process_steps with image_url field")
                    return True
                else:
                    print_result(False, "Process step missing image_url field")
                    return False
            else:
                print_result(False, "No process_steps found in response")
                return False
        else:
            print(f"Response: {response.text[:500]}")
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_step_5():
    """POST review and DELETE review - verify review endpoints work"""
    print_test(5, "POST review and DELETE review")
    
    # POST review
    post_url = f"{BASE_URL}/api/admin/services/{SERVICE_ID}/reviews"
    print(f"POST URL: {post_url}")
    
    review_payload = {
        "customer_name": "Test",
        "rating": 5,
        "review_text": "Great",
        "is_published": True
    }
    
    print(f"Review payload: {json.dumps(review_payload, indent=2)}")
    
    try:
        # Create review
        post_response = requests.post(post_url, json=review_payload, timeout=10)
        print(f"POST Status Code: {post_response.status_code}")
        print(f"POST Response: {post_response.text[:500]}")
        
        if post_response.status_code == 201:
            review_data = post_response.json()
            review_id = review_data.get("id")
            
            if not review_id:
                print_result(False, "Review created but no ID returned")
                return False
            
            print(f"Review created with ID: {review_id}")
            
            # Delete review to keep DB clean
            delete_url = f"{BASE_URL}/api/admin/services/{SERVICE_ID}/reviews/{review_id}"
            print(f"\nDELETE URL: {delete_url}")
            
            delete_response = requests.delete(delete_url, timeout=10)
            print(f"DELETE Status Code: {delete_response.status_code}")
            print(f"DELETE Response: {delete_response.text[:500]}")
            
            if delete_response.status_code in (200, 204):
                print_result(True, "Review created (201) and deleted successfully")
                return True
            else:
                print_result(False, f"Review created but delete failed with status {delete_response.status_code}")
                return False
        else:
            print_result(False, f"Expected 201, got {post_response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "="*80)
    print("SERVICE DETAIL EXTRA FIELDS - BACKEND TEST")
    print("="*80)
    print(f"Backend URL: {BASE_URL}")
    print(f"Service ID: {SERVICE_ID}")
    
    results = []
    
    # Run all tests
    results.append(("Step 1: GET admin detail", test_step_1()))
    results.append(("Step 2: PUT process_steps with image_url", test_step_2()))
    results.append(("Step 3: PUT new fields (expect PGRST204)", test_step_3()))
    results.append(("Step 4: GET public detail", test_step_4()))
    results.append(("Step 5: POST and DELETE review", test_step_5()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
