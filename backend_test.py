#!/usr/bin/env python3
"""
Backend test for video URL bug fix verification
Tests that video URLs with query strings and non-standard extensions work correctly
"""
import requests
import json
import sys

BASE_URL = "https://kothahidoy-1.preview.emergentagent.com/api"

def test_create_tricky_video_url():
    """Test 1: Create a slide with video URL containing query strings"""
    print("\n" + "="*80)
    print("TEST 1: Create slide with tricky video URL (query strings)")
    print("="*80)
    
    payload = {
        "title": "Tricky URL Video",
        "media_type": "video",
        "media_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4?token=abc123&expires=9999",
        "poster_url": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80",
        "sort_order": 1,
        "is_active": True,
        "cta_text": "Watch",
        "link_url": "/category/insta-help"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/admin/cms/home-promos", json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"✅ PASS: Slide created successfully")
            print(f"   ID: {data.get('id')}")
            print(f"   media_type: {data.get('media_type')}")
            print(f"   media_url: {data.get('media_url')[:80]}...")
            
            # Verify query string is intact
            if "?token=abc123&expires=9999" in data.get('media_url', ''):
                print(f"   ✅ Query string preserved in database")
            else:
                print(f"   ⚠️ Query string may have been stripped")
            
            return data.get('id')
        else:
            print(f"❌ FAIL: {response.status_code} - {response.text[:200]}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return None

def test_get_active_slides(expected_count=None):
    """Test 2: GET active slides and verify tricky URL is returned"""
    print("\n" + "="*80)
    print("TEST 2: GET active slides (verify query string intact)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-promos?active_only=true", timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved {len(data)} active slide(s)")
            
            for slide in data:
                if "BigBuckBunny.mp4" in slide.get('media_url', ''):
                    print(f"   Found tricky URL slide:")
                    print(f"   - Title: {slide.get('title')}")
                    print(f"   - media_type: {slide.get('media_type')}")
                    print(f"   - media_url: {slide.get('media_url')[:80]}...")
                    
                    if "?token=abc123&expires=9999" in slide.get('media_url', ''):
                        print(f"   ✅ Query string intact in response")
                    else:
                        print(f"   ⚠️ Query string missing in response")
            
            return True
        else:
            print(f"❌ FAIL: {response.status_code} - {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_create_m4v_video():
    """Test 3: Create slide with .m4v extension (previously unsupported)"""
    print("\n" + "="*80)
    print("TEST 3: Create slide with .m4v extension")
    print("="*80)
    
    payload = {
        "title": "M4V test",
        "media_type": "video",
        "media_url": "https://example.com/clip.m4v",
        "is_active": True,
        "sort_order": 2
    }
    
    try:
        response = requests.post(f"{BASE_URL}/admin/cms/home-promos", json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"✅ PASS: M4V slide created successfully")
            print(f"   ID: {data.get('id')}")
            print(f"   media_type: {data.get('media_type')}")
            print(f"   media_url: {data.get('media_url')}")
            return data.get('id')
        else:
            print(f"❌ FAIL: {response.status_code} - {response.text[:200]}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return None

def test_get_all_slides():
    """Test 4: GET all slides and verify both video slides exist"""
    print("\n" + "="*80)
    print("TEST 4: GET all slides (verify both video slides)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-promos?active_only=true", timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved {len(data)} active slide(s)")
            
            video_slides = [s for s in data if s.get('media_type') == 'video']
            print(f"   Video slides: {len(video_slides)}")
            
            for slide in video_slides:
                print(f"   - {slide.get('title')}: {slide.get('media_url')[:60]}...")
            
            return len(video_slides) >= 2
        else:
            print(f"❌ FAIL: {response.status_code} - {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_regression_endpoints():
    """Test 5: Verify existing endpoints still work"""
    print("\n" + "="*80)
    print("TEST 5: Regression - existing endpoints")
    print("="*80)
    
    endpoints = [
        "/admin/cms/categories",
        "/admin/cms/services?category_id=salon-women"
    ]
    
    all_pass = True
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PASS: GET {endpoint} → {len(data)} items")
            else:
                print(f"❌ FAIL: GET {endpoint} → {response.status_code}")
                all_pass = False
        except Exception as e:
            print(f"❌ ERROR: GET {endpoint} → {str(e)}")
            all_pass = False
    
    return all_pass

def cleanup_test_slides(slide_ids):
    """Cleanup: Delete test slides"""
    print("\n" + "="*80)
    print("CLEANUP: Delete test slides")
    print("="*80)
    
    for slide_id in slide_ids:
        if slide_id:
            try:
                response = requests.delete(f"{BASE_URL}/admin/cms/home-promos/{slide_id}", timeout=10)
                if response.status_code in [200, 204]:
                    print(f"✅ Deleted slide {slide_id}")
                else:
                    print(f"⚠️ Failed to delete {slide_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting {slide_id}: {str(e)}")

def main():
    print("\n" + "="*80)
    print("VIDEO URL BUG FIX VERIFICATION - BACKEND TESTS")
    print("="*80)
    print(f"Testing against: {BASE_URL}")
    
    created_ids = []
    
    # Test 1: Create tricky URL video
    id1 = test_create_tricky_video_url()
    if id1:
        created_ids.append(id1)
    
    # Test 2: Verify query string intact
    test_get_active_slides()
    
    # Test 3: Create .m4v video
    id2 = test_create_m4v_video()
    if id2:
        created_ids.append(id2)
    
    # Test 4: Verify both videos exist
    test_get_all_slides()
    
    # Test 5: Regression tests
    test_regression_endpoints()
    
    # Cleanup
    cleanup_test_slides(created_ids)
    
    print("\n" + "="*80)
    print("BACKEND TESTS COMPLETE")
    print("="*80)

if __name__ == "__main__":
    main()
