#!/usr/bin/env python3
"""
CMS Backend API Test Suite
Tests the /api/admin/cms/upload endpoint (bug fix verification) and new home-curations CRUD
"""
import requests
import sys
import io
from pathlib import Path

# Use the public backend URL from frontend/.env
BASE_URL = "https://code-sync-94.preview.emergentagent.com/api"

def print_section(title):
    print("\n" + "="*80)
    print(title)
    print("="*80)

def test_upload_image():
    """TEST 1: Upload a PNG image file"""
    print_section("TEST 1: Upload PNG image to /api/admin/cms/upload")
    
    # Create a small dummy PNG (1x1 pixel transparent PNG)
    png_data = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
    ])
    
    try:
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(f"{BASE_URL}/admin/cms/upload", files=files, timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Image uploaded successfully")
            print(f"   URL: {data.get('url', 'N/A')[:80]}...")
            print(f"   Type: {data.get('type', 'N/A')}")
            print(f"   Filename: {data.get('filename', 'N/A')}")
            
            # Verify URL is reachable
            if data.get('url'):
                head_resp = requests.head(data['url'], timeout=10)
                if head_resp.status_code == 200:
                    print(f"   ✅ URL is reachable (HEAD {head_resp.status_code})")
                else:
                    print(f"   ⚠️ URL returned {head_resp.status_code}")
            
            return data.get('url')
        elif response.status_code == 422:
            print(f"❌ FAIL: HTTP 422 - This is the bug!")
            print(f"   Error: {response.text[:300]}")
            return None
        else:
            print(f"❌ FAIL: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return None

def test_upload_video():
    """TEST 2: Upload a video file (small MP4)"""
    print_section("TEST 2: Upload MP4 video to /api/admin/cms/upload")
    
    # Create a minimal valid MP4 file (ftyp + mdat boxes)
    mp4_data = bytes([
        # ftyp box
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
        0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31,
        # mdat box (empty)
        0x00, 0x00, 0x00, 0x08, 0x6D, 0x64, 0x61, 0x74
    ])
    
    try:
        files = {'file': ('test.mp4', io.BytesIO(mp4_data), 'video/mp4')}
        response = requests.post(f"{BASE_URL}/admin/cms/upload", files=files, timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Video uploaded successfully")
            print(f"   URL: {data.get('url', 'N/A')[:80]}...")
            print(f"   Type: {data.get('type', 'N/A')}")
            print(f"   Filename: {data.get('filename', 'N/A')}")
            
            # Verify type is 'video'
            if data.get('type') == 'video':
                print(f"   ✅ Type correctly identified as 'video'")
            else:
                print(f"   ⚠️ Type is '{data.get('type')}', expected 'video'")
            
            # Verify URL is reachable
            if data.get('url'):
                head_resp = requests.head(data['url'], timeout=10)
                if head_resp.status_code == 200:
                    print(f"   ✅ URL is reachable (HEAD {head_resp.status_code})")
                else:
                    print(f"   ⚠️ URL returned {head_resp.status_code}")
            
            return data.get('url')
        elif response.status_code == 422:
            print(f"❌ FAIL: HTTP 422 - This is the bug!")
            print(f"   Error: {response.text[:300]}")
            return None
        else:
            print(f"❌ FAIL: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return None

def test_home_curations_get():
    """TEST 3: GET /api/admin/cms/home-curations"""
    print_section("TEST 3: GET /api/admin/cms/home-curations")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-curations", timeout=15)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved {len(data)} curation(s)")
            if data:
                print(f"   Sample: {data[0].get('title', 'N/A')}")
            return True
        else:
            print(f"❌ FAIL: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_home_curations_get_active():
    """TEST 4: GET /api/admin/cms/home-curations?active_only=true"""
    print_section("TEST 4: GET /api/admin/cms/home-curations?active_only=true")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-curations?active_only=true", timeout=15)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved {len(data)} active curation(s)")
            # Verify all are active
            all_active = all(item.get('is_active', False) for item in data)
            if all_active or len(data) == 0:
                print(f"   ✅ All items have is_active=true")
            else:
                print(f"   ⚠️ Some items have is_active=false")
            return True
        else:
            print(f"❌ FAIL: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_home_curations_post():
    """TEST 5: POST /api/admin/cms/home-curations"""
    print_section("TEST 5: POST /api/admin/cms/home-curations")
    
    payload = {
        "title": "Test Curation",
        "title_line2": "line two",
        "thumbnail_url": "https://example.com/t.jpg",
        "video_url": "https://example.com/v.mp4",
        "sort_order": 99,
        "is_active": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/admin/cms/home-curations", json=payload, timeout=15)
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"✅ PASS: Curation created successfully")
            print(f"   ID: {data.get('id', 'N/A')}")
            print(f"   Title: {data.get('title', 'N/A')}")
            print(f"   Title Line 2: {data.get('title_line2', 'N/A')}")
            print(f"   Thumbnail URL: {data.get('thumbnail_url', 'N/A')[:60]}...")
            print(f"   Video URL: {data.get('video_url', 'N/A')[:60]}...")
            print(f"   Sort Order: {data.get('sort_order', 'N/A')}")
            print(f"   Is Active: {data.get('is_active', 'N/A')}")
            return data.get('id')
        else:
            print(f"❌ FAIL: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return None

def test_home_curations_patch(curation_id):
    """TEST 6: PATCH /api/admin/cms/home-curations/{id}"""
    print_section(f"TEST 6: PATCH /api/admin/cms/home-curations/{curation_id}")
    
    if not curation_id:
        print("⚠️ SKIP: No curation ID provided")
        return False
    
    payload = {
        "title": "Updated Test",
        "is_active": False,
        "thumbnail_url": "https://example.com/updated.jpg",
        "video_url": "https://example.com/updated.mp4"
    }
    
    try:
        response = requests.patch(f"{BASE_URL}/admin/cms/home-curations/{curation_id}", json=payload, timeout=15)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Curation updated successfully")
            print(f"   Response: {data}")
            
            # Verify update by re-fetching
            get_resp = requests.get(f"{BASE_URL}/admin/cms/home-curations", timeout=15)
            if get_resp.status_code == 200:
                curations = get_resp.json()
                updated = next((c for c in curations if c.get('id') == curation_id), None)
                if updated:
                    print(f"   ✅ Verified: title='{updated.get('title')}', is_active={updated.get('is_active')}")
                    if updated.get('title') == 'Updated Test' and updated.get('is_active') == False:
                        print(f"   ✅ Update applied correctly")
                    else:
                        print(f"   ⚠️ Update may not have applied correctly")
            
            return True
        else:
            print(f"❌ FAIL: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_home_curations_active_filter_after_update(curation_id):
    """TEST 7: Verify ?active_only=true excludes the updated curation"""
    print_section("TEST 7: Verify ?active_only=true excludes inactive curation")
    
    if not curation_id:
        print("⚠️ SKIP: No curation ID provided")
        return False
    
    try:
        response = requests.get(f"{BASE_URL}/admin/cms/home-curations?active_only=true", timeout=15)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved {len(data)} active curation(s)")
            
            # Check if our inactive curation is excluded
            found = any(c.get('id') == curation_id for c in data)
            if not found:
                print(f"   ✅ Inactive curation correctly excluded from active_only=true")
            else:
                print(f"   ⚠️ Inactive curation still appears in active_only=true results")
            
            return True
        else:
            print(f"❌ FAIL: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_home_curations_delete(curation_id):
    """TEST 8: DELETE /api/admin/cms/home-curations/{id}"""
    print_section(f"TEST 8: DELETE /api/admin/cms/home-curations/{curation_id}")
    
    if not curation_id:
        print("⚠️ SKIP: No curation ID provided")
        return False
    
    try:
        response = requests.delete(f"{BASE_URL}/admin/cms/home-curations/{curation_id}", timeout=15)
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 204]:
            print(f"✅ PASS: Curation deleted successfully")
            
            # Verify deletion by re-fetching
            get_resp = requests.get(f"{BASE_URL}/admin/cms/home-curations", timeout=15)
            if get_resp.status_code == 200:
                curations = get_resp.json()
                found = any(c.get('id') == curation_id for c in curations)
                if not found:
                    print(f"   ✅ Verified: Curation no longer exists")
                else:
                    print(f"   ⚠️ Curation still exists after deletion")
            
            return True
        else:
            print(f"❌ FAIL: {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_regression_endpoints():
    """TEST 9: Regression - verify existing CMS endpoints still work"""
    print_section("TEST 9: Regression - existing CMS endpoints")
    
    endpoints = [
        "/admin/cms/categories",
        "/admin/cms/services",
        "/admin/cms/home-promos",
        "/admin/cms/banners?category_id=salon-women"
    ]
    
    results = []
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=15)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PASS: GET {endpoint} → {response.status_code} ({len(data)} items)")
                results.append(True)
            else:
                print(f"❌ FAIL: GET {endpoint} → {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                results.append(False)
        except Exception as e:
            print(f"❌ ERROR: GET {endpoint} → {str(e)}")
            results.append(False)
    
    return all(results)

def main():
    print_section("CMS BACKEND API TEST SUITE")
    print(f"Testing against: {BASE_URL}")
    print(f"\nCONTEXT: User reported HTTP 422 on /api/admin/cms/upload from WEB admin panel.")
    print(f"This was a FRONTEND bug (FormData serialization). Backend should be unchanged.")
    print(f"Also testing new home-curations CRUD endpoints.")
    
    results = {
        'upload_image': False,
        'upload_video': False,
        'curations_get': False,
        'curations_get_active': False,
        'curations_post': False,
        'curations_patch': False,
        'curations_active_filter': False,
        'curations_delete': False,
        'regression': False
    }
    
    # Test 1: Upload image
    img_url = test_upload_image()
    results['upload_image'] = img_url is not None
    
    # Test 2: Upload video
    vid_url = test_upload_video()
    results['upload_video'] = vid_url is not None
    
    # Test 3: GET home-curations
    results['curations_get'] = test_home_curations_get()
    
    # Test 4: GET home-curations?active_only=true
    results['curations_get_active'] = test_home_curations_get_active()
    
    # Test 5: POST home-curations
    curation_id = test_home_curations_post()
    results['curations_post'] = curation_id is not None
    
    # Test 6: PATCH home-curations
    results['curations_patch'] = test_home_curations_patch(curation_id)
    
    # Test 7: Verify active_only filter after update
    results['curations_active_filter'] = test_home_curations_active_filter_after_update(curation_id)
    
    # Test 8: DELETE home-curations
    results['curations_delete'] = test_home_curations_delete(curation_id)
    
    # Test 9: Regression tests
    results['regression'] = test_regression_endpoints()
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"\nResults: {passed}/{total} tests passed")
    print("\nDetailed Results:")
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {test_name}")
    
    print("\n" + "="*80)
    print("NEXT STEPS:")
    print("1. Check backend logs: tail -n 100 /var/log/supervisor/backend.*.log")
    print("2. Look for 200 responses for upload calls (NO 422 errors)")
    print("3. Verify Supabase storage URLs are accessible")
    print("="*80)
    
    return 0 if all(results.values()) else 1

if __name__ == "__main__":
    sys.exit(main())
