-- Mfixit — Razorpay payment columns
-- Run once in Supabase SQL Editor.

alter table public.bookings
  add column if not exists payment_status text
    not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  add column if not exists payment_method text
    check (payment_method in ('razorpay', 'cash')),
  add column if not exists payment_id     text,   -- razorpay_payment_id
  add column if not exists payment_order  text,   -- razorpay_order_id
  add column if not exists paid_at        timestamptz;

-- Helpful index for the "completed but unpaid" Pay-now list.
create index if not exists bookings_payment_status_idx
  on public.bookings (payment_status);
