import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MapPin, ExternalLink } from "lucide-react-native";
import { colors, radius } from "@/src/theme";

export interface PlatformMapProps {
  latitude: number;
  longitude: number;
  onPinDragEnd?: (coords: { latitude: number; longitude: number }) => void;
  addressLabel?: string;
  height?: number;
  draggable?: boolean;
}

// Web build: never touches react-native-maps (native-only module).
// Metro auto-picks this file when bundling for platform=web.
export default function PlatformMap({
  latitude,
  longitude,
  addressLabel,
  height = 220,
}: PlatformMapProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  return (
    <View style={[styles.fallback, { height }]}>
      <MapPin size={24} color={colors.primary} />
      <Text style={styles.fallbackLabel} numberOfLines={2}>
        {addressLabel || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
      </Text>
      <TouchableOpacity
        style={styles.fallbackLink}
        onPress={() => {
          if (typeof window !== "undefined") window.open(mapsUrl, "_blank");
        }}
      >
        <ExternalLink size={13} color={colors.primary} />
        <Text style={styles.fallbackLinkText}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
