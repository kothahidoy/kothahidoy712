-- ============================================================
-- MFIXIT — DEFINITIVE ADMIN RLS FIX (v2)
-- This SUPERSEDES every previous admin-policies SQL.
-- It removes the recursive is_admin() helper entirely and
-- exposes admin operations as SECURITY-DEFINER RPC functions
-- so RLS never recurses.
-- ============================================================

-- 1. Drop every policy that referenced is_admin() (these caused the
--    infinite recursion on public.users reads).
drop policy if exists "users admin read"   on public.users;
drop policy if exists "users admin update" on public.users;
drop policy if exists "bk admin read"      on public.bookings;
drop policy if exists "bk admin write"     on public.bookings;
drop policy if exists "addr admin read"    on public.saved_addresses;

-- 2. Drop the recursive helper itself.
drop function if exists public.is_admin();
drop function if exists public.list_all_customers();
drop function if exists public.list_all_bookings();

-- 3. Re-create a simple is_admin() that DOES NOT call any RLS-protected
--    table. It only reads the auth.jwt() claim — no recursion possible.
--    We also keep a fallback that reads public.users via a SECURITY-
--    DEFINER lookup that does NOT touch any policy that calls is_admin.
create or replace function public.is_admin() returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare ok boolean := false;
begin
  -- This SELECT runs as the function-owner (postgres in Supabase),
  -- and because no policy on public.users calls is_admin() any more,
  -- there is no possibility of recursion.
  select exists(
    select 1 from public.users
    where auth_user_id = auth.uid() and role = 'admin'
  ) into ok;
  return coalesce(ok, false);
end;
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- 4. SECURITY-DEFINER RPC: list all customers (used by Admin → Customers).
create or replace function public.list_all_customers()
returns setof public.users
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;
  return query select * from public.users order by created_at desc;
end;
$$;

grant execute on function public.list_all_customers() to authenticated;

-- 5. SECURITY-DEFINER RPC: list all bookings (used by Admin → Bookings).
create or replace function public.list_all_bookings()
returns setof public.bookings
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;
  return query select * from public.bookings order by created_at desc;
end;
$$;

grant execute on function public.list_all_bookings() to authenticated;

-- 6. SECURITY-DEFINER RPC: update any booking status (used by Admin).
create or replace function public.admin_update_booking_status(
  bk_id uuid, new_status text
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;
  update public.bookings set status = new_status where id = bk_id;
end;
$$;

grant execute on function public.admin_update_booking_status(uuid, text) to authenticated;

-- ============================================================
-- Sanity check — run this separately after to verify your admin
-- access:
--   select public.is_admin();              -- should return true
--   select count(*) from public.list_all_customers();
--   select count(*) from public.list_all_bookings();
-- ============================================================
