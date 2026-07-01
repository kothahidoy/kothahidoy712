-- ─────────────────────────────────────────────────────────────
-- Mfixit notifications table + realtime triggers
-- ─────────────────────────────────────────────────────────────
-- Table stores in-app notifications for customers / admins / providers.
-- Frontend subscribes via Supabase Realtime and plays a bell sound
-- until the row is marked seen=true (or acknowledged=true for provider).

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  target_type   text not null check (target_type in ('customer', 'admin', 'provider')),
  target_id     uuid,                              -- customer_id / provider_id ; NULL for admin (broadcast)
  booking_id    uuid references public.bookings(id) on delete cascade,
  kind          text not null,                    -- 'new_booking' | 'assigned' | 'accepted' | 'on_the_way' | 'completed' | 'cancelled' | 'custom'
  title         text not null,
  body          text default '',
  seen          boolean not null default false,   -- user has viewed / dismissed
  acknowledged  boolean not null default false,   -- provider clicked "Ready" (stops ringing)
  data          jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_target_idx
  on public.notifications (target_type, target_id, seen, created_at desc);

create index if not exists notifications_booking_idx
  on public.notifications (booking_id);

-- Enable Realtime replication on this table (Supabase dashboard picks it up
-- automatically for any table added to the `supabase_realtime` publication).
alter publication supabase_realtime add table public.notifications;


-- ─────────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.notifications enable row level security;

-- Customers read their own notifications
drop policy if exists "notif_customer_read" on public.notifications;
create policy "notif_customer_read"
on public.notifications for select
using (target_type = 'customer' and target_id = auth.uid());

-- Providers read notifications targeted at them.
-- We match auth.uid() ↔ providers.user_id (see provider-system.sql).
drop policy if exists "notif_provider_read" on public.notifications;
create policy "notif_provider_read"
on public.notifications for select
using (
  target_type = 'provider'
  and exists (
    select 1 from public.providers p
    where p.id = target_id and p.user_id = auth.uid()
  )
);

-- Admins read ALL notifications (admin dashboard needs to see everything).
drop policy if exists "notif_admin_read" on public.notifications;
create policy "notif_admin_read"
on public.notifications for select
using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- Any authenticated user (customer / provider / admin) can UPDATE the
-- `seen` / `acknowledged` flags on their OWN notifications.
drop policy if exists "notif_self_update" on public.notifications;
create policy "notif_self_update"
on public.notifications for update
using (
  -- customer marking their own
  (target_type = 'customer' and target_id = auth.uid())
  or
  -- provider marking their own
  (target_type = 'provider' and exists (
    select 1 from public.providers p
    where p.id = target_id and p.user_id = auth.uid()
  ))
  or
  -- admin marking any
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
)
with check (true);


-- ─────────────────────────────────────────────────────────────
-- Trigger 1: new booking → notify admins
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
    coalesce('₹' || new.price::text || ' • ' || coalesce(new.address, 'no address'), 'A new booking has been placed'),
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
  -- provider ring (only when provider_id newly set)
  if new.provider_id is not null
     and (old.provider_id is null or new.provider_id <> old.provider_id) then
    insert into public.notifications (target_type, target_id, booking_id, kind, title, body, data)
    values (
      'provider', new.provider_id, new.id, 'assigned',
      'New job assigned',
      'Tap Ready to accept the job',
      jsonb_build_object('booking_id', new.id, 'price', new.price)
    );

    -- also inform the customer
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
    -- Skip the "confirmed" status because we already notified on create.
    if new.status in ('in_progress', 'on_the_way', 'accepted', 'completed', 'cancelled') then
      case new.status
        when 'accepted'    then msg_title := 'Booking accepted';   msg_body := 'Your provider has accepted the job.';
        when 'on_the_way'  then msg_title := 'Provider on the way'; msg_body := 'Your provider is heading to your address.';
        when 'in_progress' then msg_title := 'Service started';    msg_body := 'Your provider has started the service.';
        when 'completed'   then msg_title := 'Service completed';   msg_body := 'Thanks for booking with Mfixit! Rate your experience.';
        when 'cancelled'   then msg_title := 'Booking cancelled';   msg_body := 'Your booking has been cancelled.';
        else                     msg_title := 'Booking update';     msg_body := 'Status: ' || new.status;
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


-- ─────────────────────────────────────────────────────────────
-- Helper: get unseen count for badge
-- ─────────────────────────────────────────────────────────────
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
