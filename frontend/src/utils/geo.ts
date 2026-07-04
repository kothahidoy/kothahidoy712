/**
 * Geo utilities — robust reverse geocoding.
 * ────────────────────────────────────────────────────────────────────
 * Order of resolution:
 *   1. Backend `/api/geo/reverse` (OpenStreetMap Nominatim proxy) —
 *      returns proper place names on every platform.
 *   2. expo-location `reverseGeocodeAsync` — native fallback.
 *
 * All results are sanitised so we NEVER show raw coordinates or
 * plus-codes (e.g. "25466" / "VGCQ+R5J") as the primary place name.
 */
import * as Location from "expo-location";

export type GeoAddress = {
  /** Short place name, e.g. "Selampur" */
  name: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  /** "Road, Area, City" — good for the address input field */
  addressLine: string;
  /** Full display, e.g. "Selampur, West Bengal, 712122, India" */
  displayName: string;
  /** "Area, City" — good for compact labels */
  label: string;
  latitude: number;
  longitude: number;
};

const BACKEND = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").replace(/\/+$/, "");

/** True when a string is empty, only numbers/punctuation, or a plus-code. */
export function looksLikeJunk(s?: string | null): boolean {
  const t = (s ?? "").trim();
  if (!t) return true;
  if (/^[\d\s.,°+-]+$/.test(t)) return true; // pure numbers e.g. "25466"
  if (/^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}/i.test(t)) return true; // plus code
  return false;
}

function clean(s?: string | null): string {
  const t = (s ?? "").trim();
  return looksLikeJunk(t) ? "" : t;
}

/** Reverse geocode via backend first, expo-location as fallback. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeoAddress | null> {
  // 1) Backend (Nominatim) — best quality names
  try {
    const res = await fetch(
      `${BACKEND}/api/geo/reverse?lat=${latitude}&lon=${longitude}`,
    );
    if (res.ok) {
      const d = await res.json();
      const name = clean(d?.name) || clean(d?.city);
      if (name) {
        return {
          name,
          area: clean(d?.area),
          city: clean(d?.city),
          state: clean(d?.state),
          pincode: (d?.pincode ?? "").trim(),
          addressLine: (d?.address_line ?? "").trim() || name,
          displayName: (d?.display_name ?? "").trim() || name,
          label: (d?.label ?? "").trim() || name,
          latitude,
          longitude,
        };
      }
    }
  } catch {
    /* backend unreachable — fall through */
  }

  // 2) expo-location fallback (native only, may be partial)
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const p = places?.[0];
    if (p) {
      const road = clean(p.street) || clean(p.name);
      const area = clean(p.district) || clean(p.subregion);
      const city = clean(p.city) || clean(p.subregion) || clean(p.region);
      const name = area || road || city;
      if (name) {
        const parts = Array.from(
          new Set([road, area, city].filter(Boolean)),
        );
        const addressLine = parts.join(", ") || name;
        const pincode = (p.postalCode ?? "").trim();
        return {
          name,
          area,
          city,
          state: clean(p.region),
          pincode,
          addressLine,
          displayName: [addressLine, clean(p.region), pincode, "India"]
            .filter(Boolean)
            .join(", "),
          label: city && name !== city ? `${name}, ${city}` : name,
          latitude,
          longitude,
        };
      }
    }
  } catch {
    /* reverse geocode unavailable on this platform */
  }
  return null;
}

export type DetectResult =
  | { status: "denied" }
  | { status: "error"; message: string }
  | {
      status: "ok";
      address: GeoAddress | null;
      latitude: number;
      longitude: number;
    };

/** Ask permission → get GPS fix → reverse geocode. */
export async function detectCurrentAddress(): Promise<DetectResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return { status: "denied" };
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const address = await reverseGeocode(
      pos.coords.latitude,
      pos.coords.longitude,
    );
    return {
      status: "ok",
      address,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  } catch (e: any) {
    return { status: "error", message: e?.message || "Could not get location" };
  }
}

/** AsyncStorage flag key — set once the user has completed (or skipped)
 *  the post-login location selection screen. */
export const LOCATION_PROMPT_KEY = "@mfixit:locationPromptDone:v1";
