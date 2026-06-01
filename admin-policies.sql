-- Mfixit — Admin Row-Level-Security policies (RECURSION-FREE)
-- This SUPERSEDES the previous admin-policies.sql.
-- Run this AFTER the base schema in SUPABASE_SETUP.md.
--
-- Why this exists:
-- The earlier version added a "users admin read" policy on public.users
-- whose `using (public.is_admin())` clause queried public.users itself
-- → infinite recursion → all reads of public.users returned 500.
--
-- Fix:
--   * is_admin() now turns row-security OFF inside the function so its
--     internal lookup never re-triggers the same policy.
--   * The recursive admin SELECT/UPDATE policies on public.users are
--     dropped. Users keep "self select / self update" for their own row.
--     Admin listings of ALL customers are exposed through a SECURITY-
--     DEFINER RPC function below (list_all_customers) instead.
--
-- Steps to apply:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file → Run.
--   3. (One-time) promote your own user to admin:
--        update public.users set role = 'admin' where email = 'you@example.com';
--   4. In the Mfixit app, hard-refresh and pull-to-refresh Profile.

-- ── 1. Drop the recursive policies from the previous version ─────────
drop policy if exists "users admin read"   on public.users;
drop policy if exists "users admin update" on public.users;

-- ── 2. Recreate is_admin() so it bypasses RLS internally ─────────────
create or replace function public.is_admin() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare ok boolean;
begin
  -- Disable row-security for this nested query so we never recurse
  -- through a policy that itself invokes is_admin().
  perform set_config('row_security', 'off', true);
  select exists(
    select 1 from public.users
    where auth_user_id = auth.uid() and role = 'admin'
  ) into ok;
  return coalesce(ok, false);
end;
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- ── 3. BOOKINGS — admins can read & update everything ────────────────
drop policy if exists "bk admin read"  on public.bookings;
drop policy if exists "bk admin write" on public.bookings;

create policy "bk admin read"
  on public.bookings for select
  using (public.is_admin());

create policy "bk admin write"
  on public.bookings for update
  using (public.is_admin())
  with check (public.is_admin());

-- ── 4. ADDRESSES — admins can read everyone's addresses ──────────────
drop policy if exists "addr admin read" on public.saved_addresses;
create policy "addr admin read"
  on public.saved_addresses for select
  using (public.is_admin());

-- ── 5. RPC to list all customers for the Admin Panel ─────────────────
-- We use a SECURITY DEFINER function instead of a RLS policy on users
-- to avoid the recursion problem entirely.
create or replace function public.list_all_customers()
returns setof public.users
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;
  perform set_config('row_security', 'off', true);
  return query select * from public.users order by created_at desc;
end;
$$;

grant execute on function public.list_all_customers() to authenticated;

-- ── 6. Sanity check ──────────────────────────────────────────────────
-- After running, this should return your row with role='admin':
--   select id, full_name, email, phone, role from public.users
--   where auth_user_id = auth.uid();
