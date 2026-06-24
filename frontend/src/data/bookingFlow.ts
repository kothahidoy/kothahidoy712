// Booking flow API client (Urban Company-style cart, slot, checkout)
import { supabase } from "@/src/lib/supabase";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

async function authHeader(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    if (!supabase) return headers;
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {}
  return headers;
}

// ---------- Types ----------
export interface SlotDate {
  date: string;        // YYYY-MM-DD
  day_name: string;    // "Mon"
  day_num: number;     // 23
  slot_count: number;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;        // "03:30 PM"
  available: boolean;
}

export interface PlusPlan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  original_price?: number;
  benefits: string[];
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description?: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_cart_value: number;
  max_discount?: number;
  applicable?: boolean;
  discount?: number;
}

export interface RecommendItem {
  id: string;
  title: string;
  image: string;
  starting_price: number;
  rating?: number;
  review_count?: number;
  duration_mins?: number;
  category_id?: string;
}

// ---------- API methods ----------
export const bookingApi = {
  async getSlotDates(days = 7): Promise<SlotDate[]> {
    try {
      const r = await fetch(`${API_BASE}/api/booking/slots/dates?days=${days}`);
      if (!r.ok) return [];
      const d = await r.json();
      return d.dates || [];
    } catch { return []; }
  },

  async getSlots(date: string): Promise<TimeSlot[]> {
    try {
      const r = await fetch(`${API_BASE}/api/booking/slots?date=${date}`);
      if (!r.ok) return [];
      const d = await r.json();
      return d.slots || [];
    } catch { return []; }
  },

  async getPlusPlans(): Promise<PlusPlan[]> {
    try {
      const r = await fetch(`${API_BASE}/api/booking/plus-plans`);
      if (!r.ok) return [];
      const d = await r.json();
      return (d.plans || []).map((p: any) => ({
        ...p,
        benefits: Array.isArray(p.benefits) ? p.benefits : [],
      }));
    } catch { return []; }
  },

  async getPlusStatus(): Promise<{ active: boolean; subscription: any }> {
    try {
      const headers = await authHeader();
      const r = await fetch(`${API_BASE}/api/booking/plus/status`, { headers });
      if (!r.ok) return { active: false, subscription: null };
      return await r.json();
    } catch { return { active: false, subscription: null }; }
  },

  async getCoupons(cartTotal: number): Promise<Coupon[]> {
    try {
      const r = await fetch(`${API_BASE}/api/booking/coupons?cart_total=${cartTotal}`);
      if (!r.ok) return [];
      const d = await r.json();
      return d.coupons || [];
    } catch { return []; }
  },

  async applyCoupon(code: string, cartTotal: number): Promise<{ coupon: Coupon; discount: number }> {
    const r = await fetch(`${API_BASE}/api/booking/coupons/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, cart_total: cartTotal }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.detail || "Invalid coupon");
    }
    return await r.json();
  },

  async getRecommendations(
    excludeIds: string[] = [],
    categoryId?: string,
    limit = 8
  ): Promise<RecommendItem[]> {
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (categoryId) params.set("category_id", categoryId);
      if (excludeIds.length) params.set("exclude", excludeIds.join(","));
      const r = await fetch(`${API_BASE}/api/booking/recommendations?${params}`);
      if (!r.ok) return [];
      const d = await r.json();
      return d.items || [];
    } catch { return []; }
  },

  async createBooking(payload: {
    items: { service_id: string; quantity: number; price: number; title?: string; image?: string }[];
    address: any;
    slot_date: string;
    slot_time: string;
    payment_method?: "cash" | "razorpay";
    coupon_code?: string;
    tip_amount?: number;
    plus_plan_id?: string;
    notes?: string;
  }) {
    const headers = await authHeader();
    const r = await fetch(`${API_BASE}/api/booking/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.detail || `Booking failed (${r.status})`);
    }
    return await r.json();
  },
};
