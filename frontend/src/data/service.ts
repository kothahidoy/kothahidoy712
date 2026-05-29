// Data layer — single facade that the UI talks to. Falls back to local seed
// data + AsyncStorage in demo mode; switches to Supabase automatically when
// EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are present.

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

// --- READ ---------------------------------------------------------------

export const dataService = {
  getCategories: async (): Promise<Category[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon, color, description")
        .order("name");
      if (!error && data && data.length) return data as Category[];
    }
    return CATEGORIES;
  },

  getServices: async (): Promise<Service[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true);
      if (!error && data && data.length) return data as unknown as Service[];
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

  getOffers: async (): Promise<Offer[]> => OFFERS,

  getTimeSlots: (): string[] => TIME_SLOTS,

  // --- BOOKINGS ---------------------------------------------------------

  listBookings: async (): Promise<Booking[]> =>
    readJSON<Booking[]>(BOOKINGS_KEY, []),

  createBooking: async (
    input: Omit<Booking, "id" | "createdAt" | "status">,
  ): Promise<Booking> => {
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
    const all = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    const next = all.map((b) =>
      b.id === id ? { ...b, status: "cancelled" as const } : b,
    );
    await writeJSON(BOOKINGS_KEY, next);
  },

  submitReview: async (
    id: string,
    rating: number,
    review: string,
  ): Promise<void> => {
    const all = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    const next = all.map((b) => (b.id === id ? { ...b, rating, review } : b));
    await writeJSON(BOOKINGS_KEY, next);
  },

  markCompleted: async (id: string): Promise<void> => {
    const all = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    const next = all.map((b) =>
      b.id === id ? { ...b, status: "completed" as const } : b,
    );
    await writeJSON(BOOKINGS_KEY, next);
  },

  // --- ADDRESSES --------------------------------------------------------

  listAddresses: async (): Promise<SavedAddress[]> =>
    readJSON<SavedAddress[]>(ADDRESSES_KEY, []),

  saveAddress: async (
    input: Omit<SavedAddress, "id">,
  ): Promise<SavedAddress> => {
    const addr: SavedAddress = { ...input, id: newId() };
    const all = await readJSON<SavedAddress[]>(ADDRESSES_KEY, []);
    const next = input.isDefault
      ? [addr, ...all.map((a) => ({ ...a, isDefault: false }))]
      : [...all, addr];
    await writeJSON(ADDRESSES_KEY, next);
    return addr;
  },

  removeAddress: async (id: string): Promise<void> => {
    const all = await readJSON<SavedAddress[]>(ADDRESSES_KEY, []);
    await writeJSON(
      ADDRESSES_KEY,
      all.filter((a) => a.id !== id),
    );
  },

  // --- PROFILE ----------------------------------------------------------

  getProfile: async (): Promise<UserProfile | null> => {
    const raw = await readJSON<UserProfile | null>(PROFILE_KEY, null);
    return raw;
  },

  saveProfile: async (
    profile: Omit<UserProfile, "id" | "createdAt"> & {
      id?: string;
      createdAt?: string;
    },
  ): Promise<UserProfile> => {
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
    await storage.removeItem(PROFILE_KEY);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  },
};
