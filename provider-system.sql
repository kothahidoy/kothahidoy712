-- ============================================================
-- MFIXIT — PROVIDER SYSTEM MIGRATION
-- Run this SQL in your Supabase SQL Editor to enable the provider
-- assignment workflow.
-- ============================================================

-- 1. CREATE PROVIDERS TABLE
-- service_type maps to category.id (e.g., 'electrician', 'plumber')
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  service_type text not null,  -- matches category.id
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()  -- for future auto-release logic
);

-- Enable RLS
alter table public.providers enable row level security;

-- Basic read policy for authenticated users
create policy "providers_read" on public.providers
  for select to authenticated using (true);

-- 2. UPDATE BOOKINGS TABLE
-- Add provider_id column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'bookings'
    and column_name = 'provider_id'
  ) then
    alter table public.bookings add column provider_id uuid references public.providers(id);
  end if;
end$$;

-- Add status constraint (drop first if exists to update)
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'));

-- 3. ADMIN RPCs FOR PROVIDER MANAGEMENT

-- List all providers (admin only)
drop function if exists public.admin_list_providers();
create or replace function public.admin_list_providers()
returns table(
  id uuid,
  name text,
  phone text,
  service_type text,
  is_available boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  return query select p.id, p.name, p.phone, p.service_type, p.is_available, p.created_at, p.updated_at
    from public.providers p
    order by p.name;
end;
$$;
grant execute on function public.admin_list_providers() to authenticated;

-- Get available providers for a specific service type (category)
drop function if exists public.admin_available_providers_for(text);
create or replace function public.admin_available_providers_for(category_id text)
returns table(
  id uuid,
  name text,
  phone text,
  service_type text,
  is_available boolean
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  return query select p.id, p.name, p.phone, p.service_type, p.is_available
    from public.providers p
    where p.service_type = category_id
      and p.is_available = true
    order by p.name;
end;
$$;
grant execute on function public.admin_available_providers_for(text) to authenticated;

-- Assign provider to booking (ATOMIC - prevents double assignment & race conditions)
drop function if exists public.admin_assign_provider(uuid, uuid);
create or replace function public.admin_assign_provider(booking_id uuid, provider_id uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  rows_updated int;
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  
  -- Verify booking exists and has no provider assigned yet
  if not exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.provider_id is null
      and b.status not in ('completed', 'cancelled')
  ) then
    raise exception 'Booking not available for assignment (already assigned, completed, or cancelled)';
  end if;
  
  -- Verify provider exists and is available
  if not exists (
    select 1 from public.providers p
    where p.id = provider_id
      and p.is_available = true
  ) then
    raise exception 'Provider not available';
  end if;
  
  -- ATOMIC UPDATE: Assign provider to booking and mark provider unavailable
  update public.bookings
  set provider_id = admin_assign_provider.provider_id,
      status = 'assigned'
  where id = booking_id
    and bookings.provider_id is null;  -- Double-check to prevent race condition
  
  get diagnostics rows_updated = row_count;
  if rows_updated = 0 then
    raise exception 'Assignment failed - booking may have been assigned by another admin';
  end if;
  
  update public.providers
  set is_available = false,
      updated_at = now()
  where id = admin_assign_provider.provider_id;
  
  return true;
end;
$$;
grant execute on function public.admin_assign_provider(uuid, uuid) to authenticated;

-- Create a new provider (admin only)
drop function if exists public.admin_create_provider(text, text, text);
create or replace function public.admin_create_provider(
  p_name text,
  p_phone text,
  p_service_type text
)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  new_id uuid;
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  
  insert into public.providers (name, phone, service_type)
  values (p_name, p_phone, p_service_type)
  returning id into new_id;
  
  return new_id;
end;
$$;
grant execute on function public.admin_create_provider(text, text, text) to authenticated;

-- 4. PROVIDER PORTAL RPCs

-- Provider login by phone (returns provider data or null)
drop function if exists public.provider_login(text);
create or replace function public.provider_login(p_phone text)
returns table(
  id uuid,
  name text,
  phone text,
  service_type text,
  is_available boolean
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  -- Normalize phone: remove all non-digit characters
  p_phone := regexp_replace(p_phone, '\D', '', 'g');
  
  return query select p.id, p.name, p.phone, p.service_type, p.is_available
    from public.providers p
    where regexp_replace(p.phone, '\D', '', 'g') = p_phone
    limit 1;
end;
$$;
grant execute on function public.provider_login(text) to authenticated, anon;

-- List jobs assigned to a provider (only assigned/in_progress)
drop function if exists public.list_provider_jobs(uuid);
create or replace function public.list_provider_jobs(p_provider_id uuid)
returns setof public.bookings
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return query select b.*
    from public.bookings b
    where b.provider_id = p_provider_id
      and b.status in ('assigned', 'in_progress')
    order by b.scheduled_date asc, b.time_slot asc;
end;
$$;
grant execute on function public.list_provider_jobs(uuid) to authenticated, anon;

-- Provider starts job (assigned -> in_progress)
drop function if exists public.provider_start_job(uuid, uuid);
create or replace function public.provider_start_job(p_provider_id uuid, p_booking_id uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  rows_updated int;
begin
  -- Enforce status transition: only assigned -> in_progress
  update public.bookings
  set status = 'in_progress'
  where id = p_booking_id
    and provider_id = p_provider_id
    and status = 'assigned';  -- Must be assigned to start
  
  get diagnostics rows_updated = row_count;
  if rows_updated = 0 then
    raise exception 'Cannot start job - must be in assigned status';
  end if;
  
  return true;
end;
$$;
grant execute on function public.provider_start_job(uuid, uuid) to authenticated, anon;

-- Provider completes job (in_progress -> completed, provider becomes available)
drop function if exists public.provider_complete_job(uuid, uuid);
create or replace function public.provider_complete_job(p_provider_id uuid, p_booking_id uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  rows_updated int;
begin
  -- Enforce status transition: only in_progress -> completed
  update public.bookings
  set status = 'completed'
  where id = p_booking_id
    and provider_id = p_provider_id
    and status = 'in_progress';  -- Must be in_progress to complete
  
  get diagnostics rows_updated = row_count;
  if rows_updated = 0 then
    raise exception 'Cannot complete job - must be in in_progress status';
  end if;
  
  -- Mark provider as available again
  update public.providers
  set is_available = true,
      updated_at = now()
  where id = p_provider_id;
  
  return true;
end;
$$;
grant execute on function public.provider_complete_job(uuid, uuid) to authenticated, anon;

-- 5. UPDATED list_all_bookings TO INCLUDE PROVIDER INFO
-- Drop and recreate to include provider_id and provider name
drop function if exists public.list_all_bookings();
create or replace function public.list_all_bookings()
returns table(
  id uuid,
  customer_id uuid,
  service_id text,
  scheduled_date date,
  time_slot text,
  address jsonb,
  notes text,
  price numeric,
  status text,
  rating int,
  review text,
  created_at timestamptz,
  payment_status text,
  payment_method text,
  payment_id text,
  paid_at timestamptz,
  provider_id uuid,
  provider_name text
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  return query select
    b.id, b.customer_id, b.service_id, b.scheduled_date, b.time_slot,
    b.address, b.notes, b.price, b.status, b.rating, b.review, b.created_at,
    b.payment_status, b.payment_method, b.payment_id, b.paid_at,
    b.provider_id, p.name as provider_name
  from public.bookings b
  left join public.providers p on p.id = b.provider_id
  order by b.created_at desc;
end;
$$;
grant execute on function public.list_all_bookings() to authenticated;

-- 6. SEED DEMO PROVIDERS (Optional - run this to have test data)
-- insert into public.providers (name, phone, service_type) values
--   ('Rahul Sharma', '9876543210', 'electrician'),
--   ('Amit Kumar', '9876543211', 'plumber'),
--   ('Suresh Patel', '9876543212', 'ac-repair'),
--   ('Priya Singh', '9876543213', 'cleaning'),
--   ('Rajesh Verma', '9876543214', 'electrician'),
--   ('Mohammed Ali', '9876543215', 'carpenter');

-- ============================================================
-- END OF MIGRATION
-- ============================================================
