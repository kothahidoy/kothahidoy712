-- Home page promo carousel slides (image OR video)
-- Run once in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS home_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  price TEXT,
  original_price TEXT,
  discount_label TEXT,
  badge_emoji TEXT DEFAULT '🏷️',
  cta_text TEXT DEFAULT 'Book now',
  link_url TEXT,
  media_type TEXT DEFAULT 'image',
  media_url TEXT NOT NULL,
  poster_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
