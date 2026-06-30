/**
 * ProviderTrackingCard
 * ──────────────────────────────────────────────────────────────────────
 * Customer-facing live tracking widget shown on the booking detail screen.
 *
 *   • Polls GET /api/booking/{id}/provider-location every 15 seconds.
 *   • Renders a Leaflet map (via <LiveMap />) with the provider's pin
 *     and the customer's destination pin.
 *   • Shows a "Live" / "Stale" / "Waiting for GPS" status pill plus
 *     a straight-line distance to destination in km.
 *
 * Renders only when:
 *   • booking.status is assigned OR in_progress
 *   • booking.providerId is set
 *
 * If the backend returns available=false (no GPS yet), we still show
 * a friendly placeholder card so the user knows tracking is active.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { Navigation, RefreshCw } from "lucide-react-native";

import { LiveMap, LatLng } from "@/src/components/LiveMap";
import { colors, radius } from "@/src/theme";

const POLL_INTERVAL_MS = 15 * 1000;
const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

interface Props {
  bookingId: string;
  destination?: { latitude: number; longitude: number } | null;
  /** customer address one-liner — only used for "Open in maps" deep link */
  destinationLabel?: string;
}

interface ProviderLocationResp {
  available: boolean;
  reason?: string;
  status?: string;
  provider_id?: string;
  latitude?: number;
  longitude?: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  updated_at?: string;
  age_seconds?: number;
  is_stale?: boolean;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatAge(sec: number): string {
  if (sec < 0) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export const ProviderTrackingCard: React.FC<Props> = ({
  bookingId,
  destination,
  destinationLabel,
}) => {
  const [resp, setResp] = useState<ProviderLocationResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const aliveRef = useRef(true);

  const poll = useCallback(
    async (manual = false) => {
      if (!bookingId) return;
      if (manual) setRefreshing(true);
      try {
        const r = await fetch(
          `${API_BASE}/api/booking/${bookingId}/provider-location`,
          { method: "GET" },
        );
        if (!r.ok) {
          if (aliveRef.current) setLoading(false);
          return;
        }
        const data: ProviderLocationResp = await r.json();
        if (aliveRef.current) {
          setResp(data);
          setLoading(false);
        }
      } catch {
        if (aliveRef.current) setLoading(false);
      } finally {
        if (manual && aliveRef.current) setRefreshing(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    aliveRef.current = true;
    poll();
    const t = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      aliveRef.current = false;
      clearInterval(t);
    };
  }, [poll]);

  const dest: LatLng | null =
    destination &&
    Number.isFinite(destination.latitude) &&
    Number.isFinite(destination.longitude)
      ? { lat: destination.latitude, lng: destination.longitude }
      : null;

  const provider: LatLng | null =
    resp?.available && resp.latitude != null && resp.longitude != null
      ? { lat: resp.latitude, lng: resp.longitude }
      : null;

  const isLive = !!(resp?.available && !resp.is_stale);
  const isStale = !!(resp?.available && resp.is_stale);

  let distanceKm: number | null = null;
  if (provider && dest) distanceKm = haversineKm(provider, dest);

  const openInMaps = () => {
    if (!provider) return;
    const dst = dest
      ? `${dest.lat},${dest.lng}`
      : `${provider.lat},${provider.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${provider.lat},${provider.lng}&destination=${dst}&travelmode=driving`;
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <View style={styles.card} testID="provider-tracking-loading">
        <View style={styles.headerRow}>
          <View style={[styles.statusDot, { backgroundColor: "#9CA3AF" }]} />
          <Text style={styles.headerTitle}>Loading live tracking…</Text>
        </View>
        <View style={[styles.mapPlaceholder, { height: 220 }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  // Provider assigned but hasn't shared GPS yet.
  if (!provider) {
    return (
      <View style={styles.card} testID="provider-tracking-waiting">
        <View style={styles.headerRow}>
          <View style={[styles.statusDot, { backgroundColor: "#9CA3AF" }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Live tracking will appear here</Text>
            <Text style={styles.headerSub}>
              {resp?.reason ?? "Waiting for provider to share location"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => poll(true)}
            hitSlop={10}
            style={styles.refreshBtn}
            disabled={refreshing}
            testID="provider-tracking-refresh"
          >
            <RefreshCw
              size={16}
              color={colors.primary}
              strokeWidth={2.5}
              style={refreshing ? { opacity: 0.5 } : undefined}
            />
          </TouchableOpacity>
        </View>
        {dest ? (
          <LiveMap destination={dest} height={180} testID="tracking-map-waiting" />
        ) : (
          <View style={[styles.mapPlaceholder, { height: 100 }]}>
            <Text style={styles.placeholderText}>
              Tracking activates once your service professional starts heading over.
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Provider actively sharing GPS.
  const ageSec = resp?.age_seconds ?? 0;
  return (
    <View style={styles.card} testID="provider-tracking-active">
      <View style={styles.headerRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isLive ? "#16A34A" : "#F59E0B" },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {isLive ? "Live • Provider on the way" : "Last seen"}
          </Text>
          <Text style={styles.headerSub}>
            {distanceKm != null && distanceKm < 50
              ? `${distanceKm.toFixed(distanceKm < 1 ? 2 : 1)} km away`
              : "Tracking active"}
            {" · "}
            Updated {formatAge(ageSec)}
            {isStale ? " (stale)" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => poll(true)}
          hitSlop={10}
          style={styles.refreshBtn}
          disabled={refreshing}
          testID="provider-tracking-refresh"
        >
          <RefreshCw
            size={16}
            color={colors.primary}
            strokeWidth={2.5}
            style={refreshing ? { opacity: 0.5 } : undefined}
          />
        </TouchableOpacity>
      </View>

      <LiveMap
        provider={provider}
        destination={dest}
        height={220}
        testID="tracking-map-active"
      />

      <TouchableOpacity
        style={styles.openMapsBtn}
        onPress={openInMaps}
        activeOpacity={0.85}
        testID="tracking-open-maps"
      >
        <Navigation size={14} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={styles.openMapsText}>Open route in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textMain,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholder: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 17,
  },
  openMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  openMapsText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
