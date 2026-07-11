import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MapPin, ExternalLink } from "lucide-react-native";
import { colors, radius } from "@/src/theme";

export interface PlatformMapProps {
  latitude: number;
  longitude: number;
  /** Called with the new lat/lng after the user drags the pin (native only). */
  onPinDragEnd?: (coords: { latitude: number; longitude: number }) => void;
  /** Label shown under the fallback view on web. */
  addressLabel?: string;
  height?: number;
  draggable?: boolean;
}

// react-native-maps is a native-only module — importing it unconditionally
// would crash the web bundle (and therefore the Emergent browser preview).
// We require() it lazily, only on native platforms.
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== "web") {
  try {
    const RNMaps = require("react-native-maps");
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
  } catch {
    // Native module not built into this binary (e.g. still running in a
    // plain Expo Go install without the maps config plugin) — fall through
    // to the same lightweight fallback used on web.
  }
}

export default function PlatformMap({
  latitude,
  longitude,
  onPinDragEnd,
  addressLabel,
  height = 220,
  draggable = true,
}: PlatformMapProps) {
  if (MapView && Marker) {
    return (
      <MapView
        style={[styles.map, { height }]}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          draggable={draggable}
          onDragEnd={(e: any) => onPinDragEnd?.(e.nativeEvent.coordinate)}
        />
      </MapView>
    );
  }

  // Web (and any environment without the native module) fallback — never
  // crashes, just shows the address and a link out to Google Maps.
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  return (
    <View style={[styles.fallback, { height }]}>
      <MapPin size={24} color={colors.primary} />
      <Text style={styles.fallbackLabel} numberOfLines={2}>
        {addressLabel || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
      </Text>
      {Platform.OS === "web" && (
        <TouchableOpacity
          style={styles.fallbackLink}
          onPress={() => {
            if (typeof window !== "undefined") window.open(mapsUrl, "_blank");
          }}
        >
          <ExternalLink size={13} color={colors.primary} />
          <Text style={styles.fallbackLinkText}>Open in Google Maps</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: "100%", borderRadius: radius.md },
  fallback: {
    width: "100%",
    borderRadius: radius.md,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  fallbackLabel: { fontSize: 13, color: colors.textMain, textAlign: "center" },
  fallbackLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  fallbackLinkText: { fontSize: 12, fontWeight: "600", color: colors.primary },
});
