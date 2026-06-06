// Admin data service — direct Supabase queries with no user filter.
// Only callable by users with role='admin' (enforced by RLS policies).
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { dataService } from "@/src/data/service";
import { Booking, BookingStatus, SavedAddress } from "@/src/types";
import { storage } from "@/src/utils/storage";

const BOOKINGS_KEY = "mfixit.bookings";

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

export interface AdminCustomer {
  id: string;
  authUserId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  createdAt: string;
  bookingsCount?: number;
}

export interface AdminStats {
  totalBookings: number;
  totalCustomers: number;
  totalRevenue: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  bookingsByStatus: { status: BookingStatus; count: number }[];
}

export const adminService = {
  isAdmin: async (): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) return false;
    const { data } = await supabase.auth.getUser();
    const authUser = data.user;
    if (!authUser) return false;
    const { data: row } = await supabase
      .from("users")
      .select("role")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();
    return row?.role === "admin";
  },

  listAllBookings: async (): Promise<Booking[]> => {
    // Check if user is authenticated before trying Supabase RPC
    let hasAuthSession = false;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getUser();
      hasAuthSession = !!data.user;
    }

    if (isSupabaseConfigured && supabase && hasAuthSession) {
      // SECURITY-DEFINER RPC bypasses RLS entirely — see /app/admin-policies.sql
      const { data, error } = await supabase.rpc("list_all_bookings");
      if (!error && data) {
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
            providerId: b.provider_id ?? undefined,
            providerName: b.provider_name ?? undefined,
          };
        });
      }
      // If RPC failed, fall through to demo mode
    }
    
    // Demo mode: Read from local storage (for anonymous users or when Supabase is not available)
    const bookings = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    return bookings;
  },

  listAllCustomers: async (): Promise<AdminCustomer[]> => {
    if (!isSupabaseConfigured || !supabase) return [];
    // Use the SECURITY-DEFINER RPC (defined in /app/admin-policies.sql)
    // to bypass RLS recursion when listing every public.users row.
    const { data, error } = await supabase.rpc("list_all_customers");
    if (error || !data) return [];
    return data.map((u) => ({
      id: u.id,
      authUserId: u.auth_user_id,
      name: u.full_name,
      phone: u.phone,
      email: u.email,
      city: u.city,
      createdAt: u.created_at,
    }));
  },

  updateBookingStatus: async (
    id: string,
    status: BookingStatus,
  ): Promise<void> => {
    // Check if user is authenticated before trying Supabase RPC
    let hasAuthSession = false;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getUser();
      hasAuthSession = !!data.user;
    }

    if (isSupabaseConfigured && supabase && hasAuthSession) {
      // SECURITY-DEFINER RPC so an admin can update any booking regardless
      // of who owns it. See /app/admin-policies.sql.
      const { error } = await supabase.rpc("admin_update_booking_status", {
        bk_id: id,
        new_status: status,
      });
      if (!error) return;
      // Fall through to demo mode on error
    }
    
    // Demo mode: Update local storage
    const bookings = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      bookings[idx].status = status;
      await writeJSON(BOOKINGS_KEY, bookings);
    }
  },

  getStats: async (): Promise<AdminStats> => {
    const empty: AdminStats = {
      totalBookings: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      activeBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      bookingsByStatus: [],
    };
    if (!isSupabaseConfigured || !supabase) return empty;

    // Use RPCs to bypass any RLS recursion on public.users / bookings.
    const [bookingsRes, customersRes] = await Promise.all([
      supabase.rpc("list_all_bookings"),
      supabase.rpc("list_all_customers"),
    ]);

    if (bookingsRes.error || !bookingsRes.data) return empty;
    const rows = bookingsRes.data as any[];
    const totalRevenue = rows
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + Number(b.price ?? 0), 0);
    const active = rows.filter((b) =>
      ["pending", "confirmed", "in_progress"].includes(b.status),
    ).length;
    const completed = rows.filter((b) => b.status === "completed").length;
    const cancelled = rows.filter((b) => b.status === "cancelled").length;
    const byStatus = ["pending", "confirmed", "in_progress", "completed", "cancelled"]
      .map((s) => ({
        status: s as BookingStatus,
        count: rows.filter((b) => b.status === s).length,
      }));
    const customers = (customersRes.data as any[]) ?? [];
    return {
      totalBookings: rows.length,
      totalCustomers: customers.filter((u) => u.role !== "admin").length,
      totalRevenue,
      activeBookings: active,
      completedBookings: completed,
      cancelledBookings: cancelled,
      bookingsByStatus: byStatus,
    };
  },
};
