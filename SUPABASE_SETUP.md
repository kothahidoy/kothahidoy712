# Mfixit — Supabase Setup Guide

The app is fully functional in **demo mode** out of the box (using seed data + AsyncStorage). To switch on the real Supabase backend, follow these steps.

---

## 1. Create your Supabase project

1. Visit https://supabase.com → **New project**.
2. Pick a name (e.g. `mfixit-prod`), choose a strong DB password, region closest to your users (Mumbai / Singapore for India).
3. Wait ~1 minute for provisioning.

---

## 2. Add credentials to the app

Open **Project Settings → API** in Supabase dashboard and copy:

- `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
- `anon public key` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Paste them into `/app/frontend/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

Restart Expo: `sudo supervisorctl restart expo`.

The app will now talk to Supabase automatically (`isSupabaseConfigured` flips to `true` in `src/lib/supabase.ts`).

---

## 3. Create the database schema

Open Supabase **SQL Editor → New query** and paste the full schema below. Run.

```sql
create extension if not exists "uuid-ossp";
create extension if not exists moddatetime schema extensions;

-- USERS (profile linked to auth.users)
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid not null unique,
  role text not null default 'customer' check (role in ('customer','provider','admin')),
  full_name text,
  phone text,
  email text,
  avatar_url text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create trigger handle_updated_at_users
before update on public.users
for each row execute procedure moddatetime (updated_at);

-- CATEGORIES
create table public.categories (
  id text primary key,
  name text not null,
  icon text not null,
  color text not null default '#EFF6FF',
  description text,
  created_at timestamptz not null default now()
);

-- SERVICES
create table public.services (
  id text primary key,
  category_id text not null references public.categories(id),
  title text not null,
  description text,
  starting_price numeric(10,2) not null,
  duration_mins integer not null,
  rating numeric(3,2) default 4.7,
  review_count integer default 0,
  image text,
  popular boolean default false,
  top_rated boolean default false,
  recommended boolean default false,
  inclusions jsonb,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- SAVED ADDRESSES
create table public.saved_addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text,
  address_line text not null,
  landmark text,
  city text not null,
  latitude double precision,
  longitude double precision,
  is_default boolean default false,
  created_at timestamptz not null default now()
);

-- BOOKINGS
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.users(id) on delete cascade,
  service_id text not null references public.services(id),
  scheduled_date date not null,
  time_slot text not null,
  address jsonb not null,
  notes text,
  price numeric(10,2) not null,
  status text not null default 'confirmed'
    check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  rating integer check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now()
);
create index bookings_customer_idx on public.bookings(customer_id);

-- OFFERS
create table public.offers (
  id text primary key,
  title text not null,
  subtitle text,
  code text unique not null,
  discount_percent numeric(5,2) not null,
  valid_until date,
  banner_url text,
  bg_color text default '#2563EB'
);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  booking_id uuid references public.bookings(id),
  is_read boolean default false,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.users           enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.bookings        enable row level security;
alter table public.notifications   enable row level security;

-- Public read on services / categories / offers
alter table public.categories enable row level security;
alter table public.services   enable row level security;
alter table public.offers     enable row level security;
create policy "public categories read" on public.categories for select using (true);
create policy "public services read"   on public.services   for select using (is_active = true);
create policy "public offers read"     on public.offers     for select using (true);

-- Helper
create or replace function public.current_user_id() returns uuid language sql as $$
  select id from public.users where auth_user_id = auth.uid();
$$;

-- Users: self only
create policy "users self" on public.users for select using (auth_user_id = auth.uid());
create policy "users self upsert" on public.users for insert with check (auth_user_id = auth.uid());
create policy "users self update" on public.users for update using (auth_user_id = auth.uid());

-- Addresses: self only
create policy "addr self r" on public.saved_addresses for select using (user_id = public.current_user_id());
create policy "addr self w" on public.saved_addresses for all using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

-- Bookings: self only
create policy "bk self r" on public.bookings for select using (customer_id = public.current_user_id());
create policy "bk self w" on public.bookings for all using (customer_id = public.current_user_id())
  with check (customer_id = public.current_user_id());

-- Notifications: self only
create policy "notif self r" on public.notifications for select using (user_id = public.current_user_id());
```

---

## 4. Seed categories / services / offers

Run this SQL once to seed the marketplace inventory:

```sql
insert into public.categories (id, name, icon, color) values
  ('electrician','Electrician','Zap','#FEF3C7'),
  ('plumber','Plumber','Droplets','#DBEAFE'),
  ('ac-repair','AC Repair','Wind','#CFFAFE'),
  ('cleaning','Cleaning','Sparkles','#DCFCE7'),
  ('carpenter','Carpenter','Hammer','#FEE2E2'),
  ('painting','Painting','PaintBucket','#FCE7F3'),
  ('appliance','Appliance','Refrigerator','#E0E7FF'),
  ('salon','Salon at Home','Scissors','#FFEDD5'),
  ('pest-control','Pest Control','Bug','#F3E8FF');
-- (Re-run scripts/seed-services.sql for the 13 services included in seed.ts)
```

You can mirror the contents of `/app/frontend/src/data/seed.ts` here — they share the same column names except snake_case.

---

## 5. Enable Phone OTP

1. Supabase Dashboard → **Authentication → Providers → Phone** → toggle on.
2. Pick an SMS provider (**Twilio** recommended for India):
   - Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGE_SERVICE_SID` from your Twilio console.
3. Default rate limit is 1 OTP / 60 seconds — adjust under **Rate limits** if needed.

Once configured, the `phone.tsx` screen automatically sends a real SMS via `supabase.auth.signInWithOtp`, and `verify.tsx` verifies it via `supabase.auth.verifyOtp`.

---

## 6. Enable Google Social Login

1. **Google Cloud Console** → APIs & Services → Credentials → **Create OAuth Client ID** (Web application).
   - Authorized JavaScript origins: `https://<your-project-ref>.supabase.co`
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. Copy **Client ID** + **Client Secret**.
3. Supabase → **Authentication → Providers → Google** → paste them → enable.
4. The "Continue with Google" button on the welcome screen will then route through Supabase. For full OAuth in Expo Go, follow the playbook in `INTEGRATION_PLAYBOOK.md` (uses `expo-auth-session`).

---

## 7. Test connection

After saving credentials & restarting Expo, the app will:

- Read **categories / services / offers** from Supabase tables (falls back to seed data if empty).
- Send a real SMS OTP on the phone screen.
- Persist sessions via AsyncStorage automatically.
- Continue to keep **bookings & addresses** in local AsyncStorage until you choose to migrate them too (the data layer is already abstracted, you just enable Supabase writes inside `src/data/service.ts`).

---

## 8. Going to production

- Enable **PITR backups** (Supabase Pro plan).
- Turn off public anon writes for any tables you haven't explicitly protected with RLS.
- Add a `service_role` key to a small backend (Edge Function) if you need server-side seeding or admin operations — never ship it in the app.

That's it! Your Mfixit backend is live. 🎉
