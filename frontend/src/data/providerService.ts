// Provider data service — handles both Supabase and AsyncStorage (demo mode)
// Supports provider login, job management, and admin provider operations.

import { storage } from "@/src/utils/storage";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { Booking, BookingStatus, Provider, SavedAddress } from "@/src/types";
import { dataService } from "@/src/data/service";
import { CATEGORIES } from "@/src/data/seed";

const PROVIDERS_KEY = "mfixit.providers";
const PROVIDER_SESSION_KEY = "mfixit.provider_session";
const BOOKINGS_KEY = "mfixit.bookings";

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

// Normalize phone number: remove all non-digit characters and trim
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}

// Get category name by ID
function getCategoryName(categoryId: string): string {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat?.name ?? categoryId;
}

export const providerService = {
  // ================= PROVIDER LOGIN =================

  /**
   * Login provider by phone number (mock auth - just looks up in DB)
   * Returns provider data or null if not found
   */
  login: async (phone: string): Promise<Provider | null> => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return null;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc("provider_login", {
        p_phone: normalizedPhone,
      });
      if (error || !data || data.length === 0) return null;
      const row = Array.isArray(data) ? data[0] : data;
      const provider: Provider = {
        id: row.id,
        name: row.name,
        phone: row.phone,
        serviceType: row.service_type,
        isAvailable: row.is_available,
      };
      // Save session
      await writeJSON(PROVIDER_SESSION_KEY, provider);
      return provider;
    }

    // Demo mode: check local providers
    const providers = await readJSON<Provider[]>(PROVIDERS_KEY, []);
    const found = providers.find(
      (p) => normalizePhone(p.phone) === normalizedPhone
    );
    if (found) {
      await writeJSON(PROVIDER_SESSION_KEY, found);
      return found;
    }
    return null;
  },

  /**
   * Get current logged-in provider from session
   */
  getCurrentProvider: async (): Promise<Provider | null> => {
    return readJSON<Provider | null>(PROVIDER_SESSION_KEY, null);
  },

  /**
   * Logout provider (clear session)
   */
  logout: async (): Promise<void> => {
    await storage.removeItem(PROVIDER_SESSION_KEY);
  },

  // ================= PROVIDER JOBS =================

  /**
   * List jobs assigned to provider (only assigned/in_progress status)
   */
  listJobs: async (providerId: string): Promise<Booking[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc("list_provider_jobs", {
        p_provider_id: providerId,
      });
      if (error || !data) return [];

      // Resolve service details
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
          createdAt: b.created_at,
          providerId: b.provider_id,
        };
      });
    }

    // Demo mode: filter local bookings
    const bookings = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    console.log("[providerService.listJobs] All bookings:", JSON.stringify(bookings.map(b => ({ id: b.id, providerId: b.providerId, status: b.status })), null, 2));
    console.log("[providerService.listJobs] Looking for providerId:", providerId);
    const filtered = bookings.filter(
      (b) =>
        b.providerId === providerId &&
        ["assigned", "in_progress"].includes(b.status)
    );
    console.log("[providerService.listJobs] Filtered jobs:", filtered.length);
    return filtered;
  },

  /**
   * Start job: assigned -> in_progress
   */
  startJob: async (providerId: string, bookingId: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc("provider_start_job", {
        p_provider_id: providerId,
        p_booking_id: bookingId,
      });
      return !error;
    }

    // Demo mode
    const bookings = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    const idx = bookings.findIndex(
      (b) =>
        b.id === bookingId &&
        b.providerId === providerId &&
        b.status === "assigned"
    );
    if (idx === -1) return false;

    bookings[idx].status = "in_progress";
    await writeJSON(BOOKINGS_KEY, bookings);
    return true;
  },

  /**
   * Complete job: in_progress -> completed, provider becomes available
   */
  completeJob: async (
    providerId: string,
    bookingId: string
  ): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc("provider_complete_job", {
        p_provider_id: providerId,
        p_booking_id: bookingId,
      });
      return !error;
    }

    // Demo mode
    const bookings = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    const idx = bookings.findIndex(
      (b) =>
        b.id === bookingId &&
        b.providerId === providerId &&
        b.status === "in_progress"
    );
    if (idx === -1) return false;

    bookings[idx].status = "completed";
    await writeJSON(BOOKINGS_KEY, bookings);

    // Mark provider as available
    const providers = await readJSON<Provider[]>(PROVIDERS_KEY, []);
    const provIdx = providers.findIndex((p) => p.id === providerId);
    if (provIdx !== -1) {
      providers[provIdx].isAvailable = true;
      await writeJSON(PROVIDERS_KEY, providers);
    }

    return true;
  },

  // ================= ADMIN PROVIDER MANAGEMENT =================

  /**
   * List all providers (admin only)
   */
  listAllProviders: async (): Promise<Provider[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc("admin_list_providers");
      if (error || !data) return [];
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        serviceType: p.service_type,
        isAvailable: p.is_available,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));
    }

    // Demo mode
    return readJSON<Provider[]>(PROVIDERS_KEY, []);
  },

  /**
   * Get available providers for a category (admin only)
   */
  getAvailableProvidersFor: async (
    categoryId: string
  ): Promise<Provider[]> => {
    // Check if user is authenticated before trying Supabase
    let hasAuthSession = false;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getUser();
      hasAuthSession = !!data.user;
    }

    if (isSupabaseConfigured && supabase && hasAuthSession) {
      const { data, error } = await supabase.rpc(
        "admin_available_providers_for",
        { category_id: categoryId }
      );
      if (error || !data) return [];
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        serviceType: p.service_type,
        isAvailable: p.is_available,
      }));
    }

    // Demo mode - ensure providers are initialized first
    await providerService.initDemoProviders();
    
    const providers = await readJSON<Provider[]>(PROVIDERS_KEY, []);
    return providers.filter(
      (p) => p.serviceType === categoryId && p.isAvailable
    );
  },

  /**
   * Assign provider to booking (admin only)
   * Sets booking status to 'assigned' and provider to unavailable
   */
  assignProvider: async (
    bookingId: string,
    providerId: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Check if user is authenticated before trying Supabase
    let hasAuthSession = false;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getUser();
      hasAuthSession = !!data.user;
    }

    if (isSupabaseConfigured && supabase && hasAuthSession) {
      const { error } = await supabase.rpc("admin_assign_provider", {
        booking_id: bookingId,
        provider_id: providerId,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    // Demo mode
    const bookings = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    const providers = await readJSON<Provider[]>(PROVIDERS_KEY, []);

    const bookingIdx = bookings.findIndex((b) => b.id === bookingId);
    const providerIdx = providers.findIndex((p) => p.id === providerId);

    if (bookingIdx === -1) {
      return { success: false, error: "Booking not found" };
    }
    if (providerIdx === -1) {
      return { success: false, error: "Provider not found" };
    }
    if (bookings[bookingIdx].providerId) {
      return { success: false, error: "Booking already assigned" };
    }
    if (!providers[providerIdx].isAvailable) {
      return { success: false, error: "Provider not available" };
    }

    // Assign
    bookings[bookingIdx].providerId = providerId;
    bookings[bookingIdx].providerName = providers[providerIdx].name;
    bookings[bookingIdx].status = "assigned";
    providers[providerIdx].isAvailable = false;

    await writeJSON(BOOKINGS_KEY, bookings);
    await writeJSON(PROVIDERS_KEY, providers);

    return { success: true };
  },

  /**
   * Create a new provider (admin only)
   */
  createProvider: async (
    name: string,
    phone: string,
    serviceType: string
  ): Promise<{ success: boolean; provider?: Provider; error?: string }> => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return { success: false, error: "Invalid phone number" };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc("admin_create_provider", {
        p_name: name.trim(),
        p_phone: normalizedPhone,
        p_service_type: serviceType,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        provider: {
          id: data,
          name: name.trim(),
          phone: normalizedPhone,
          serviceType,
          isAvailable: true,
        },
      };
    }

    // Demo mode
    const providers = await readJSON<Provider[]>(PROVIDERS_KEY, []);
    
    // Check for duplicate phone
    if (providers.some((p) => normalizePhone(p.phone) === normalizedPhone)) {
      return { success: false, error: "Phone number already exists" };
    }

    const newProvider: Provider = {
      id: newId(),
      name: name.trim(),
      phone: normalizedPhone,
      serviceType,
      isAvailable: true,
      createdAt: new Date().toISOString(),
    };

    await writeJSON(PROVIDERS_KEY, [...providers, newProvider]);
    return { success: true, provider: newProvider };
  },

  // ================= UTILITIES =================

  /**
   * Get category name for display
   */
  getCategoryName,

  /**
   * Debug helper - get info about bookings for a provider (demo mode only)
   */
  getDebugInfo: async (providerId: string): Promise<string | null> => {
    if (isSupabaseConfigured) return null;
    
    const bookings = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    const info = bookings.map(b => 
      `${b.serviceTitle?.slice(0, 20) ?? 'Unknown'}... | provId: ${b.providerId?.slice(0,8) ?? 'NONE'} | status: ${b.status}`
    ).join('\n');
    return info;
  },

  /**
   * Initialize demo providers (for testing without Supabase)
   * Uses fixed IDs to ensure consistency across sessions
   */
  initDemoProviders: async (): Promise<void> => {
    const existing = await readJSON<Provider[]>(PROVIDERS_KEY, []);
    if (existing.length > 0) return; // Already initialized

    // IMPORTANT: Use fixed IDs for demo mode consistency
    const demoProviders: Provider[] = [
      {
        id: "demo-provider-rahul",
        name: "Rahul Sharma",
        phone: "9876543210",
        serviceType: "electrician",
        isAvailable: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-provider-amit",
        name: "Amit Kumar",
        phone: "9876543211",
        serviceType: "plumber",
        isAvailable: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-provider-suresh",
        name: "Suresh Patel",
        phone: "9876543212",
        serviceType: "ac-repair",
        isAvailable: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-provider-priya",
        name: "Priya Singh",
        phone: "9876543213",
        serviceType: "cleaning",
        isAvailable: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-provider-rajesh",
        name: "Rajesh Verma",
        phone: "9876543214",
        serviceType: "electrician",
        isAvailable: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-provider-mohammed",
        name: "Mohammed Ali",
        phone: "9876543215",
        serviceType: "carpenter",
        isAvailable: true,
        createdAt: new Date().toISOString(),
      },
    ];

    await writeJSON(PROVIDERS_KEY, demoProviders);
  },

  /**
   * Initialize demo bookings for testing provider assignment flow
   * Uses fixed IDs for consistency
   */
  initDemoBookings: async (): Promise<void> => {
    const existing = await readJSON<Booking[]>(BOOKINGS_KEY, []);
    if (existing.length > 0) return; // Already has bookings

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // IMPORTANT: Use fixed IDs for demo mode consistency
    const demoBookings: Booking[] = [
      {
        id: "demo-booking-1",
        serviceId: "svc-elec-1",
        serviceTitle: "Electrical Wiring & Switch Fix",
        serviceImage: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBob21lJTIwcmVwYWlyJTIwdGVjaG5pY2lhbnxlbnwwfHx8fDE3ODAwNzU4MzF8MA&ixlib=rb-4.1.0&q=85&w=800",
        scheduledDate: tomorrow.toISOString().split("T")[0],
        timeSlot: "10:00 AM",
        address: {
          id: "addr-1",
          label: "Home",
          addressLine: "123 Main Street, Sector 5",
          city: "Durgapur",
          latitude: 23.5204,
          longitude: 87.3119,
        },
        notes: "Need switchboard repair in bedroom",
        price: 499,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        paymentStatus: "paid",
        paymentMethod: "razorpay",
      },
      {
        id: "demo-booking-2",
        serviceId: "svc-plumb-1",
        serviceTitle: "Tap, Basin & Pipe Leak Fix",
        serviceImage: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
        scheduledDate: tomorrow.toISOString().split("T")[0],
        timeSlot: "02:00 PM",
        address: {
          id: "addr-2",
          label: "Office",
          addressLine: "45 Tech Park, Block C",
          city: "Kolkata",
          latitude: 22.5726,
          longitude: 88.3639,
        },
        notes: "Bathroom tap leaking badly",
        price: 299,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        paymentStatus: "paid",
        paymentMethod: "razorpay",
      },
      {
        id: "demo-booking-3",
        serviceId: "svc-ac-1",
        serviceTitle: "AC Service & Deep Cleaning",
        serviceImage: "https://images.unsplash.com/photo-1631545806609-fe50f0e51eea?auto=format&fit=crop&w=800&q=80",
        scheduledDate: nextWeek.toISOString().split("T")[0],
        timeSlot: "11:00 AM",
        address: {
          id: "addr-3",
          label: "Home",
          addressLine: "789 Garden View, Floor 3",
          city: "Asansol",
          latitude: 23.6833,
          longitude: 86.9667,
        },
        notes: "AC not cooling properly, needs gas check",
        price: 699,
        status: "pending",
        createdAt: new Date().toISOString(),
        paymentStatus: "unpaid",
      },
    ];

    await writeJSON(BOOKINGS_KEY, demoBookings);
  },

  /**
   * Reset demo data - clears all demo storage and reinitializes
   */
  resetDemoData: async (): Promise<void> => {
    // Clear all demo data
    await storage.removeItem(PROVIDERS_KEY);
    await storage.removeItem(BOOKINGS_KEY);
    await storage.removeItem(PROVIDER_SESSION_KEY);
    
    // Reinitialize
    await providerService.initDemoProviders();
    await providerService.initDemoBookings();
  },
};
