#!/usr/bin/env python3
"""
Run SQL migrations against Supabase using the service role key.
"""
import os
import httpx
import sys

# Supabase credentials
SUPABASE_URL = "https://xuxetkeqxuwgphqrdzvy.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGV0a2VxeHV3Z3BocXJkenZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1OTc1MiwiZXhwIjoyMDk1NjM1NzUyfQ.6oagP6W7bj7x-j6TxCouTa2Tmhw6U3R5oDwFcO8IJJw"

def run_sql(sql: str, description: str) -> bool:
    """Execute SQL against Supabase using the REST API."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"{'='*60}")
    
    # Using Supabase's PostgreSQL REST endpoint
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # Since exec_sql RPC might not exist, we'll use a different approach
    # Use the Supabase SQL API endpoint directly
    url = f"{SUPABASE_URL}/rest/v1/"
    
    # Actually, let's try the pg_query approach with raw SQL
    # Supabase allows running raw SQL via the service role through their special endpoint
    
    try:
        with httpx.Client(timeout=60.0) as client:
            # Try the /pg endpoint for raw SQL (available in newer Supabase)
            sql_url = f"{SUPABASE_URL}/pg/query"
            response = client.post(
                sql_url,
                headers=headers,
                json={"query": sql}
            )
            
            if response.status_code == 200:
                print(f"✅ Success!")
                return True
            elif response.status_code == 404:
                # Endpoint not available, need to use dashboard
                print(f"⚠️  Direct SQL endpoint not available.")
                print(f"   Please run the SQL manually in Supabase Dashboard > SQL Editor")
                return False
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"   Response: {response.text[:500]}")
                return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


def main():
    migration_files = [
        ("/app/supabase-migration.sql", "Main Migration (Tables, RLS, Sample Data)"),
        ("/app/provider-system.sql", "Provider System (Assignment Workflow)"),
        ("/app/admin-policies.sql", "Admin Policies (Final Fix v3)")
    ]
    
    all_success = True
    manual_needed = []
    
    for filepath, description in migration_files:
        if not os.path.exists(filepath):
            print(f"⚠️  File not found: {filepath}")
            continue
            
        with open(filepath, 'r') as f:
            sql_content = f.read()
        
        success = run_sql(sql_content, description)
        if not success:
            all_success = False
            manual_needed.append((filepath, description))
    
    print("\n" + "="*60)
    if all_success:
        print("✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!")
    else:
        print("⚠️  SOME MIGRATIONS NEED MANUAL EXECUTION")
        print("\nPlease run the following SQL files in your Supabase Dashboard:")
        print("Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query")
        print("")
        for filepath, desc in manual_needed:
            print(f"  📄 {desc}")
            print(f"     File: {filepath}")
    print("="*60)
    
    return 0 if all_success else 1


if __name__ == "__main__":
    sys.exit(main())
