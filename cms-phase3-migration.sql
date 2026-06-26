-- ═══════════════════════════════════════════════════════════════════
-- MFIXIT CMS  ·  Phase 3 migration  (UC-style per-service detail pages)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Short description for service cards (60-80 chars)
ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS short_description text;

-- 2. Per-service deep detail page content (all sections of the View-details screen)
CREATE TABLE IF NOT EXISTS public.service_details (
    service_id      text PRIMARY KEY REFERENCES public.services(id) ON DELETE CASCADE,
    safety_tips     jsonb DEFAULT '[]'::jsonb,   -- [{title, body}]
    process_steps   jsonb DEFAULT '[]'::jsonb,   -- [{step, title, body}]
    whats_included  jsonb DEFAULT '[]'::jsonb,   -- ["Load test", ...]
    whats_excluded  jsonb DEFAULT '[]'::jsonb,
    brands          jsonb DEFAULT '[]'::jsonb,   -- ["Havells", "Anchor", ...]
    cover_promise   jsonb DEFAULT '[]'::jsonb,   -- ["Up to 30 days warranty", ...]
    faqs            jsonb DEFAULT '[]'::jsonb,   -- [{q, a}]
    variants        jsonb DEFAULT '[]'::jsonb,   -- [{name:"Standard", price, duration, image}]
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 3. Customer reviews (real reviews — only published 5-star shown publicly)
CREATE TABLE IF NOT EXISTS public.service_reviews (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id     text NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    customer_name  text NOT NULL,
    customer_avatar text,
    rating         numeric(2,1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text    text NOT NULL,
    is_published   boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_reviews_service_idx
    ON public.service_reviews(service_id, is_published);

-- 4. Mfixit Cover page content (per category)
CREATE TABLE IF NOT EXISTS public.mfixit_cover_sections (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id    text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    section_key    text NOT NULL,           -- 'warranty' | 'expert' | 'rate' | 'benefits' | 'support'
    title          text NOT NULL,
    bullets        jsonb DEFAULT '[]'::jsonb,
    sort_order     integer NOT NULL DEFAULT 0,
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE(category_id, section_key)
);

-- 5. Rate card items (per category)
CREATE TABLE IF NOT EXISTS public.rate_card_items (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id    text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    service_name   text NOT NULL,
    sub_label      text,
    price          numeric(10,2) NOT NULL DEFAULT 0,
    price_suffix   text DEFAULT 'onwards',     -- e.g. "/visit", "onwards"
    sort_order     integer NOT NULL DEFAULT 0,
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_card_items_category_idx
    ON public.rate_card_items(category_id, sort_order);

-- 6. Visitation fee strip — per category (footer banner)
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS visitation_fee_label text DEFAULT 'Get visitation fee off on orders above ₹499',
    ADD COLUMN IF NOT EXISTS visitation_fee_threshold numeric(10,2) DEFAULT 499,
    ADD COLUMN IF NOT EXISTS visitation_fee_active boolean DEFAULT true;

-- 7. RLS  — public read, service_role writes
ALTER TABLE public.service_details         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfixit_cover_sections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_card_items         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_details_read" ON public.service_details;
DROP POLICY IF EXISTS "service_reviews_read" ON public.service_reviews;
DROP POLICY IF EXISTS "cover_sections_read"  ON public.mfixit_cover_sections;
DROP POLICY IF EXISTS "rate_card_read"       ON public.rate_card_items;

CREATE POLICY "service_details_read" ON public.service_details
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_reviews_read" ON public.service_reviews
    FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "cover_sections_read"  ON public.mfixit_cover_sections
    FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "rate_card_read"       ON public.rate_card_items
    FOR SELECT TO anon, authenticated USING (is_active = true);

-- Verify
SELECT 'service_details'        AS t, count(*) FROM public.service_details
UNION ALL SELECT 'service_reviews',       count(*) FROM public.service_reviews
UNION ALL SELECT 'mfixit_cover_sections', count(*) FROM public.mfixit_cover_sections
UNION ALL SELECT 'rate_card_items',       count(*) FROM public.rate_card_items
UNION ALL SELECT 'services_short_desc',   count(*) FROM public.services WHERE short_description IS NOT NULL;
