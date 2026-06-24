-- ============================================================================
-- Urban Company-style Booking Flow Migration for Mfixit
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SLOTS TABLE  (time slots availability for each date)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date NOT NULL,
  time        text NOT NULL,           -- "03:30 PM"
  available   boolean DEFAULT true,
  capacity    int DEFAULT 5,           -- how many bookings allowed in this slot
  booked      int DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(date, time)
);
CREATE INDEX IF NOT EXISTS slots_date_idx ON public.slots(date);

ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read slots" ON public.slots;
CREATE POLICY "public read slots" ON public.slots FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- 2. PLUS PLANS  (membership plans like 3mo / 6mo / 12mo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plus_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,                  -- "6 months plan"
  duration_months int NOT NULL,
  price           numeric NOT NULL,
  original_price  numeric,
  benefits        jsonb DEFAULT '[]'::jsonb,      -- ["Get 10% off on all bookings, upto ₹100", ...]
  is_active       boolean DEFAULT true,
  display_order   int DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.plus_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read plus_plans" ON public.plus_plans;
CREATE POLICY "public read plus_plans" ON public.plus_plans FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- 3. PLUS SUBSCRIPTIONS (user's active membership)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plus_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id     uuid REFERENCES public.plus_plans(id),
  started_at  timestamptz DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plus_subs_user_idx ON public.plus_subscriptions(user_id);

ALTER TABLE public.plus_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own subs" ON public.plus_subscriptions;
CREATE POLICY "users read own subs" ON public.plus_subscriptions FOR SELECT
  USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 4. COUPONS TABLE (richer than offers — for cart apply logic)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  title           text NOT NULL,
  description     text,
  discount_type   text NOT NULL CHECK (discount_type IN ('percent','flat')),
  discount_value  numeric NOT NULL,
  min_cart_value  numeric DEFAULT 0,
  max_discount    numeric,
  valid_until     timestamptz,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read coupons" ON public.coupons;
CREATE POLICY "public read coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- ----------------------------------------------------------------------------
-- 5. EXTEND BOOKINGS TABLE for tip + coupon + plus
-- ----------------------------------------------------------------------------
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tip_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS coupon_discount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS plus_discount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS taxes_amount numeric DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;  -- cart items snapshot

-- ----------------------------------------------------------------------------
-- 6. SEED DATA: Generate next 14 days of slots
-- ----------------------------------------------------------------------------
INSERT INTO public.slots (date, time, available)
SELECT
  d::date,
  to_char(t, 'HH12:MI AM'),
  true
FROM generate_series(CURRENT_DATE, CURRENT_DATE + 13, '1 day'::interval) d,
     generate_series('2000-01-01 09:00:00'::timestamp, '2000-01-01 20:00:00'::timestamp, '15 minutes') t
ON CONFLICT (date, time) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. SEED DATA: Plus plans
-- ----------------------------------------------------------------------------
INSERT INTO public.plus_plans (name, duration_months, price, original_price, benefits, display_order)
VALUES
  ('3 months plan', 3, 149, 399,
   '["Get 10% off on all bookings, upto ₹100","Priority customer support","Free reschedule"]'::jsonb, 1),
  ('6 months plan', 6, 249, 699,
   '["Get 10% off on all bookings, upto ₹100","Priority customer support","Free reschedule","Early access to deals"]'::jsonb, 2),
  ('12 months plan', 12, 449, 1199,
   '["Get 15% off on all bookings, upto ₹150","Priority customer support","Free reschedule","Early access to deals","Free service warranty extension"]'::jsonb, 3)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. SEED DATA: Coupons
-- ----------------------------------------------------------------------------
INSERT INTO public.coupons (code, title, description, discount_type, discount_value, min_cart_value, max_discount, valid_until, is_active)
VALUES
  ('FIRST50',  'First booking ₹50 off',        'Get ₹50 off your first booking',             'flat',    50,  299,  50,  now() + interval '60 days', true),
  ('SAVE10',   '10% off up to ₹100',           'Save 10% on any service booking',            'percent', 10,  499,  100, now() + interval '60 days', true),
  ('MONSOON15','Monsoon special 15% off',      'Get 15% off, valid till month end',          'percent', 15,  799,  200, now() + interval '30 days', true),
  ('AC499',    'AC service flat ₹100 off',     'Flat ₹100 off on AC bookings above ₹999',    'flat',    100, 999,  100, now() + interval '90 days', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- DONE! Run the next SQL block (if you have offers table without code field):
-- ============================================================================
