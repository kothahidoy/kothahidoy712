-- Mfixit — Admin Row-Level-Security policies
-- Run this AFTER the base schema in SUPABASE_SETUP.md.
-- Allows users with role='admin' in public.users to read & manage
-- everyone else's bookings, addresses and profiles from the app's
-- Admin Panel.
--
-- Usage:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file → Run.
--   3. (One-time) promote your own user to admin:
--        update public.users set role = 'admin' where email = 'you@example.com';
--   4. In the Mfixit app, pull-to-refresh the Profile tab.
--      The "Admin Panel" option should appear.

-- Reusable helper: returns true when the *current* auth.uid() owns a
-- public.users row whose role is 'admin'.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

-- --- USERS ----------------------------------------------------------
-- Admins can read every profile row (for the Customers page).
drop policy if exists "users admin read" on public.users;
create policy "users admin read"
  on public.users for select
  using (public.is_admin());

-- Admins can also update any row (e.g. block / promote / edit city).
drop policy if exists "users admin update" on public.users;
create policy "users admin update"
  on public.users for update
  using (public.is_admin());

-- --- BOOKINGS -------------------------------------------------------
drop policy if exists "bk admin read" on public.bookings;
create policy "bk admin read"
  on public.bookings for select
  using (public.is_admin());

drop policy if exists "bk admin write" on public.bookings;
create policy "bk admin write"
  on public.bookings for update
  using (public.is_admin())
  with check (public.is_admin());

-- --- ADDRESSES (for admin to see where to dispatch technician) ------
drop policy if exists "addr admin read" on public.saved_addresses;
create policy "addr admin read"
  on public.saved_addresses for select
  using (public.is_admin());
