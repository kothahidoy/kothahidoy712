// Booking flow API client (Urban Company-style cart, slot, checkout)
import { authHeader as buildAuthHeader } from "@/src/lib/authToken";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

async function authHeader(): Promise<Record<string, string>> {
  return buildAuthHeader();
}

// ---------- Types ----------
export interface SlotDate {
  date: string;
  day_name: string;
  day_num: number;
  slot_count: number;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
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
  async cancelBooking(bookingId: string): Promise<{ ok: boolean; cancellation_fee: number }> {
    const headers = await authHeader();
    const r = await fetch(`${API_BASE}/api/booking/${bookingId}/cancel`, {
      method: "POST",
      headers,
    });
    if (!r.ok) {
      let msg = `HTTP ${r.status}`;
      try { const j = await r.json(); msg = j.detail || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  },

  async rescheduleBooking(bookingId: string, scheduledDate: string, timeSlot: string): Promise<{ ok: boolean }> {
    const headers = await authHeader();
    const r = await fetch(`${API_BASE}/api/booking/${bookingId}/reschedule`, {
      method: "POST",
      headers,
      body: JSON.stringify({ scheduled_date: scheduledDate, time_slot: timeSlot }),
    });
    if (!r.ok) {
      let msg = `HTTP ${r.status}`;
      try { const j = await r.json(); msg = j.detail || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  },

  async rateBooking(bookingId: string, rating: number, reviewText: string): Promise<{ ok: boolean; published: boolean }> {
    const headers = await authHeader();
    const r = await fetch(`${API_BASE}/api/booking/${bookingId}/review`, {
      method: "POST",
      headers,
      body: JSON.stringify({ rating, review_text: reviewText }),
    });
    if (!r.ok) {
      let msg = `HTTP ${r.status}`;
      try { const j = await r.json(); msg = j.detail || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  },
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
      const ROUTE_TO_DB: Record<string, string> = {
        "ac-appliance": "ac-appliance",
        "salon-women": "salon-women",
        "salon": "salon-men",
        "salon-men": "salon-men",
        "plumber": "plumber",
        "electrician": "electrician",
        "cleaning": "cleaning-pest",
        "cleaning-pest": "cleaning-pest",
        "carpenter": "carpenter",
        "painting": "painting",
        "pest-control": "cleaning-pest",
        "insta-help": "insta-help",
      };
      if (categoryId) {
        params.set("category_id", ROUTE_TO_DB[categoryId] || categoryId);
      }
      if (excludeIds.length) params.set("exclude", excludeIds.join(","));
      const r = await fetch(`${API_BASE}/api/booking/recommendations?${params}`);
      if (!r.ok) return [];
      const d = await r.json();
      return d.items || [];
    } catch { return []; }
  },

  async listMyBookings() {
    const headers = await authHeader();
    const r = await fetch(`${API_BASE}/api/booking/mine`, { headers });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.bookings || []).map((b: any) => {
      const items = Array.isArray(b.items) ? b.items : [];
      const first = items[0] || null;
      const extra = items.length > 1 ? ` +${items.length - 1} more` : "";
      return {
        id: b.id,
        serviceId: b.service_id,
        serviceTitle: (first?.title || "Service") + extra,
        serviceImage: first?.image || "",
        scheduledDate: b.scheduled_date,
        timeSlot: b.time_slot,
        address: b.address,
        notes: b.notes ?? undefined,
        price: Number(b.price),
        status: b.status,
        rating: b.rating ?? undefined,
        review: b.review ?? undefined,
        createdAt: b.created_at,
        paymentStatus: b.payment_status ?? "unpaid",
        paymentMethod: b.payment_method ?? undefined,
        paymentId: b.payment_id ?? undefined,
        paidAt: b.paid_at ?? undefined,
      };
    });
  },

  async createBooking(payload: {
    items: { service_id: string; quantity: number; price: number; title?: string; image?: string; category?: string }[];
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
