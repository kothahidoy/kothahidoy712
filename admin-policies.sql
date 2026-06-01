-- ============================================================
-- MFIXIT — FINAL FIX (v3): get_my_profile RPC + nuke recursive policies
-- This SUPERSEDES every previous admin-policies SQL.
-- The frontend now reads profiles through get_my_profile() so even if
-- a stray recursive RLS policy ever sneaks in again, login still works.
-- ============================================================

-- 1. NUCLEAR DROP: remove any policy on public.users whose condition
--    references is_admin() (these caused the infinite recursion).
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname='public' and tablename='users'
      and (qual like '%is_admin%' or with_check like '%is_admin%')
  loop
    execute format('drop policy if exists %I on public.users', r.policyname);
  end loop;
end$$;

-- Also drop any leftover admin policies on bookings / addresses.
drop policy if exists "bk admin read"      on public.bookings;
drop policy if exists "bk admin write"     on public.bookings;
drop policy if exists "addr admin read"    on public.saved_addresses;

-- 2. Re-create a clean, non-recursive is_admin() helper.
drop function if exists public.is_admin();
create or replace function public.is_admin() returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare ok boolean := false;
begin
  select exists(
    select 1 from public.users
    where auth_user_id = auth.uid() and role = 'admin'
  ) into ok;
  return coalesce(ok, false);
end;
$$;
grant execute on function public.is_admin() to authenticated, anon;

-- 3. RPC the app uses for profile reads — bypasses RLS entirely.
create or replace function public.get_my_profile()
returns table(
  id uuid, full_name text, phone text, email text, avatar_url text,
  city text, created_at timestamptz, role text, auth_user_id uuid
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return query
    select u.id, u.full_name, u.phone, u.email, u.avatar_url,
           u.city, u.created_at, u.role::text, u.auth_user_id
    from public.users u
    where u.auth_user_id = auth.uid();
end;
$$;
grant execute on function public.get_my_profile() to authenticated, anon;

-- 4. Admin RPCs used by the Admin Panel.
drop function if exists public.list_all_customers();
create or replace function public.list_all_customers()
returns setof public.users
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  return query select * from public.users order by created_at desc;
end;
$$;
grant execute on function public.list_all_customers() to authenticated;

drop function if exists public.list_all_bookings();
create or replace function public.list_all_bookings()
returns setof public.bookings
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  return query select * from public.bookings order by created_at desc;
end;
$$;
grant execute on function public.list_all_bookings() to authenticated;

drop function if exists public.admin_update_booking_status(uuid, text);
create or replace function public.admin_update_booking_status(bk_id uuid, new_status text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  update public.bookings set status = new_status where id = bk_id;
end;
$$;
grant execute on function public.admin_update_booking_status(uuid, text) to authenticated;

-- ============================================================
-- Sanity checks (run separately AS the authenticated user via the app
-- if you want; from the SQL editor they'll return false because no JWT
-- is present in raw editor sessions):
--   select public.is_admin();
--   select * from public.get_my_profile();
--   select * from public.list_all_customers();
-- ============================================================
