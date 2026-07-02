-- ─────────────────────────────────────────────────────────────
-- Mfixit notifications table + realtime triggers (v2, schema-adapted)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  target_type   text not null check (target_type in ('customer', 'admin', 'provider')),
  target_id     uuid,
  booking_id    uuid references public.bookings(id) on delete cascade,
  kind          text not null,
  title         text not null,
  body          text default '',
  seen          boolean not null default false,
  acknowledged  boolean not null default false,
  data          jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_target_idx
  on public.notifications (target_type, target_id, seen, created_at desc);
create index if not exists notifications_booking_idx
  on public.notifications (booking_id);

-- Realtime replication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- RLS — permissive for Phase 1 (in-app). Frontend already filters
-- by target_type + target_id client-side. Backend inserts via
-- SECURITY DEFINER triggers (bypass RLS).
-- ─────────────────────────────────────────────────────────────
alter table public.notifications enable row level security;

drop policy if exists "notif_read_all_authed" on public.notifications;
create policy "notif_read_all_authed"
on public.notifications for select
to authenticated, anon
using (true);

drop policy if exists "notif_update_all_authed" on public.notifications;
create policy "notif_update_all_authed"
on public.notifications for update
to authenticated, anon
using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- Trigger 1: new booking → notify admin (broadcast)
-- ─────────────────────────────────────────────────────────────
create or replace function public.fn_notify_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (target_type, target_id, booking_id, kind, title, body, data)
  values (
    'admin', null, new.id, 'new_booking',
    'New booking received',
    coalesce('₹' || new.price::text, 'A new booking has been placed'),
    jsonb_build_object('booking_id', new.id, 'price', new.price, 'status', new.status)
  );
  return new;
end;
$$;

drop trigger if exists trg_new_booking_notify on public.bookings;
create trigger trg_new_booking_notify
after insert on public.bookings
for each row execute function public.fn_notify_new_booking();

-- ─────────────────────────────────────────────────────────────
-- Trigger 2: provider assigned → notify provider (ring) + customer
-- ─────────────────────────────────────────────────────────────
create or replace function public.fn_notify_provider_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.provider_id is not null
     and (old.provider_id is null or new.provider_id <> old.provider_id) then
    insert into public.notifications (target_type, target_id, booking_id, kind, title, body, data)
    values (
      'provider', new.provider_id, new.id, 'assigned',
      'New job assigned',
      'Tap Ready to accept the job',
      jsonb_build_object('booking_id', new.id, 'price', new.price)
    );

    if new.customer_id is not null then
      insert into public.notifications (target_type, target_id, booking_id, kind, title, body, data)
      values (
        'customer', new.customer_id, new.id, 'assigned',
        'Provider assigned',
        'A verified pro has been assigned to your booking.',
        jsonb_build_object('booking_id', new.id, 'provider_id', new.provider_id)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_provider_assigned on public.bookings;
create trigger trg_provider_assigned
after update on public.bookings
for each row execute function public.fn_notify_provider_assigned();

-- ─────────────────────────────────────────────────────────────
-- Trigger 3: booking status change → notify customer
-- ─────────────────────────────────────────────────────────────
create or replace function public.fn_notify_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  msg_title text;
  msg_body  text;
begin
  if new.status is distinct from old.status and new.customer_id is not null then
    if new.status in ('in_progress', 'on_the_way', 'accepted', 'completed', 'cancelled') then
      case new.status
        when 'accepted'    then msg_title := 'Booking accepted';    msg_body := 'Your provider has accepted the job.';
        when 'on_the_way'  then msg_title := 'Provider on the way'; msg_body := 'Your provider is heading to your address.';
        when 'in_progress' then msg_title := 'Service started';     msg_body := 'Your provider has started the service.';
        when 'completed'   then msg_title := 'Service completed';   msg_body := 'Thanks for booking with Mfixit! Rate your experience.';
        when 'cancelled'   then msg_title := 'Booking cancelled';   msg_body := 'Your booking has been cancelled.';
        else                    msg_title := 'Booking update';      msg_body := 'Status: ' || new.status;
      end case;

      insert into public.notifications (target_type, target_id, booking_id, kind, title, body, data)
      values (
        'customer', new.customer_id, new.id, new.status,
        msg_title, msg_body,
        jsonb_build_object('booking_id', new.id, 'status', new.status)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_status_change on public.bookings;
create trigger trg_status_change
after update on public.bookings
for each row execute function public.fn_notify_status_change();

-- Helper: unseen count
create or replace function public.notif_unseen_count(p_target_type text, p_target_id uuid)
returns int
language sql
security definer
as $$
  select count(*)::int
  from public.notifications
  where target_type = p_target_type
    and (target_id = p_target_id or (p_target_type = 'admin' and target_id is null))
    and seen = false;
$$;
