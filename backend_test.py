#!/usr/bin/env python3
"""
Backend API Test Suite for Home Promo Slides CMS Endpoints
Tests the new /api/admin/cms/home-promos endpoints
"""
import requests
import json
from typing import Dict, Any, List

# Base URL from frontend/.env
BASE_URL = "https://b6bd46d6-2913-47fd-bed1-fe975bf8d877.preview.emergentagent.com/api"

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

def test_get_home_promos():
    """Test 1: GET /api/admin/cms/home-promos"""
    print("\n" + "="*80)
    print("TEST 1: GET /api/admin/cms/home-promos")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-promos", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("GET /api/admin/cms/home-promos", True, 
                        f"Returns array with {len(data)} items")
                return data
            else:
                log_test("GET /api/admin/cms/home-promos", False, 
                        f"Expected array, got {type(data)}")
                return None
        else:
            log_test("GET /api/admin/cms/home-promos", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return None
    except Exception as e:
        log_test("GET /api/admin/cms/home-promos", False, f"Exception: {str(e)}")
        return None

def test_get_home_promos_active_only():
    """Test 2: GET /api/admin/cms/home-promos?active_only=true"""
    print("\n" + "="*80)
    print("TEST 2: GET /api/admin/cms/home-promos?active_only=true")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-promos?active_only=true", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # Verify all items have is_active=true
                all_active = all(item.get("is_active", False) for item in data)
                if all_active or len(data) == 0:
                    log_test("GET /api/admin/cms/home-promos?active_only=true", True, 
                            f"Returns {len(data)} active items")
                else:
                    log_test("GET /api/admin/cms/home-promos?active_only=true", False, 
                            "Some items have is_active=false")
                return data
            else:
                log_test("GET /api/admin/cms/home-promos?active_only=true", False, 
                        f"Expected array, got {type(data)}")
                return None
        else:
            log_test("GET /api/admin/cms/home-promos?active_only=true", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return None
    except Exception as e:
        log_test("GET /api/admin/cms/home-promos?active_only=true", False, f"Exception: {str(e)}")
        return None

def test_create_image_slide():
    """Test 3: POST /api/admin/cms/home-promos (image slide)"""
    print("\n" + "="*80)
    print("TEST 3: POST /api/admin/cms/home-promos (image slide)")
    print("="*80)
    
    payload = {
        "title": "Test InstaHelp",
        "subtitle": "sub",
        "price": "₹79",
        "original_price": "₹245",
        "discount_label": "68% OFF",
        "badge_emoji": "🏷️",
        "cta_text": "Book now",
        "link_url": "/category/insta-help",
        "media_type": "image",
        "media_url": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80",
        "sort_order": 1,
        "is_active": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/admin/cms/home-promos",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code in (200, 201):
            data = response.json()
            if "id" in data:
                log_test("POST /api/admin/cms/home-promos (image)", True, 
                        f"Created slide with ID: {data['id']}")
                return data
            else:
                log_test("POST /api/admin/cms/home-promos (image)", False, 
                        "Response missing 'id' field")
                return None
        else:
            log_test("POST /api/admin/cms/home-promos (image)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return None
    except Exception as e:
        log_test("POST /api/admin/cms/home-promos (image)", False, f"Exception: {str(e)}")
        return None

def test_update_slide(slide_id: str):
    """Test 4: PATCH /api/admin/cms/home-promos/{id}"""
    print("\n" + "="*80)
    print(f"TEST 4: PATCH /api/admin/cms/home-promos/{slide_id}")
    print("="*80)
    
    payload = {
        "title": "Updated InstaHelp",
        "media_url": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80",
        "is_active": False
    }
    
    try:
        response = requests.patch(
            f"{BASE_URL}/admin/cms/home-promos/{slide_id}",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                log_test(f"PATCH /api/admin/cms/home-promos/{slide_id}", True, 
                        "Update successful")
                return True
            else:
                log_test(f"PATCH /api/admin/cms/home-promos/{slide_id}", False, 
                        f"Unexpected response: {data}")
                return False
        else:
            log_test(f"PATCH /api/admin/cms/home-promos/{slide_id}", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        log_test(f"PATCH /api/admin/cms/home-promos/{slide_id}", False, f"Exception: {str(e)}")
        return False

def test_verify_update(slide_id: str):
    """Test 5: Verify update by GET"""
    print("\n" + "="*80)
    print(f"TEST 5: Verify update - GET /api/admin/cms/home-promos")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-promos", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            slide = next((s for s in data if s.get("id") == slide_id), None)
            
            if slide:
                title_correct = slide.get("title") == "Updated InstaHelp"
                active_correct = slide.get("is_active") == False
                
                if title_correct and active_correct:
                    log_test("Verify update (title and is_active)", True, 
                            f"title='Updated InstaHelp', is_active=False")
                    return True
                else:
                    log_test("Verify update (title and is_active)", False, 
                            f"title={slide.get('title')}, is_active={slide.get('is_active')}")
                    return False
            else:
                log_test("Verify update (title and is_active)", False, 
                        f"Slide {slide_id} not found")
                return False
        else:
            log_test("Verify update (title and is_active)", False, 
                    f"Status {response.status_code}")
            return False
    except Exception as e:
        log_test("Verify update (title and is_active)", False, f"Exception: {str(e)}")
        return False

def test_create_video_slide():
    """Test 6: POST /api/admin/cms/home-promos (video slide)"""
    print("\n" + "="*80)
    print("TEST 6: POST /api/admin/cms/home-promos (video slide)")
    print("="*80)
    
    payload = {
        "title": "Video promo",
        "media_type": "video",
        "media_url": "https://example.com/test.mp4",
        "poster_url": "https://example.com/poster.jpg",
        "sort_order": 2,
        "is_active": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/admin/cms/home-promos",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code in (200, 201):
            data = response.json()
            if "id" in data and data.get("media_type") == "video":
                log_test("POST /api/admin/cms/home-promos (video)", True, 
                        f"Created video slide with ID: {data['id']}")
                return data
            else:
                log_test("POST /api/admin/cms/home-promos (video)", False, 
                        f"Response missing 'id' or media_type != 'video'")
                return None
        else:
            log_test("POST /api/admin/cms/home-promos (video)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return None
    except Exception as e:
        log_test("POST /api/admin/cms/home-promos (video)", False, f"Exception: {str(e)}")
        return None

def test_active_only_after_update():
    """Test 7: GET ?active_only=true should only return video slide"""
    print("\n" + "="*80)
    print("TEST 7: GET /api/admin/cms/home-promos?active_only=true (after update)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-promos?active_only=true", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            # Should only return active slides (video slide, not the image slide we set to inactive)
            active_count = len(data)
            has_video = any(s.get("media_type") == "video" for s in data)
            has_inactive_image = any(s.get("title") == "Updated InstaHelp" for s in data)
            
            if has_video and not has_inactive_image:
                log_test("GET ?active_only=true (filters correctly)", True, 
                        f"Returns {active_count} active slides, includes video, excludes inactive image")
                return True
            else:
                log_test("GET ?active_only=true (filters correctly)", False, 
                        f"has_video={has_video}, has_inactive_image={has_inactive_image}")
                return False
        else:
            log_test("GET ?active_only=true (filters correctly)", False, 
                    f"Status {response.status_code}")
            return False
    except Exception as e:
        log_test("GET ?active_only=true (filters correctly)", False, f"Exception: {str(e)}")
        return False

def test_delete_slide(slide_id: str, slide_type: str):
    """Test 8: DELETE /api/admin/cms/home-promos/{id}"""
    print("\n" + "="*80)
    print(f"TEST 8: DELETE /api/admin/cms/home-promos/{slide_id} ({slide_type})")
    print("="*80)
    
    try:
        response = requests.delete(f"{BASE_URL}/admin/cms/home-promos/{slide_id}", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                log_test(f"DELETE /api/admin/cms/home-promos/{slide_id} ({slide_type})", True, 
                        "Delete successful")
                return True
            else:
                log_test(f"DELETE /api/admin/cms/home-promos/{slide_id} ({slide_type})", False, 
                        f"Unexpected response: {data}")
                return False
        else:
            log_test(f"DELETE /api/admin/cms/home-promos/{slide_id} ({slide_type})", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        log_test(f"DELETE /api/admin/cms/home-promos/{slide_id} ({slide_type})", False, 
                f"Exception: {str(e)}")
        return False

def test_verify_cleanup(initial_count: int):
    """Test 9: Verify cleanup - count should return to initial"""
    print("\n" + "="*80)
    print("TEST 9: Verify cleanup - GET /api/admin/cms/home-promos")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-promos", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            current_count = len(data)
            
            if current_count == initial_count:
                log_test("Verify cleanup (count matches initial)", True, 
                        f"Count returned to {initial_count}")
                return True
            else:
                log_test("Verify cleanup (count matches initial)", False, 
                        f"Expected {initial_count}, got {current_count}")
                return False
        else:
            log_test("Verify cleanup (count matches initial)", False, 
                    f"Status {response.status_code}")
            return False
    except Exception as e:
        log_test("Verify cleanup (count matches initial)", False, f"Exception: {str(e)}")
        return False

def test_regression_categories():
    """Test 10: Regression - GET /api/admin/cms/categories"""
    print("\n" + "="*80)
    print("TEST 10: REGRESSION - GET /api/admin/cms/categories")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/categories", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= 9:
                log_test("GET /api/admin/cms/categories (regression)", True, 
                        f"Returns {len(data)} categories (expected ~9)")
                return True
            else:
                log_test("GET /api/admin/cms/categories (regression)", False, 
                        f"Expected array with ~9 items, got {len(data) if isinstance(data, list) else type(data)}")
                return False
        else:
            log_test("GET /api/admin/cms/categories (regression)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        log_test("GET /api/admin/cms/categories (regression)", False, f"Exception: {str(e)}")
        return False

def test_regression_banners():
    """Test 11: Regression - GET /api/admin/cms/banners?category_id=salon-women"""
    print("\n" + "="*80)
    print("TEST 11: REGRESSION - GET /api/admin/cms/banners?category_id=salon-women")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/banners?category_id=salon-women", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("GET /api/admin/cms/banners?category_id=salon-women (regression)", True, 
                        f"Returns array with {len(data)} banners")
                return True
            else:
                log_test("GET /api/admin/cms/banners?category_id=salon-women (regression)", False, 
                        f"Expected array, got {type(data)}")
                return False
        else:
            log_test("GET /api/admin/cms/banners?category_id=salon-women (regression)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        log_test("GET /api/admin/cms/banners?category_id=salon-women (regression)", False, 
                f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("HOME PROMO SLIDES CMS ENDPOINTS TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    # Track created slide IDs for cleanup
    image_slide_id = None
    video_slide_id = None
    
    # Test 1: Get initial state
    initial_slides = test_get_home_promos()
    initial_count = len(initial_slides) if initial_slides is not None else 0
    
    # Test 2: Get active only
    test_get_home_promos_active_only()
    
    # Test 3: Create image slide
    image_slide = test_create_image_slide()
    if image_slide:
        image_slide_id = image_slide.get("id")
    
    # Test 4: Update slide
    if image_slide_id:
        test_update_slide(image_slide_id)
        
        # Test 5: Verify update
        test_verify_update(image_slide_id)
    
    # Test 6: Create video slide
    video_slide = test_create_video_slide()
    if video_slide:
        video_slide_id = video_slide.get("id")
    
    # Test 7: Get active only (should only return video slide)
    test_active_only_after_update()
    
    # Test 8: Delete slides (cleanup)
    if image_slide_id:
        test_delete_slide(image_slide_id, "image")
    if video_slide_id:
        test_delete_slide(video_slide_id, "video")
    
    # Test 9: Verify cleanup
    test_verify_cleanup(initial_count)
    
    # Test 10-11: Regression tests
    test_regression_categories()
    test_regression_banners()
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {test_results['passed'] + test_results['failed']}")
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    print("="*80)
    
    # Print detailed results
    print("\nDETAILED RESULTS:")
    print("-"*80)
    for test in test_results["tests"]:
        status = "✅ PASS" if test["passed"] else "❌ FAIL"
        print(f"{status}: {test['name']}")
        if test["details"]:
            print(f"  → {test['details']}")
    
    print("\n" + "="*80)
    if test_results["failed"] == 0:
        print("🎉 ALL TESTS PASSED!")
    else:
        print(f"⚠️  {test_results['failed']} TEST(S) FAILED")
    print("="*80)

if __name__ == "__main__":
    main()
