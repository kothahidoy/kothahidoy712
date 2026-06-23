-- Mfixit Required Tables for Supabase
-- Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/xuxetkeqxuwgphqrdzvy/sql

-- ==========================================
-- 1. CART ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service_id)
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Users can view own cart items" ON public.cart_items
    FOR SELECT USING (true);

CREATE POLICY "Users can insert cart items" ON public.cart_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own cart items" ON public.cart_items
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own cart items" ON public.cart_items
    FOR DELETE USING (true);

-- ==========================================
-- 2. SPOTLIGHT BANNERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.spotlight_banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    title_line2 TEXT,
    subtitle TEXT,
    bg_color TEXT DEFAULT '#F5F5F5',
    text_color TEXT DEFAULT '#1a1a1a',
    image TEXT,
    link_to TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.spotlight_banners ENABLE ROW LEVEL SECURITY;

-- Spotlight policies (public read)
CREATE POLICY "Anyone can view spotlight banners" ON public.spotlight_banners
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage spotlight banners" ON public.spotlight_banners
    FOR ALL USING (true);

-- ==========================================
-- 3. SLOTS TABLE (if not exists)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, time)
);

-- Enable RLS
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view slots" ON public.slots
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage slots" ON public.slots
    FOR ALL USING (true);

-- ==========================================
-- INSERT INITIAL SPOTLIGHT BANNERS
-- ==========================================
INSERT INTO public.spotlight_banners (id, title, title_line2, subtitle, bg_color, text_color, image, link_to, sort_order, is_active)
VALUES 
    ('spot-1', 'Get your AC', 'summer-ready', 'Foam-jet AC service', '#F5F5F5', '#1a1a1a', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400', '/category/cat-ac-appliance', 1, true),
    ('spot-2', 'Insta Help', 'in 10 mins', 'Trained house help when your maid is on leave', '#7C3AED', '#FFFFFF', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', '/category/cat-insta-help', 2, true),
    ('spot-3', 'Home repairs at', 'affordable prices', 'Electricians, plumbers, carpenters', '#2563EB', '#FFFFFF', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400', '/category/cat-electrician', 3, true),
    ('spot-4', 'Expert haircut at', 'your doorstep', 'Salon for men', '#0EA5E9', '#FFFFFF', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400', '/category/cat-salon-men', 4, true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
GRANT ALL ON public.spotlight_banners TO authenticated;
GRANT ALL ON public.spotlight_banners TO service_role;
GRANT ALL ON public.slots TO authenticated;
GRANT ALL ON public.slots TO service_role;
