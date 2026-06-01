// Admin data service — direct Supabase queries with no user filter.
// Only callable by users with role='admin' (enforced by RLS policies).
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { dataService } from "@/src/data/service";
import { Booking, BookingStatus, SavedAddress } from "@/src/types";

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
    if (!isSupabaseConfigured || !supabase) return [];
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, customer_id, service_id, scheduled_date, time_slot, address, notes, price, status, rating, review, created_at",
      )
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    const services = await dataService.getServices();
    const byId = new Map(services.map((s) => [s.id, s]));
    return data.map((b) => {
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
      };
    });
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
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from("bookings").update({ status }).eq("id", id);
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

    const [bookingsRes, customersRes] = await Promise.all([
      supabase.from("bookings").select("status, price"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "customer"),
    ]);

    if (bookingsRes.error || !bookingsRes.data) return empty;
    const rows = bookingsRes.data;
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
    return {
      totalBookings: rows.length,
      totalCustomers: customersRes.count ?? 0,
      totalRevenue,
      activeBookings: active,
      completedBookings: completed,
      cancelledBookings: cancelled,
      bookingsByStatus: byStatus,
    };
  },
};
