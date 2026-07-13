import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, LocateFixed } from "lucide-react-native";
import * as Location from "expo-location";

import PlacesSearchInput, { PlaceResult } from "@/src/components/PlacesSearchInput";
import { writeLiveLocationCache } from "@/src/hooks/useLiveLocation";
import { reverseGeocode } from "@/src/utils/geo";
import { dataService } from "@/src/data/service";
import { colors } from "@/src/theme";
import { notify } from "@/src/utils/dialogs";

export default function LocationSearchScreen() {
  const router = useRouter();
  const [detecting, setDetecting] = useState(false);

  const saveAndClose = async (opts: {
    label: string;
    area: string;
    city: string;
    latitude: number;
    longitude: number;
    addressLine?: string;
  }) => {
    await writeLiveLocationCache({
      label: opts.label,
      area: opts.area,
      city: opts.city || "Durgapur",
      latitude: opts.latitude,
      longitude: opts.longitude,
      updatedAt: Date.now(),
    });

    // Also save/refresh it as the customer's default address, same as the
    // GPS-detect flow on location-select.tsx, so it's ready to use at
    // checkout without asking again.
    try {
      await dataService.saveAddress({
        label: "Home",
        addressLine: opts.addressLine || opts.label,
        city: opts.city || "Durgapur",
        latitude: opts.latitude,
        longitude: opts.longitude,
        isDefault: true,
      });
    } catch {
      // Non-fatal — the header label is already updated either way.
    }

    router.back();
  };

  const onPlaceSelected = (place: PlaceResult) => {
    const label =
      place.area && place.city && place.area !== place.city
        ? `${place.city} — ${place.area}`
        : place.city || place.area || place.name;
    saveAndClose({
      label,
      area: place.area,
      city: place.city,
      latitude: place.latitude,
      longitude: place.longitude,
      addressLine: place.addressLine,
    });
  };

  const onUseCurrentLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        notify("Permission needed", "Please allow location access to use this.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      const area = addr?.area || addr?.name || "";
      const city = addr?.city || "Durgapur";
      const label =
        addr?.label || (area && city !== area ? `${city} — ${area}` : city);
      await saveAndClose({
        label,
        area,
        city,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        addressLine: addr?.addressLine || addr?.displayName,
      });
    } catch (e: any) {
      notify("Couldn't detect location", e?.message || "Please try searching instead.");
    } finally {
      setDetecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <PlacesSearchInput
          placeholder="Search for your location/society/apartment"
          onSelect={onPlaceSelected}
        />

        <TouchableOpacity
          style={styles.currentLocationRow}
          onPress={onUseCurrentLocation}
          disabled={detecting}
          activeOpacity={0.7}
        >
          {detecting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <LocateFixed size={18} color={colors.primary} />
          )}
          <Text style={styles.currentLocationText}>
            {detecting ? "Detecting your location…" : "Use current location"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.poweredByRow}>
        <Text style={styles.poweredByText}>powered by Google</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  body: { paddingHorizontal: 16, paddingTop: 4 },
  currentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
  },
  currentLocationText: { fontSize: 15, fontWeight: "600", color: colors.primary },
  poweredByRow: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  poweredByText: { fontSize: 11, color: colors.textSubtle },
});
