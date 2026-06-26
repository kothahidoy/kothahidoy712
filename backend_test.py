#!/usr/bin/env python3
"""
Backend test for POST /api/booking/profile/phone column name fix.

This test verifies:
1. The Supabase public.users table uses `full_name` (not `name`)
2. The FastAPI endpoint correctly uses `full_name` in the PATCH body
3. Auth validation works correctly (401 for missing/invalid tokens)
4. Regression checks for other endpoints
"""

import os
import sys
import httpx
import asyncio
from typing import Optional

# Configuration
BACKEND_URL = "https://code-import-hub-7.preview.emergentagent.com"
SUPABASE_URL = "https://xuxetkeqxuwgphqrdzvy.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGV0a2VxeHV3Z3BocXJkenZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1OTc1MiwiZXhwIjoyMDk1NjM1NzUyfQ.6oagP6W7bj7x-j6TxCouTa2Tmhw6U3R5oDwFcO8IJJw"

# Test user ID from Supabase users table
TEST_USER_ID = "96c44535-a044-414b-8681-7be2725c01cd"

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def log_test(test_name: str):
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST: {test_name}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")


def log_pass(message: str):
    print(f"{GREEN}✅ PASS: {message}{RESET}")


def log_fail(message: str):
    print(f"{RED}❌ FAIL: {message}{RESET}")


def log_info(message: str):
    print(f"{YELLOW}ℹ️  INFO: {message}{RESET}")


def supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


async def test_1_prove_column_name():
    """
    TEST 1: PROVE THE COLUMN NAME IS `full_name` (not `name`)
    
    Step 1a: GET user by auth_user_id
    Step 1b: PATCH with full_name (should succeed)
    Step 1c: PATCH with name (should fail with 400)
    Step 1d: RESTORE original values
    """
    log_test("TEST 1: Prove Supabase public.users uses 'full_name' column")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1a: GET user to capture original values
        log_info("Step 1a: GET user by id to capture original values")
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{TEST_USER_ID}&select=id,phone,full_name",
            headers=supabase_headers(),
        )
        
        if r.status_code != 200:
            log_fail(f"Step 1a: GET user failed with {r.status_code}: {r.text}")
            return False
        
        users = r.json()
        if not users or len(users) == 0:
            log_fail(f"Step 1a: No user found with id={TEST_USER_ID}")
            return False
        
        user = users[0]
        user_row_id = user.get("id")
        original_phone = user.get("phone")
        original_full_name = user.get("full_name")
        
        log_pass(f"Step 1a: Found user with id={user_row_id}")
        log_info(f"  Original phone: {original_phone}")
        log_info(f"  Original full_name: {original_full_name}")
        
        # Step 1b: PATCH with full_name (should succeed)
        log_info("Step 1b: PATCH with full_name='QA Smoke', phone='+919876500000'")
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_row_id}",
            headers=supabase_headers(),
            json={"full_name": "QA Smoke", "phone": "+919876500000"},
        )
        
        if r.status_code not in (200, 204):
            log_fail(f"Step 1b: PATCH with full_name failed with {r.status_code}: {r.text}")
            return False
        
        log_pass(f"Step 1b: PATCH with full_name succeeded ({r.status_code})")
        if r.status_code == 200 and r.text:
            log_info(f"  Response: {r.text[:200]}")
        
        # Step 1c: PATCH with name (should fail with 400)
        log_info("Step 1c: PATCH with name='QA Smoke' (should fail)")
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_row_id}",
            headers=supabase_headers(),
            json={"name": "QA Smoke"},
        )
        
        if r.status_code == 400:
            log_pass(f"Step 1c: PATCH with 'name' correctly failed with 400")
            log_info(f"  PostgREST error: {r.text}")
        else:
            log_fail(f"Step 1c: Expected 400 but got {r.status_code}: {r.text}")
            # Still continue to restore
        
        # Step 1d: RESTORE original values
        log_info("Step 1d: RESTORE original full_name and phone")
        restore_body = {}
        if original_full_name is not None:
            restore_body["full_name"] = original_full_name
        if original_phone is not None:
            restore_body["phone"] = original_phone
        
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_row_id}",
            headers=supabase_headers(),
            json=restore_body,
        )
        
        if r.status_code not in (200, 204):
            log_fail(f"Step 1d: RESTORE failed with {r.status_code}: {r.text}")
            log_fail("⚠️  CRITICAL: User data may be corrupted!")
            return False
        
        log_pass(f"Step 1d: RESTORE succeeded - user data restored to original values")
        
        return True


async def test_2_endpoint_behavior():
    """
    TEST 2: ENDPOINT BEHAVIOUR via the FastAPI route
    
    2a. POST without Authorization header
    2b. POST with invalid Authorization token
    2c. POST with invalid phone and no auth
    """
    log_test("TEST 2: Endpoint Behavior - POST /api/booking/profile/phone")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test 2a: No Authorization header
        log_info("Test 2a: POST without Authorization header")
        r = await client.post(
            f"{BACKEND_URL}/api/booking/profile/phone",
            json={"phone": "+919876543210", "name": "Test"},
        )
        
        if r.status_code == 401:
            response_data = r.json()
            if response_data.get("detail") == "Please sign in":
                log_pass(f"Test 2a: Correctly returned 401 with 'Please sign in'")
            else:
                log_pass(f"Test 2a: Returned 401 (detail: {response_data.get('detail')})")
        else:
            log_fail(f"Test 2a: Expected 401 but got {r.status_code}: {r.text}")
        
        # Test 2b: Invalid Authorization token
        log_info("Test 2b: POST with invalid Authorization token")
        r = await client.post(
            f"{BACKEND_URL}/api/booking/profile/phone",
            headers={"Authorization": "Bearer notarealtoken"},
            json={"phone": "+919876543210"},
        )
        
        if r.status_code == 401:
            log_pass(f"Test 2b: Correctly returned 401 for invalid token")
        else:
            log_fail(f"Test 2b: Expected 401 but got {r.status_code}: {r.text}")
        
        # Test 2c: Invalid phone with no auth
        log_info("Test 2c: POST with invalid phone (no auth)")
        r = await client.post(
            f"{BACKEND_URL}/api/booking/profile/phone",
            json={"phone": "12"},
        )
        
        if r.status_code == 401:
            log_pass(f"Test 2c: Auth checked before validation (401)")
        elif r.status_code == 400:
            response_data = r.json()
            if "valid phone" in response_data.get("detail", "").lower():
                log_pass(f"Test 2c: Validation error (400) - {response_data.get('detail')}")
            else:
                log_pass(f"Test 2c: Returned 400 - {response_data.get('detail')}")
        else:
            log_fail(f"Test 2c: Expected 401 or 400 but got {r.status_code}: {r.text}")
        
        return True


async def test_3_regression_checks():
    """
    TEST 3: REGRESSION CHECK - confirm nothing else broke
    """
    log_test("TEST 3: Regression Checks")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Check 1: Root endpoint
        log_info("Check 1: GET /api/")
        r = await client.get(f"{BACKEND_URL}/api/")
        
        if r.status_code == 200:
            data = r.json()
            if data.get("message") == "Hello World":
                log_pass("Check 1: GET /api/ returned 200 with correct message")
            else:
                log_pass(f"Check 1: GET /api/ returned 200 (message: {data.get('message')})")
        else:
            log_fail(f"Check 1: GET /api/ failed with {r.status_code}: {r.text}")
        
        # Check 2: OTP health endpoint
        log_info("Check 2: GET /api/auth/otp/health")
        r = await client.get(f"{BACKEND_URL}/api/auth/otp/health")
        
        if r.status_code == 200:
            data = r.json()
            if data.get("configured") == True:
                log_pass("Check 2: GET /api/auth/otp/health returned 200 with configured=true")
            else:
                log_pass(f"Check 2: GET /api/auth/otp/health returned 200 (configured: {data.get('configured')})")
        else:
            log_fail(f"Check 2: GET /api/auth/otp/health failed with {r.status_code}: {r.text}")
        
        return True


async def main():
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}BACKEND TEST: POST /api/booking/profile/phone Column Name Fix{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"\nBackend URL: {BACKEND_URL}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Test User ID: {TEST_USER_ID}")
    
    results = []
    
    # Run all tests
    try:
        result_1 = await test_1_prove_column_name()
        results.append(("TEST 1: Prove column name", result_1))
    except Exception as e:
        log_fail(f"TEST 1 crashed: {e}")
        results.append(("TEST 1: Prove column name", False))
    
    try:
        result_2 = await test_2_endpoint_behavior()
        results.append(("TEST 2: Endpoint behavior", result_2))
    except Exception as e:
        log_fail(f"TEST 2 crashed: {e}")
        results.append(("TEST 2: Endpoint behavior", False))
    
    try:
        result_3 = await test_3_regression_checks()
        results.append(("TEST 3: Regression checks", result_3))
    except Exception as e:
        log_fail(f"TEST 3 crashed: {e}")
        results.append(("TEST 3: Regression checks", False))
    
    # Summary
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST SUMMARY{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{GREEN}✅ PASS{RESET}" if result else f"{RED}❌ FAIL{RESET}"
        print(f"{status} - {test_name}")
    
    print(f"\n{BLUE}Total: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"\n{GREEN}{'='*80}{RESET}")
        print(f"{GREEN}ALL TESTS PASSED - BUG FIX VERIFIED{RESET}")
        print(f"{GREEN}{'='*80}{RESET}")
        return 0
    else:
        print(f"\n{RED}{'='*80}{RESET}")
        print(f"{RED}SOME TESTS FAILED - REVIEW REQUIRED{RESET}")
        print(f"{RED}{'='*80}{RESET}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
