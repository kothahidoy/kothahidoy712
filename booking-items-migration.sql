-- ─────────────────────────────────────────────────────────────
-- booking_items: one row per service in a booking (cart line item)
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.booking_items (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id     uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id     text NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    title          text NOT NULL,
    image          text,
    price          numeric(10,2) NOT NULL DEFAULT 0,
    quantity       integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    line_total     numeric(10,2) GENERATED ALWAYS AS (price * quantity) STORED,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_items_booking_id_idx ON public.booking_items(booking_id);
CREATE INDEX IF NOT EXISTS booking_items_service_id_idx ON public.booking_items(service_id);

-- Enable Row Level Security
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "booking_items_select_owner" ON public.booking_items;
DROP POLICY IF EXISTS "booking_items_insert_owner" ON public.booking_items;
DROP POLICY IF EXISTS "booking_items_service_role_all" ON public.booking_items;

-- Owners (users) can read their own booking's items
CREATE POLICY "booking_items_select_owner" ON public.booking_items
    FOR SELECT TO authenticated
    USING (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id::text = auth.uid()::text
        )
    );

-- Owners can insert items for their own booking
CREATE POLICY "booking_items_insert_owner" ON public.booking_items
    FOR INSERT TO authenticated
    WITH CHECK (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id::text = auth.uid()::text
        )
    );

-- service_role bypasses RLS automatically; no policy needed for backend.
-- But add an anon SELECT policy for admin views if needed (controlled at app layer).

-- ─────────────────────────────────────────────────────────────
-- Back-fill: copy any existing bookings.items JSON into the new table
-- (safe to run multiple times because of ON CONFLICT)
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.booking_items (booking_id, service_id, title, image, price, quantity)
SELECT
    b.id                                       AS booking_id,
    COALESCE(item->>'service_id', b.service_id) AS service_id,
    COALESCE(item->>'title', s.title, 'Service') AS title,
    COALESCE(item->>'image', s.image)          AS image,
    COALESCE((item->>'price')::numeric, s.starting_price, 0) AS price,
    COALESCE((item->>'quantity')::integer, 1)  AS quantity
FROM public.bookings b
LEFT JOIN LATERAL jsonb_array_elements(COALESCE(b.items, '[]'::jsonb)) AS item ON TRUE
LEFT JOIN public.services s ON s.id = COALESCE(item->>'service_id', b.service_id)
WHERE NOT EXISTS (
    SELECT 1 FROM public.booking_items bi WHERE bi.booking_id = b.id
);

-- Verify
SELECT
    (SELECT count(*) FROM public.booking_items) AS items_count,
    (SELECT count(*) FROM public.bookings)      AS bookings_count;
