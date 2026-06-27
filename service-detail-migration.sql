-- ============================================================
-- Phase 1 Migration: Per-Service editable detail pages
-- ============================================================

-- 1) Extend `services` with editable detail-page fields
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS subtitle           text,
  ADD COLUMN IF NOT EXISTS hero_image         text,
  ADD COLUMN IF NOT EXISTS warranty           text DEFAULT '30 days',
  ADD COLUMN IF NOT EXISTS safety_tips        jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS process_steps      jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exclusions         jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brands             jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cover_features     jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faqs               jsonb DEFAULT '[]'::jsonb;

-- 2) Create `service_variants` (Standard / Premium / custom tiers per service)
CREATE TABLE IF NOT EXISTS public.service_variants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      text NOT NULL,
  name            text NOT NULL,
  price           numeric NOT NULL DEFAULT 0,
  original_price  numeric,
  duration_mins   integer DEFAULT 60,
  image           text,
  rating          numeric DEFAULT 4.7,
  review_count    integer DEFAULT 0,
  features        text[] DEFAULT ARRAY[]::text[],
  sort_order      integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT fk_service
    FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_variants_service_id
  ON public.service_variants(service_id);

CREATE INDEX IF NOT EXISTS idx_service_variants_sort
  ON public.service_variants(service_id, sort_order);

-- 3) Ensure service_reviews has good indexes (table already exists)
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id
  ON public.service_reviews(service_id);

CREATE INDEX IF NOT EXISTS idx_service_reviews_pub_rating
  ON public.service_reviews(service_id, is_published, rating);

-- 4) Disable RLS for these tables (controlled via service-role key from backend)
ALTER TABLE public.service_variants DISABLE ROW LEVEL SECURITY;

-- 5) Helpful view: variant summary per service
CREATE OR REPLACE VIEW public.service_variant_counts AS
SELECT
  service_id,
  COUNT(*)              AS variant_count,
  MIN(price)            AS min_price,
  MAX(price)            AS max_price
FROM public.service_variants
WHERE is_active = true
GROUP BY service_id;
