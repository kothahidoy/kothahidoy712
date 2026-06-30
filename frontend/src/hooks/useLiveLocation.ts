/**
 * useLiveLocation
 * ──────────────────────────────────────────────────────────────────────
 * Foreground-only customer-side location detector.
 *
 *  • Reads cache from AsyncStorage on mount → instant first paint.
 *  • Requests permission and detects fresh position in the background.
 *  • Reverse-geocodes lat/lng → human-readable (area, city).
 *  • Exposes refresh() so a UI tap can force re-detect.
 *
 * Designed to never block render — falls back gracefully to:
 *    1. cached value      (offline / quick start)
 *    2. profile.city      (caller can OR with this)
 *    3. "Durgapur"        (final hard fallback)
 *
 * NOTE: We do NOT track background location — only when app is open.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const CACHE_KEY = "@mfixit:liveLocation:v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export type LiveLocation = {
  /** Best human label, e.g. "Bidhan Nagar, Durgapur" */
  label: string;
  /** Just the area / neighborhood, may be empty on web */
  area: string;
  /** City (Durgapur, Kolkata, ...) — may fall back to "Durgapur" */
  city: string;
  /** Raw lat/lng for backend / map / distance calcs */
  latitude: number | null;
  longitude: number | null;
  /** Epoch ms of last successful fix */
  updatedAt: number | null;
};

type State = {
  loading: boolean;
  permissionDenied: boolean;
  /** Last known location (cached or fresh) */
  location: LiveLocation | null;
  /** Last error message, if any */
  error: string | null;
};

const DEFAULT: LiveLocation = {
  label: "Detecting your location…",
  area: "",
  city: "Durgapur",
  latitude: null,
  longitude: null,
  updatedAt: null,
};

async function readCache(): Promise<LiveLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as LiveLocation;
    if (!v || !v.updatedAt) return null;
    if (Date.now() - v.updatedAt > CACHE_TTL_MS) return null;
    return v;
  } catch {
    return null;
  }
}

async function writeCache(v: LiveLocation) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

function composeLabel(area: string, city: string): string {
  const a = area?.trim();
  const c = city?.trim();
  if (a && c && a.toLowerCase() !== c.toLowerCase()) return `${c} — ${a}`;
  if (c) return c;
  if (a) return a;
  return "Set your location";
}

export function useLiveLocation(autoDetect: boolean = true) {
  const [state, setState] = useState<State>({
    loading: true,
    permissionDenied: false,
    location: null,
    error: null,
  });
  const mountedRef = useRef(true);

  const detect = useCallback(async () => {
    if (!mountedRef.current) return;
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!mountedRef.current) return;
        setState((s) => ({
          ...s,
          loading: false,
          permissionDenied: true,
          error: "Permission denied",
        }));
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let area = "";
      let city = "";
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const p = places?.[0];
        if (p) {
          area = (p.name || p.street || p.district || "").toString().trim();
          city = (p.city || p.subregion || p.region || "").toString().trim();
        }
      } catch {
        /* reverse geocode unavailable on this platform — keep lat/lng */
      }

      const fresh: LiveLocation = {
        label: composeLabel(area, city || "Durgapur"),
        area,
        city: city || "Durgapur",
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        updatedAt: Date.now(),
      };

      if (!mountedRef.current) return;
      setState({
        loading: false,
        permissionDenied: false,
        location: fresh,
        error: null,
      });
      writeCache(fresh);
    } catch (e: any) {
      if (!mountedRef.current) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: e?.message || "Could not get location",
      }));
    }
  }, []);

  // Bootstrap: load cache → optionally auto-detect
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const cached = await readCache();
      if (cached && mountedRef.current) {
        setState((s) => ({ ...s, location: cached, loading: false }));
      }
      if (autoDetect) {
        // On web, getCurrentPosition prompts and may stall on insecure origins.
        // Still attempt — the permission prompt itself is the UX we want.
        detect();
      } else if (!cached && mountedRef.current) {
        setState((s) => ({ ...s, loading: false, location: DEFAULT }));
      }
    })();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetect]);

  return {
    ...state,
    /** Force re-detect (e.g. user tapped the location row) */
    refresh: detect,
    /** Platform note: web requires HTTPS to work */
    isWeb: Platform.OS === "web",
  };
}

export default useLiveLocation;
