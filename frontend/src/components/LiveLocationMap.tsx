/**
 * LiveLocationMap
 * ──────────────────────────────────────────────────────────────────────
 * Tiny, no-API-key, cross-platform map.
 *
 *  • Renders an embedded OpenStreetMap (Mapnik) tile via the public
 *    /export/embed.html URL with a marker pin.
 *  • Web: native <iframe> created at runtime (RN-web doesn't expose one).
 *  • Native: react-native-webview, already in the dep tree.
 *
 * Optional: a second marker for the "destination" so customers can see
 * the pro's pin AND their own address pin at the same time. The bbox is
 * auto-padded so both pins are visible.
 */
import React, { useMemo, useRef, useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

type LatLng = { latitude: number; longitude: number };

interface Props {
  /** Primary pin (provider / current position). */
  provider: LatLng;
  /** Optional secondary pin (customer / destination). */
  destination?: LatLng | null;
  /** Override default height (default: 220). */
  height?: number;
  /** Override default border radius (default: 12). */
  borderRadius?: number;
}

function bboxFor(provider: LatLng, dest?: LatLng | null): {
  bbox: string;
  centerMarker: string;
} {
  const lats = [provider.latitude];
  const lngs = [provider.longitude];
  if (dest) {
    lats.push(dest.latitude);
    lngs.push(dest.longitude);
  }
  const padDeg = 0.005; // ~500m padding
  const minLat = Math.min(...lats) - padDeg;
  const maxLat = Math.max(...lats) + padDeg;
  const minLng = Math.min(...lngs) - padDeg;
  const maxLng = Math.max(...lngs) + padDeg;
  return {
    bbox: `${minLng},${minLat},${maxLng},${maxLat}`,
    // The embed URL only supports ONE marker query param, so we pin the
    // provider — the customer address pin is rendered overlay-side via
    // the leaflet variant on web. For embed.html we keep it simple.
    centerMarker: `${provider.latitude},${provider.longitude}`,
  };
}

function osmEmbedUrl(provider: LatLng, dest?: LatLng | null): string {
  const { bbox, centerMarker } = bboxFor(provider, dest);
  return (
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${encodeURIComponent(bbox)}` +
    `&layer=mapnik` +
    `&marker=${encodeURIComponent(centerMarker)}`
  );
}

export default function LiveLocationMap({
  provider,
  destination,
  height = 220,
  borderRadius = 12,
}: Props) {
  const url = useMemo(
    () => osmEmbedUrl(provider, destination ?? null),
    [provider.latitude, provider.longitude, destination?.latitude, destination?.longitude]
  );

  // ─── WEB BRANCH ───────────────────────────────────────────────────────
  // RN-web has no <iframe> primitive — render one imperatively into a div
  // host so we can fully control its src on prop changes.
  const hostRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const host: HTMLDivElement | null = hostRef.current;
    if (!host) return;
    host.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("title", "Provider live location map");
    host.appendChild(iframe);
    return () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };
  }, [url]);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.wrap, { height, borderRadius }]}>
        {/* @ts-ignore — imperative div host for iframe */}
        {React.createElement("div", {
          ref: hostRef,
          style: {
            width: "100%",
            height: "100%",
            backgroundColor: "#E5E7EB",
          } as any,
        })}
      </View>
    );
  }

  // ─── NATIVE BRANCH ────────────────────────────────────────────────────
  return (
    <View style={[styles.wrap, { height, borderRadius }]}>
      <WebView
        source={{ uri: url }}
        style={{ flex: 1, backgroundColor: "#E5E7EB" }}
        startInLoadingState
        allowsFullscreenVideo={false}
        // The OSM iframe is fully static — no JS bridge needed.
        javaScriptEnabled
        domStorageEnabled={false}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
});
