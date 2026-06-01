# Mfixit — Product Requirements

**Tagline:** Trusted Home Services at Your Doorstep.
**Stack:** Expo SDK 54, React Native, expo-router, TypeScript, Supabase (gracefully optional), AsyncStorage, lucide-react-native, expo-location.
**Theme:** Premium white & blue, rounded modern cards, smooth animations, bottom-tab navigation.

## Customer MVP (delivered)

- Animated splash → auth gate → tabs.
- Auth: phone OTP flow (Supabase wired, falls back to demo OTP), Google CTA, skip-to-explore.
- Profile setup: name + city (Durgapur / Burdwan / Kolkata / Asansol / Howrah).
- Home: city + greeting, search, 3 swipable offer banners, 9-category grid, popular services, top-rated pros, recommended (wide cards), top-rated services rail.
- Category screen: lists all services in a category.
- Service details: hero image, rating pill, duration, description, what's included checklist, trust grid, customer reviews, related services, sticky Book Now CTA.
- Booking flow: date strip (next 7 days), 8 time slots, GPS auto-detect + reverse geocode, address + landmark + city, notes, promo code (MFIX30 / COOLAC / WEEKEND25), live bill summary, confirm.
- Animated booking confirmation screen with booking ID.
- My Bookings: Active / Completed / Cancelled tabs.
- Booking detail: contact pro, mark complete, cancel, 5-star rate.
- Offers tab: 3 promo banners with copy-code, discount badges, expiry.
- Profile: avatar, city pill, member-since, 24x7 support, menu (addresses, notifications, language, refer, help, privacy, settings, sign out).
- Saved addresses CRUD with GPS detect + reverse geocode.
- Help & support: WhatsApp / phone / email contacts + accordion FAQ.
- Permission flow for foreground location with contextual button + reverse-geocode pre-fill.

## Backend layer

- Supabase client created in `src/lib/supabase.ts` with AsyncStorage session adapter.
- Demo mode: `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` empty → seed data + AsyncStorage.
- Production mode: paste keys into `.env`, restart — services / categories / offers read from Supabase, phone OTP routes through `supabase.auth.signInWithOtp` + `verifyOtp`.
- Full SQL schema + RLS policies in `/app/SUPABASE_SETUP.md` (users, categories, services, saved_addresses, bookings, reviews, notifications, offers).

## Scalability foundations (ready for next iterations)

- Bengali language ready (string layer centralised, can swap to i18n).
- Multi-city support (city selector wired across profile + booking + addresses).
- Vendor-app / admin panel ready data model.
- Realtime booking updates ready (Supabase channels described in playbook).
- Push notifications ready to wire via Emergent-managed flow.

## Future enhancements

- Stripe / Razorpay payment integration on booking confirm.
- Live technician tracking with `Location.watchPosition` + Supabase realtime.
- Vendor app (file scaffold under `app/(vendor)`).
- Admin dashboard (React-based, separate `/admin` deploy).

## Session updates — June 2025

- **Admin role sync fix**: `getProfile` now returns the public.users row even when `full_name` is null; `role` is included in `UserProfile`. `useSession()` exposes a reactive `isAdmin` flag.
- **Profile screen**: pull-to-refresh + auto-refresh on focus to instantly pick up role changes.
- **Sign-out**: hardened — clears Supabase session, AsyncStorage caches, and `sb-*` localStorage keys; hard redirects to `/welcome` on web.
- **Home search**: now filters across the full service catalog (title + description + category name) with empty-state messaging and a Clear button.
- **Admin RLS**: added `/app/admin-policies.sql` with an `is_admin()` helper + policies so users with `role='admin'` can read all bookings / customers / addresses from the Admin Panel.

