-- =============================================================================
-- Mfixit — profiles schema for MSG91 WhatsApp OTP + Supabase
-- Run this in Supabase Studio  →  SQL Editor  →  New query  →  Run.
-- Safe to re-run (uses CREATE IF NOT EXISTS / OR REPLACE everywhere).
-- =============================================================================

-- 1. Profile table keyed by phone (no link to auth.users — we mint our own JWT)
create table if not exists public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  phone               text unique not null,
  name                text,
  email               text,
  avatar_url          text,
  role                text not null default 'user' check (role in ('user','admin','provider')),
  phone_verified_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_profiles_phone   on public.profiles(phone);
create index if not exists idx_profiles_role    on public.profiles(role);

-- 2. Auto-update `updated_at`
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 3. Row Level Security
alter table public.profiles enable row level security;

-- Drop old policies (idempotent)
drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_self_insert on public.profiles;

-- A user can read their own row (auth.uid() matches profile.id because we
-- put the profile.id into the JWT `sub` claim when we mint the session).
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id);

-- A user can update their own row.
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- A user can insert a row only for themselves (rarely used — backend
-- normally inserts via service-role, which bypasses RLS).
create policy profiles_self_insert on public.profiles
  for insert with check (auth.uid() = id);

-- =============================================================================
-- Quick smoke test — should return one row after first OTP verify:
--   select id, phone, role, phone_verified_at from public.profiles;
-- =============================================================================
