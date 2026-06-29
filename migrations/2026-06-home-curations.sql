-- Thoughtful Curations - home screen video cards
-- Run once in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS home_curations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_line2 TEXT,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure RLS is enabled and public read works (admin writes via service role)
ALTER TABLE home_curations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active home_curations" ON home_curations;
CREATE POLICY "Public can read active home_curations"
  ON home_curations FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access home_curations" ON home_curations;
CREATE POLICY "Service role full access home_curations"
  ON home_curations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional: seed with the same defaults the app used in mock mode (idempotent)
INSERT INTO home_curations (title, title_line2, thumbnail_url, video_url, sort_order, is_active)
SELECT * FROM (VALUES
  ('Roll-on', 'waxing',
   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
   1, true),
  ('MEN''S', 'HAIRCUT',
   'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
   2, true),
  ('Bathroom', 'Deep clean',
   'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=400&q=80',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
   3, true),
  ('AC', 'Service',
   'https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=400&q=80',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
   4, true)
) AS v(title, title_line2, thumbnail_url, video_url, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM home_curations);
