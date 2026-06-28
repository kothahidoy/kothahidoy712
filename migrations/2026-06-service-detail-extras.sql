-- Mfixit — Service Detail extras
-- Adds Glow gallery, Why Women Love Us, and image_url per process step
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS gallery_title TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS loveus_title TEXT,
  ADD COLUMN IF NOT EXISTS loveus_items JSONB DEFAULT '[]'::jsonb;

-- Sanity: confirm columns now exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'services'
  AND column_name IN ('gallery_title','gallery_images','loveus_title','loveus_items')
ORDER BY column_name;
