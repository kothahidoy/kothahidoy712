import { useEffect, useState } from "react";

const BASE = (process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80";

function fmtReviews(n: number) {
  if (!n || n < 1000) return `${n || 0}`;
  if (n < 100000) return `${(n / 1000).toFixed(0)}K`;
  if (n < 1000000) return `${(n / 1000).toFixed(0)}K`;
  return `${(n / 1000000).toFixed(1)}M`;
}

export interface CMSCategoryTile {
  id: string;
  name: string;
  image: string;
}

export interface CMSService {
  id: string;
  name: string;
  rating: number;
  reviews: string;
  price: number;
  originalPrice?: number;
  duration?: string;
  image: string;
  options?: number;
  description?: string;
  shortDescription?: string;
}

export interface CMSGroup {
  title: string;
  services: CMSService[];
}

export interface UseCategoryContentResult {
  loading: boolean;
  error: string | null;
  /** Top horizontal sub-category tabs */
  CATEGORIES: CMSCategoryTile[];
  /** Section content keyed by sub-category id */
  ALL_SERVICES: Record<string, CMSGroup>;
  /** Id of the first sub-category (used to set the initial active tab) */
  initialActiveId: string;
  refresh: () => Promise<void>;
}

/**
 * Fetch sub-categories + services for a given top-level category id (e.g. "salon-women")
 * and return them shaped exactly like the screens' previously-hardcoded CATEGORIES /
 * ALL_SERVICES constants so the rest of the screen logic stays unchanged.
 */
export function useCategoryContent(categoryId: string): UseCategoryContentResult {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    CATEGORIES: CMSCategoryTile[];
    ALL_SERVICES: Record<string, CMSGroup>;
    initialActiveId: string;
  }>({
    loading: true,
    error: null,
    CATEGORIES: [],
    ALL_SERVICES: {},
    initialActiveId: "",
  });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [subRes, svcRes] = await Promise.all([
        fetch(`${BASE}/api/admin/cms/sub-categories?category_id=${encodeURIComponent(categoryId)}`),
        fetch(`${BASE}/api/admin/cms/services?category_id=${encodeURIComponent(categoryId)}`),
      ]);
      const subsRaw: any[] = subRes.ok ? await subRes.json() : [];
      const svcsRaw: any[] = svcRes.ok ? await svcRes.json() : [];

      const subs = (Array.isArray(subsRaw) ? subsRaw : [])
        .filter((s) => s && s.is_active !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      const svcs = (Array.isArray(svcsRaw) ? svcsRaw : []).filter(
        (s) => s && s.is_active !== false,
      );

      const CATEGORIES: CMSCategoryTile[] = subs.map((s) => ({
        id: String(s.id),
        name: s.name,
        image: s.image_url || PLACEHOLDER,
      }));

      const ALL_SERVICES: Record<string, CMSGroup> = {};
      subs.forEach((s: any) => {
        const list: CMSService[] = svcs
          .filter((sv: any) => String(sv.sub_category_id) === String(s.id))
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((sv: any) => ({
            id: String(sv.id),
            name: sv.title,
            rating: Number(sv.rating) || 4.7,
            reviews: fmtReviews(Number(sv.review_count) || 0),
            price: Number(sv.starting_price) || 0,
            duration: sv.duration_mins ? `${sv.duration_mins} mins` : undefined,
            image: sv.image || s.image_url || PLACEHOLDER,
            description: sv.description || undefined,
            shortDescription: sv.short_description || undefined,
          }));
        ALL_SERVICES[String(s.id)] = { title: s.name, services: list };
      });

      // Services with no sub_category_id fall into a synthetic "Other" group so they
      // don't disappear from the customer view.
      const orphan = svcs.filter((sv: any) => !sv.sub_category_id);
      if (orphan.length) {
        const id = "_other";
        CATEGORIES.push({ id, name: "More services", image: PLACEHOLDER });
        ALL_SERVICES[id] = {
          title: "More services",
          services: orphan.map((sv: any) => ({
            id: String(sv.id),
            name: sv.title,
            rating: Number(sv.rating) || 4.7,
            reviews: fmtReviews(Number(sv.review_count) || 0),
            price: Number(sv.starting_price) || 0,
            duration: sv.duration_mins ? `${sv.duration_mins} mins` : undefined,
            image: sv.image || PLACEHOLDER,
          })),
        };
      }

      setState({
        loading: false,
        error: null,
        CATEGORIES,
        ALL_SERVICES,
        initialActiveId: CATEGORIES[0]?.id || "",
      });
    } catch (e: any) {
      setState({
        loading: false,
        error: e?.message || "Failed to load",
        CATEGORIES: [],
        ALL_SERVICES: {},
        initialActiveId: "",
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  return { ...state, refresh: load };
}
