/**
 * useCategoryCMS  —  fetches CMS-managed content for a category from Supabase via backend.
 * Returns banners, promos, sub-categories, services, and brand/branding info.
 *
 * Pages should use this hook and fall back to local hardcoded data if the
 * CMS arrays are empty (so the UI never breaks even if admin hasn't filled in
 * a category yet).
 */
import { useEffect, useState, useCallback } from "react";

const API_BASE = (() => {
  if (typeof window !== "undefined") return ""; // relative — same origin
  return process.env.EXPO_PUBLIC_BACKEND_URL || "";
})();

export type CMSBanner = {
  id: string;
  category_id: string;
  title: string;
  subtitle?: string | null;
  media_type: "image" | "video";
  media_url: string;
  poster_url?: string | null;
  sort_order: number;
  is_active: boolean;
};

export type CMSPromo = {
  id: string;
  category_id: string;
  label: string;
  sub_label?: string | null;
  discount_pct?: number;
  max_off?: number;
  min_cart?: number;
  badge_color?: string;
  is_active: boolean;
};

export type CMSSubCategory = {
  id: string;
  category_id: string;
  name: string;
  slug?: string | null;
  image_url?: string | null;
  badge?: string | null;
  badge_color?: string | null;
  sort_order: number;
  is_active: boolean;
};

export type CMSService = {
  id: string;
  category_id: string;
  sub_category_id?: string | null;
  title: string;
  description?: string | null;
  starting_price: number;
  duration_mins: number;
  rating?: number;
  review_count?: number;
  image?: string | null;
  popular?: boolean;
  top_rated?: boolean;
  recommended?: boolean;
  sort_order?: number;
};

export type CMSCategory = {
  id: string;
  name: string;
  image_url?: string | null;
  brand_name?: string | null;
  brand_rating?: number | null;
  brand_reviews_label?: string | null;
  is_active?: boolean;
  visitation_fee_label?: string | null;
  visitation_fee_threshold?: number | null;
  visitation_fee_active?: boolean | null;
};

export type CMSData = {
  category: CMSCategory | null;
  banners: CMSBanner[];
  promos: CMSPromo[];
  sub_categories: CMSSubCategory[];
  services: CMSService[];
};

const EMPTY: CMSData = {
  category: null,
  banners: [],
  promos: [],
  sub_categories: [],
  services: [],
};

export function useCategoryCMS(categoryId: string | null | undefined) {
  const [data, setData] = useState<CMSData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/admin/cms/public/category/${categoryId}/cms`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as CMSData;
      setData(j);
    } catch (e: any) {
      setError(e.message || String(e));
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...data, loading, error, reload };
}
