-- ============================================================
-- SUPABASE MIGRATION SCRIPT FOR MFIXIT APP
-- ============================================================
-- Run this in your Supabase SQL Editor to fix RLS issues
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================================

-- 1. DROP EXISTING PROBLEMATIC POLICIES (to prevent recursion errors)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_own" ON public.bookings;

DROP POLICY IF EXISTS "providers_select_all" ON public.providers;
DROP POLICY IF EXISTS "providers_insert_admin" ON public.providers;
DROP POLICY IF EXISTS "providers_update_admin" ON public.providers;

-- 2. CREATE TABLES IF NOT EXIST
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  city TEXT DEFAULT 'Durgapur',
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT,
  starting_price NUMERIC(10,2) NOT NULL,
  duration_mins INTEGER,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  image TEXT,
  popular BOOLEAN DEFAULT false,
  top_rated BOOLEAN DEFAULT false,
  recommended BOOLEAN DEFAULT false,
  inclusions TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Providers table
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  service_type TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id),
  service_id TEXT REFERENCES public.services(id),
  scheduled_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  address JSONB NOT NULL,
  notes TEXT,
  price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_method TEXT,
  payment_id TEXT,
  payment_order TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved addresses table
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  address_line TEXT NOT NULL,
  landmark TEXT,
  city TEXT NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  code TEXT UNIQUE,
  discount_percent NUMERIC(5,2),
  valid_until DATE,
  banner_url TEXT,
  bg_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 4. CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- ============================================================

-- USERS TABLE POLICIES
-- Simple: Users can only see/update their own row based on auth.uid()
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- BOOKINGS TABLE POLICIES
-- No subquery to users table - use direct customer_id match
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (
    customer_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR 
    provider_id IN (SELECT id FROM public.providers WHERE phone IN (
      SELECT phone FROM public.users WHERE auth_user_id = auth.uid()
    ))
  );

CREATE POLICY "bookings_insert_own" ON public.bookings
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- SAVED ADDRESSES POLICIES
CREATE POLICY "addresses_select_own" ON public.saved_addresses
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "addresses_insert_own" ON public.saved_addresses
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "addresses_update_own" ON public.saved_addresses
  FOR UPDATE USING (
    user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "addresses_delete_own" ON public.saved_addresses
  FOR DELETE USING (
    user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- PROVIDERS TABLE POLICIES (public read, admin write)
CREATE POLICY "providers_select_all" ON public.providers
  FOR SELECT USING (true);

-- CATEGORIES/SERVICES/OFFERS - Public read
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "services_select_all" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "offers_select_all" ON public.offers
  FOR SELECT USING (true);

-- 5. CREATE SECURITY DEFINER FUNCTIONS (BYPASS RLS)
-- ============================================================

-- Get current user's profile (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  city TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.auth_user_id, u.full_name, u.phone, u.email, 
         u.avatar_url, u.city, u.role, u.created_at
  FROM public.users u
  WHERE u.auth_user_id = auth.uid();
END;
$$;

-- List all bookings (admin function, bypasses RLS)
CREATE OR REPLACE FUNCTION public.list_all_bookings()
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  provider_id UUID,
  service_id TEXT,
  scheduled_date DATE,
  time_slot TEXT,
  address JSONB,
  notes TEXT,
  price NUMERIC,
  status TEXT,
  rating INTEGER,
  review TEXT,
  created_at TIMESTAMPTZ,
  provider_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.customer_id, b.provider_id, b.service_id, 
         b.scheduled_date, b.time_slot, b.address, b.notes,
         b.price, b.status, b.rating, b.review, b.created_at,
         p.name as provider_name
  FROM public.bookings b
  LEFT JOIN public.providers p ON b.provider_id = p.id
  ORDER BY b.created_at DESC;
END;
$$;

-- List all customers (admin function, bypasses RLS)
CREATE OR REPLACE FUNCTION public.list_all_customers()
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.auth_user_id, u.full_name, u.phone, u.email,
         u.city, u.role, u.created_at
  FROM public.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Admin update booking status
CREATE OR REPLACE FUNCTION public.admin_update_booking_status(bk_id UUID, new_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET status = new_status
  WHERE id = bk_id;
END;
$$;

-- Provider login function
CREATE OR REPLACE FUNCTION public.provider_login(p_phone TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  service_type TEXT,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.phone, p.service_type, p.is_available
  FROM public.providers p
  WHERE REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
END;
$$;

-- Get provider's assigned jobs
CREATE OR REPLACE FUNCTION public.get_provider_jobs(p_provider_id UUID)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  service_id TEXT,
  scheduled_date DATE,
  time_slot TEXT,
  address JSONB,
  notes TEXT,
  price NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ,
  customer_name TEXT,
  customer_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.customer_id, b.service_id, b.scheduled_date, 
         b.time_slot, b.address, b.notes, b.price, b.status, b.created_at,
         u.full_name as customer_name, u.phone as customer_phone
  FROM public.bookings b
  LEFT JOIN public.users u ON b.customer_id = u.id
  WHERE b.provider_id = p_provider_id
  ORDER BY b.scheduled_date, b.time_slot;
END;
$$;

-- Assign provider to booking
CREATE OR REPLACE FUNCTION public.assign_provider_to_booking(bk_id UUID, prov_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET provider_id = prov_id, status = 'confirmed'
  WHERE id = bk_id;
END;
$$;

-- List all providers
CREATE OR REPLACE FUNCTION public.list_all_providers()
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  service_type TEXT,
  is_available BOOLEAN,
  rating NUMERIC,
  jobs_completed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.phone, p.service_type, p.is_available,
         p.rating, p.jobs_completed
  FROM public.providers p
  ORDER BY p.name;
END;
$$;

-- 6. GRANT EXECUTE PERMISSIONS
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_all_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_all_customers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_booking_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.provider_login(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_jobs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_provider_to_booking(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_all_providers() TO anon, authenticated;

-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_phone ON public.providers(phone);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);

-- 8. INSERT SAMPLE DATA (OPTIONAL)
-- ============================================================

-- Insert sample categories if empty
INSERT INTO public.categories (id, name, icon, color, description) 
SELECT * FROM (VALUES
  ('cat-electrician', 'Electrician', 'Zap', '#FF6B00', 'Electrical repairs and installations'),
  ('cat-plumber', 'Plumber', 'Droplet', '#0099FF', 'Plumbing services and repairs'),
  ('cat-ac-repair', 'AC Repair', 'Wind', '#00CCAA', 'Air conditioning service'),
  ('cat-cleaning', 'Cleaning', 'Sparkles', '#9966FF', 'Home and office cleaning'),
  ('cat-carpenter', 'Carpenter', 'Hammer', '#FF9500', 'Woodwork and furniture repair')
) AS v(id, name, icon, color, description)
WHERE NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1);

-- Insert sample services if empty
INSERT INTO public.services (id, category_id, title, description, starting_price, duration_mins, rating, popular, is_active)
SELECT * FROM (VALUES
  ('svc-elec-1', 'cat-electrician', 'Fan Installation', 'Ceiling or wall fan installation', 299, 60, 4.5, true, true),
  ('svc-elec-2', 'cat-electrician', 'Switchboard Repair', 'Repair or replace switchboards', 199, 45, 4.3, false, true),
  ('svc-plumb-1', 'cat-plumber', 'Tap Repair', 'Fix leaking or damaged taps', 149, 30, 4.6, true, true),
  ('svc-ac-1', 'cat-ac-repair', 'AC Gas Refill', 'Refrigerant top-up service', 999, 90, 4.4, true, true),
  ('svc-clean-1', 'cat-cleaning', 'Deep Cleaning', 'Full home deep cleaning', 1499, 180, 4.7, true, true)
) AS v(id, category_id, title, description, starting_price, duration_mins, rating, popular, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.services LIMIT 1);

-- Insert sample providers if empty
INSERT INTO public.providers (name, phone, service_type, is_available)
SELECT * FROM (VALUES
  ('Rahul Sharma', '9876543210', 'electrician', true),
  ('Amit Kumar', '9876543211', 'plumber', true),
  ('Suresh Patel', '9876543212', 'ac-repair', true),
  ('Priya Singh', '9876543213', 'cleaning', true),
  ('Rajesh Verma', '9876543214', 'electrician', true),
  ('Mohammed Ali', '9876543215', 'carpenter', true)
) AS v(name, phone, service_type, is_available)
WHERE NOT EXISTS (SELECT 1 FROM public.providers LIMIT 1);

-- ============================================================
-- DONE! Your Supabase database is now ready for production.
-- ============================================================
