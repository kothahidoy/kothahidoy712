// Data layer — single facade the UI talks to.
//
// Behaviour:
//  - When Supabase env vars are set AND the user has an active session,
//    everything (profile / bookings / addresses) reads + writes Postgres
//    via supabase-js.
//  - Otherwise (anonymous "Explore without signing in" mode, or env vars
//    missing) we transparently fall back to local AsyncStorage so the app
//    is still fully functional offline / demo.
//
// Catalog (categories / services / offers) always reads Supabase first,
// then falls back to bundled seed data if the query returns empty.

import { storage } from "@/src/utils/storage";
import {
  CATEGORIES,
  OFFERS,
  PROFESSIONALS,
  SERVICES,
  TIME_SLOTS,
} from "@/src/data/seed";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import {
  Booking,
  BookingStatus,
  Category,
  Offer,
  Professional,
  SavedAddress,
  Service,
  UserProfile,
} from "@/src/types";

const BOOKINGS_KEY = "mfixit.bookings";
const ADDRESSES_KEY = "mfixit.addresses";
const PROFILE_KEY = "mfixit.profile";

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.getItem<string>(key, "");
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}

/**
 * Returns the public.users.id of the currently authenticated Supabase user,
 * or null if there's no session (anonymous demo mode).
 */
async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;
  if (!authUser) return null;

  // 1) Look up existing public.users row.
  const { data: row } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();
  if (row?.id) return row.id;

  // 2) Auto-create a minimal profile row on first call so RLS-protected
  //    inserts on bookings / saved_addresses succeed even if the profile
  //    setup screen wasn't reached for some reason.
  const { data: created } = await supabase
    .from("users")
    .insert({
      auth_user_id: authUser.id,
      phone: authUser.phone ?? null,
      email: authUser.email ?? null,
    })
    .select("id")
    .single();
  return created?.id ?? null;
}

// --- CATALOG ------------------------------------------------------------

export const dataService = {
  getCategories: async (): Promise<Category[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon, color, description, image_url")
        .order("name");
      if (!error && data && data.length) {
        return data.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          description: c.description ?? undefined,
          imageUrl: c.image_url ?? undefined,
        })) as Category[];
      }
    }
    return CATEGORIES;
  },

  getServices: async (): Promise<Service[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true);
      if (!error && data && data.length) {
        return data.map((s) => ({
          id: s.id,
          categoryId: s.category_id,
          title: s.title,
          description: s.description ?? "",
          startingPrice: Number(s.starting_price),
          durationMins: s.duration_mins,
          rating: Number(s.rating ?? 0),
          reviewCount: s.review_count ?? 0,
          image: s.image,
          popular: !!s.popular,
          topRated: !!s.top_rated,
          recommended: !!s.recommended,
          inclusions: s.inclusions ?? undefined,
        }));
      }
    }
    return SERVICES;
  },

  getServicesByCategory: async (categoryId: string): Promise<Service[]> => {
    const all = await dataService.getServices();
    return all.filter((s) => s.categoryId === categoryId);
  },

  getServiceById: async (id: string): Promise<Service | undefined> => {
    const all = await dataService.getServices();
    return all.find((s) => s.id === id);
  },

  getPopularServices: async (): Promise<Service[]> => {
    const all = await dataService.getServices();
    return all.filter((s) => s.popular);
  },

  getTopRatedServices: async (): Promise<Service[]> => {
    const all = await dataService.getServices();
    return [...all].sort((a, b) => b.rating - a.rating).slice(0, 6);
  },

  getRecommendedServices: async (): Promise<Service[]> => {
    const all = await dataService.getServices();
    return all.filter((s) => s.recommended);
  },

  getTopProfessionals: async (): Promise<Professional[]> => PROFESSIONALS,

  getOffers: async (): Promise<Offer[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("offers")
        .select(
          "id, title, subtitle, code, discount_percent, valid_until, banner_url, bg_color",
        )
        .order("id");
      if (!error && data && data.length) {
        return data.map((o) => ({
          id: o.id,
          title: o.title,
          subtitle: o.subtitle ?? "",
          code: o.code,
          discountPercent: Number(o.discount_percent),
          validUntil: o.valid_until,
          bannerUrl: o.banner_url,
          bgColor: o.bg_color,
        }));
      }
    }
    return OFFERS;
  },

  getTimeSlots: (): string[] => TIME_SLOTS,

  // --- BOOKINGS ---------------------------------------------------------

  listBookings: async (): Promise<Booking[]> => {
    const userId = await getCurrentUserId();
    if (userId && supabase) {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, service_id, scheduled_date, time_slot, address, notes, price, status, rating, review, created_at, payment_status, payment_method, payment_id, paid_at",
        )
        .eq("customer_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        // Resolve service title + image client-side from the catalog cache.
        const services = await dataService.getServices();
        const byId = new Map(services.map((s) => [s.id, s]));
        return data.map((b: any) => {
          const svc = byId.get(b.service_id);
          return {
            id: b.id,
            serviceId: b.service_id,
            serviceTitle: svc?.title ?? "Service",
            serviceImage: svc?.image ?? "",
            scheduledDate: b.scheduled_date,
            timeSlot: b.time_slot,
            address: b.address as SavedAddress,
            notes: b.notes ?? undefined,
            price: Number(b.price),
            status: b.status as BookingStatus,
            rating: b.rating ?? undefined,
            review: b.review ?? undefined,
            createdAt: b.created_at,
            paymentStatus: (b.payment_status ?? "unpaid") as any,
            paymentMethod: b.payment_method ?? undefined,
            paymentId: b.payment_id ?? undefined,
            paidAt: b.paid_at ?? undefined,
          };
        });
      }
    }
    return readJSON<Booking[]>(BOOKINGS_KEY, []);
  },

  createBooking: async (
    input: Omit<Booking, "id" | "createdAt" | "status"> & {
      paymentOrder?: string;
    },
  ): Promise<Booking> => {
    const userId = await getCurrentUserId();
    if (userId && supabase) {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: userId,
          service_id: input.serviceId,
          scheduled_date: input.scheduledDate.split("T")[0],
          time_slot: input.timeSlot,
          address: input.address,
          notes: input.notes ?? null,
          price: input.price,
          status: "confirmed",
          payment_status: input.paymentStatus ?? "unpaid",
          payment_method: input.paymentMethod ?? null,
          payment_id: input.paymentId ?? null,
          payment_order: input.paymentOrder ?? null,
          paid_at:
            input.paymentStatus === "paid"
              ? input.paidAt ?? new Date().toISOString()
              : null,
        })
        .select(
          "id, service_id, scheduled_date, time_slot, address, notes, price, status, created_at, payment_status, payment_method, payment_id, paid_at",
        )
        .single();
      if (!error && data) {
        return {
          id: data.id,
          serviceId: data.service_id,
          serviceTitle: input.serviceTitle,
          serviceImage: input.serviceImage,
          scheduledDate: data.scheduled_date,
          timeSlot: data.time_slot,
          address: data.address as SavedAddress,
          notes: data.notes ?? undefined,
          price: Number(data.price),
          status: data.status as BookingStatus,
          createdAt: data.created_at,
          paymentStatus: (data.payment_status ?? "unpaid") as any,
          paymentMethod: data.payment_method ?? undefined,
          paymentId: data.payment_id ?? undefined,
          paidAt: data.paid_at ?? undefined,
        };
      }
    }
    // AsyncStorage fallback (anonymous mode).
    const booking: Booking = {
      ...input,
      id: newId(),
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    const all = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    await writeJSON(BOOKINGS_KEY, [booking, ...all]);
    return booking;
  },

  cancelBooking: async (id: string): Promise<void> => {
    const userId = await getCurrentUserId();
    if (userId && supabase) {
      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("customer_id", userId);
      return;
    }
    const all = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    await writeJSON(
      BOOKINGS_KEY,
      all.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b)),
    );
  },

  submitReview: async (
    id: string,
    rating: number,
    review: string,
  ): Promise<void> => {
    const userId = await getCurrentUserId();
    if (userId && supabase) {
      await supabase
        .from("bookings")
        .update({ rating, review })
        .eq("id", id)
        .eq("customer_id", userId);
      return;
    }
    const all = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    await writeJSON(
      BOOKINGS_KEY,
      all.map((b) => (b.id === id ? { ...b, rating, review } : b)),
    );
  },

  markCompleted: async (id: string): Promise<void> => {
    const userId = await getCurrentUserId();
    if (userId && supabase) {
      await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", id)
        .eq("customer_id", userId);
      return;
    }
    const all = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    await writeJSON(
      BOOKINGS_KEY,
      all.map((b) => (b.id === id ? { ...b, status: "completed" as const } : b)),
    );
  },

  // --- ADDRESSES --------------------------------------------------------

  listAddresses: async (): Promise<SavedAddress[]> => {
    const userId = await getCurrentUserId();
    if (userId && supabase) {
      const { data, error } = await supabase
        .from("saved_addresses")
        .select(
          "id, label, address_line, landmark, city, latitude, longitude, is_default",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((a) => ({
          id: a.id,
          label: a.label ?? "Home",
          addressLine: a.address_line,
          landmark: a.landmark ?? undefined,
          city: a.city,
          latitude: Number(a.latitude ?? 0),
          longitude: Number(a.longitude ?? 0),
          isDefault: !!a.is_default,
        }));
      }
    }
    return readJSON<SavedAddress[]>(ADDRESSES_KEY, []);
  },

  saveAddress: async (
    input: Omit<SavedAddress, "id">,
  ): Promise<SavedAddress> => {
    const userId = await getCurrentUserId();
    if (userId && supabase) {
      // If this address is default, demote previous defaults first.
      if (input.isDefault) {
        await supabase
          .from("saved_addresses")
          .update({ is_default: false })
          .eq("user_id", userId);
      }
      const { data, error } = await supabase
        .from("saved_addresses")
        .insert({
          user_id: userId,
          label: input.label,
          address_line: input.addressLine,
          landmark: input.landmark ?? null,
          city: input.city,
          latitude: input.latitude,
          longitude: input.longitude,
          is_default: !!input.isDefault,
        })
        .select(
          "id, label, address_line, landmark, city, latitude, longitude, is_default",
        )
        .single();
      if (!error && data) {
        return {
          id: data.id,
          label: data.label ?? "Home",
          addressLine: data.address_line,
          landmark: data.landmark ?? undefined,
          city: data.city,
          latitude: Number(data.latitude ?? 0),
          longitude: Number(data.longitude ?? 0),
          isDefault: !!data.is_default,
        };
      }
    }
    const addr: SavedAddress = { ...input, id: newId() };
    const all = await readJSON<SavedAddress[]>(ADDRESSES_KEY, []);
    const next = input.isDefault
      ? [addr, ...all.map((a) => ({ ...a, isDefault: false }))]
      : [...all, addr];
    await writeJSON(ADDRESSES_KEY, next);
    return addr;
  },

  removeAddress: async (id: string): Promise<void> => {
    const userId = await getCurrentUserId();
    if (userId && supabase) {
      await supabase
        .from("saved_addresses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      return;
    }
    const all = await readJSON<SavedAddress[]>(ADDRESSES_KEY, []);
    await writeJSON(
      ADDRESSES_KEY,
      all.filter((a) => a.id !== id),
    );
  },

  // --- PROFILE ----------------------------------------------------------

  getProfile: async (): Promise<UserProfile | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      if (authUser) {
        // Try the SECURITY-DEFINER RPC first — bypasses RLS completely so
        // a lingering recursive policy on public.users can never break
        // the login flow.
        const { data: rpcRow, error: rpcErr } = await supabase.rpc(
          "get_my_profile",
        );
        const row = !rpcErr && rpcRow
          ? Array.isArray(rpcRow)
            ? rpcRow[0]
            : rpcRow
          : null;

        // Fallback to direct table read if the RPC isn't installed yet
        // (older databases). Will return null on recursion errors.
        let finalRow = row;
        if (!finalRow) {
          const { data: directRow } = await supabase
            .from("users")
            .select(
              "id, full_name, phone, email, avatar_url, city, created_at, role",
            )
            .eq("auth_user_id", authUser.id)
            .maybeSingle();
          finalRow = directRow;
        }

        if (finalRow) {
          const profile: UserProfile = {
            id: finalRow.id,
            name:
              finalRow.full_name ?? authUser.email?.split("@")[0] ?? "Guest",
            phone: finalRow.phone ?? authUser.phone ?? undefined,
            email: finalRow.email ?? authUser.email ?? undefined,
            avatar: finalRow.avatar_url ?? undefined,
            city: finalRow.city ?? "Durgapur",
            createdAt: finalRow.created_at,
            role: (finalRow.role as "customer" | "admin") ?? "customer",
          };
          await writeJSON(PROFILE_KEY, profile);
          return profile;
        }
        // Authenticated but no profile row yet — return a stub so the
        // UI knows the user is signed in (profile-setup will fill it).
        const stub: UserProfile = {
          id: authUser.id,
          name: authUser.user_metadata?.full_name ?? "",
          phone: authUser.phone ?? undefined,
          email: authUser.email ?? undefined,
          city: "Durgapur",
          createdAt: new Date().toISOString(),
          role: "customer",
        };
        return stub;
      }
    }
    return readJSON<UserProfile | null>(PROFILE_KEY, null);
  },

  saveProfile: async (
    profile: Omit<UserProfile, "id" | "createdAt"> & {
      id?: string;
      createdAt?: string;
    },
  ): Promise<UserProfile> => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;
      if (authUser) {
        const { data: upserted, error } = await supabase
          .from("users")
          .upsert(
            {
              auth_user_id: authUser.id,
              full_name: profile.name,
              phone: profile.phone ?? authUser.phone ?? null,
              email: profile.email ?? authUser.email ?? null,
              avatar_url: profile.avatar ?? null,
              city: profile.city,
            },
            { onConflict: "auth_user_id" },
          )
          .select("id, full_name, phone, email, avatar_url, city, created_at")
          .single();
        if (!error && upserted) {
          const next: UserProfile = {
            id: upserted.id,
            name: upserted.full_name,
            phone: upserted.phone ?? undefined,
            email: upserted.email ?? undefined,
            avatar: upserted.avatar_url ?? undefined,
            city: upserted.city ?? "Durgapur",
            createdAt: upserted.created_at,
          };
          await writeJSON(PROFILE_KEY, next);
          return next;
        }
      }
    }
    // Anonymous mode — local profile only.
    const existing = await readJSON<UserProfile | null>(PROFILE_KEY, null);
    const next: UserProfile = {
      id: existing?.id ?? newId(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      ...profile,
    };
    await writeJSON(PROFILE_KEY, next);
    return next;
  },

  signOut: async (): Promise<void> => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      // Even if Supabase signOut fails (network), clear everything locally.
      console.warn("[signOut] supabase.auth.signOut failed", e);
    }
    try {
      await storage.removeItem(PROFILE_KEY);
      await storage.removeItem(BOOKINGS_KEY);
      await storage.removeItem(ADDRESSES_KEY);
    } catch (e) {
      console.warn("[signOut] local storage clear failed", e);
    }
    // On web, also nuke any lingering Supabase session keys from localStorage
    // (e.g. magic-link redirect tokens) and hard reload so React state is
    // completely reset.
    if (typeof window !== "undefined") {
      try {
        const keys = Object.keys(window.localStorage);
        keys
          .filter((k) => k.startsWith("sb-") || k.startsWith("supabase."))
          .forEach((k) => window.localStorage.removeItem(k));
      } catch {}
      window.location.href = "/welcome";
    }
  },
};
