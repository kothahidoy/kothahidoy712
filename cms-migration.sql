-- ═══════════════════════════════════════════════════════════════════
-- MFIXIT CMS  ·  Phase 2 migration
-- Adds full hierarchy:  categories → sub_categories → services
--                       categories → category_banners (hero carousel)
--                       categories → category_promos  (discount strip)
--                       categories → category_meta    (subtitle text like "Salon, at your home")
-- Plus:  Supabase Storage bucket for image/video uploads
-- ═══════════════════════════════════════════════════════════════════

-- ────────────────  1. extend categories with sort + active + brand text
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS sort_order   integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_active    boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS image_url    text,
    ADD COLUMN IF NOT EXISTS brand_name   text,             -- e.g. "Salon Luxe"
    ADD COLUMN IF NOT EXISTS brand_rating numeric(3,2) DEFAULT 4.85,
    ADD COLUMN IF NOT EXISTS brand_reviews_label text DEFAULT '2.0 M bookings';

-- ────────────────  2. category_banners (hero carousel — video + image slides)
CREATE TABLE IF NOT EXISTS public.category_banners (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    title         text NOT NULL,                 -- e.g. "Salon, at your home"
    subtitle      text,
    media_type    text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
    media_url     text NOT NULL,                 -- image URL or video URL
    poster_url    text,                          -- for video: thumbnail to show before play
    sort_order    integer NOT NULL DEFAULT 0,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS category_banners_category_idx ON public.category_banners(category_id, sort_order);

-- ────────────────  3. category_promos (the "Get 25% off upto 200" strip)
CREATE TABLE IF NOT EXISTS public.category_promos (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    label           text NOT NULL,                  -- e.g. "Get 25% off upto 200"
    sub_label       text,                           -- e.g. "For new salon users"
    discount_pct    numeric(5,2) DEFAULT 0,         -- 25
    max_off         numeric(10,2) DEFAULT 0,        -- 200
    min_cart        numeric(10,2) DEFAULT 0,
    badge_color     text DEFAULT '#16A34A',
    sort_order      integer NOT NULL DEFAULT 0,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS category_promos_category_idx ON public.category_promos(category_id, sort_order);

-- ────────────────  4. sub_categories (e.g. Women's Salon → Facials, Waxing, Cleanup …)
CREATE TABLE IF NOT EXISTS public.sub_categories (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name          text NOT NULL,
    slug          text,
    image_url     text,
    badge         text,                             -- e.g. "New", "Upto 20% OFF"
    badge_color   text DEFAULT '#16A34A',
    sort_order    integer NOT NULL DEFAULT 0,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sub_categories_category_idx ON public.sub_categories(category_id, sort_order);

-- ────────────────  5. link services to a sub-category (optional, nullable)
ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS sub_category_id uuid REFERENCES public.sub_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sort_order      integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS services_sub_category_idx ON public.services(sub_category_id, sort_order);

-- ────────────────  6. set sensible sort_order for the existing 9 categories
UPDATE public.categories SET sort_order = 1, is_active = true  WHERE id = 'salon-women';
UPDATE public.categories SET sort_order = 2, is_active = true  WHERE id = 'salon-men';
UPDATE public.categories SET sort_order = 3, is_active = true  WHERE id = 'cleaning-pest';
UPDATE public.categories SET sort_order = 4, is_active = true  WHERE id = 'painting';
UPDATE public.categories SET sort_order = 5, is_active = true  WHERE id = 'ac-appliance';
UPDATE public.categories SET sort_order = 6, is_active = true  WHERE id = 'electrician';
UPDATE public.categories SET sort_order = 7, is_active = true  WHERE id = 'insta-help';
UPDATE public.categories SET sort_order = 8, is_active = true  WHERE id = 'plumber';
UPDATE public.categories SET sort_order = 9, is_active = true  WHERE id = 'carpenter';

-- Pre-fill brand_name for the salon categories so the "Salon Luxe" label is editable from admin
UPDATE public.categories SET brand_name = 'Salon Luxe',         brand_rating = 4.89 WHERE id = 'salon-women';
UPDATE public.categories SET brand_name = 'Men''s Salon Luxe',   brand_rating = 4.87 WHERE id = 'salon-men';

-- ────────────────  7. RLS  · everyone can READ, only service_role can write
ALTER TABLE public.category_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_promos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_public_read"  ON public.category_banners;
DROP POLICY IF EXISTS "promos_public_read"   ON public.category_promos;
DROP POLICY IF EXISTS "subcats_public_read"  ON public.sub_categories;

CREATE POLICY "banners_public_read" ON public.category_banners
    FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "promos_public_read" ON public.category_promos
    FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "subcats_public_read" ON public.sub_categories
    FOR SELECT TO anon, authenticated USING (is_active = true);

-- (writes go through the backend with service_role — RLS bypasses automatically.)

-- ────────────────  8. Storage bucket for CMS images / videos
-- This INSERT is idempotent
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cms-media',
    'cms-media',
    true,
    52428800,                                                            -- 50 MB
    ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public,
        file_size_limit   = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies so anon can read, authenticated can upload (backend bypasses RLS anyway)
DROP POLICY IF EXISTS "cms_media_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "cms_media_authed_upload" ON storage.objects;

CREATE POLICY "cms_media_public_read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'cms-media');

CREATE POLICY "cms_media_authed_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'cms-media');

-- ────────────────  Verify
SELECT 'categories'        AS t, count(*) FROM public.categories
UNION ALL SELECT 'sub_categories',    count(*) FROM public.sub_categories
UNION ALL SELECT 'category_banners',  count(*) FROM public.category_banners
UNION ALL SELECT 'category_promos',   count(*) FROM public.category_promos
UNION ALL SELECT 'services',          count(*) FROM public.services;
