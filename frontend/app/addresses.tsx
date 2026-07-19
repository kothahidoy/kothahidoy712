import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  Briefcase,
  Home,
  MapPin,
  Navigation,
  Plus,
  Trash2,
} from "lucide-react-native";
import * as Location from "expo-location";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { dataService } from "@/src/data/service";
import { CITIES } from "@/src/data/seed";
import { colors, radius, shadow } from "@/src/theme";
import { SavedAddress } from "@/src/types";
import { notify } from "@/src/utils/dialogs";
import { reverseGeocode } from "@/src/utils/geo";
import PlacesSearchInput, { PlaceResult } from "@/src/components/PlacesSearchInput";

export default function Addresses() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const load = useCallback(async () => {
    setAddresses(await dataService.listAddresses());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /** One-tap detect + save: requests permission, reverse-geocodes, saves as
   *  "Home" address. Used on empty-state CTA. */
  const detectAndSave = useCallback(async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        notify("Permission denied", "Please enable location to use this feature.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let line = "";
      let cityName = CITIES[0];
      const addr = await reverseGeocode(
        pos.coords.latitude,
        pos.coords.longitude,
      );
      if (addr) {
        line = addr.addressLine || addr.displayName || addr.name;
        if (addr.city) {
          cityName = CITIES.includes(addr.city) ? addr.city : addr.city;
        }
      }
      await dataService.saveAddress({
        label: "Home",
        addressLine: line || "Current location (edit to add details)",
        city: cityName,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        isDefault: addresses.length === 0,
      });
      await load();
      notify("Saved", "Current location saved as your Home address.");
    } catch (e: any) {
      notify("Could not detect", e?.message || "Try entering address manually.");
    } finally {
      setDetecting(false);
    }
  }, [addresses.length, load]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          testID="ad-back-btn"
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved addresses</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MapPin size={32} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptySub}>
              Save your home, office and other locations for faster booking.
            </Text>
            <TouchableOpacity
              style={styles.useCurrentBtn}
              onPress={detectAndSave}
              disabled={detecting}
              activeOpacity={0.85}
              testID="ad-use-current-btn"
            >
              <Navigation size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.useCurrentBtnText}>
                {detecting ? "Detecting location…" : "Use my current location"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((a) => (
            <View key={a.id} style={styles.card} testID={`ad-card-${a.id}`}>
              <View style={styles.addrIcon}>
                {a.label.toLowerCase().includes("office") ? (
                  <Briefcase size={20} color={colors.primary} strokeWidth={2.5} />
                ) : (
                  <Home size={20} color={colors.primary} strokeWidth={2.5} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.label}>{a.label}</Text>
                  {a.isDefault ? (
                    <View style={styles.defaultPill}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.addrText} numberOfLines={2}>
                  {a.addressLine}
                  {a.landmark ? `, near ${a.landmark}` : ""}, {a.city}
                </Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  await dataService.removeAddress(a.id);
                  load();
                }}
                hitSlop={12}
                testID={`ad-delete-${a.id}`}
              >
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {showForm ? (
          <AddressForm
            onSave={async (input) => {
              await dataService.saveAddress(input);
              setShowForm(false);
              load();
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(true)}
            activeOpacity={0.85}
            testID="ad-add-btn"
          >
            <Plus size={18} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.addBtnText}>Add new address</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AddressForm({
  onSave,
  onCancel,
}: {
  onSave: (i: Omit<SavedAddress, "id">) => Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("Home");
  const [houseFlat, setHouseFlat] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const detect = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        notify("Permission denied", "Enable location to auto-fill address.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      const addr = await reverseGeocode(
        pos.coords.latitude,
        pos.coords.longitude,
      );
      if (addr) {
        const line = addr.addressLine || addr.displayName || addr.name;
        if (line) setAddressLine(line);
        if (addr.city && CITIES.includes(addr.city)) setCity(addr.city);
      }
    } finally {
      setLocating(false);
    }
  };

  const onPlaceSelected = (place: PlaceResult) => {
    setCoords({ lat: place.latitude, lng: place.longitude });
    setAddressLine(place.addressLine || place.name);
    if (place.city && CITIES.includes(place.city as any)) setCity(place.city as any);
  };

  const save = async () => {
    if (houseFlat.trim().length < 1) {
      notify("House/Flat required", "Please enter your house or flat number.");
      return;
    }
    if (addressLine.trim().length < 5) {
      notify("Address required", "Please enter your full address.");
      return;
    }
    await onSave({
      label: label.trim() || "Home",
      addressLine: addressLine.trim(),
      houseFlat: houseFlat.trim(),
      landmark: landmark.trim() || undefined,
      city,
      // Only fall back to the Durgapur city-center pin if the user never
      // searched or used current location — better than silently
      // mis-pinning every manually-typed address there.
      latitude: coords?.lat ?? 23.5204,
      longitude: coords?.lng ?? 87.3119,
      isDefault,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.form}
    >
      <View style={styles.labelRow}>
        {["Home", "Office", "Other"].map((l) => (
          <TouchableOpacity
            key={l}
            onPress={() => setLabel(l)}
            style={[styles.labelChip, label === l && styles.labelChipActive]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.labelChipText,
                label === l && styles.labelChipTextActive,
              ]}
            >
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <PlacesSearchInput
        placeholder="Search area, street, landmark..."
        latitude={coords?.lat}
        longitude={coords?.lng}
        onSelect={onPlaceSelected}
      />

      <TouchableOpacity
        style={styles.locBtn}
        onPress={detect}
        disabled={locating}
        activeOpacity={0.85}
        testID="ad-locate-btn"
      >
        <Navigation size={14} color={colors.primary} strokeWidth={2.5} />
        <Text style={styles.locText}>
          {locating ? "Detecting…" : "Use my current location"}
        </Text>
      </TouchableOpacity>

      {/* coords is still tracked (from search / current-location) and used
          as the saved lat/lng — we just no longer show a draggable pin,
          since Google can't fill in a house/flat number for us anyway;
          the customer types that themselves below. */}

      <TextInput
        value={houseFlat}
        onChangeText={setHouseFlat}
        placeholder="House / Flat number"
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        testID="ad-housenum-input"
      />
      <TextInput
        value={addressLine}
        onChangeText={setAddressLine}
        placeholder="Street, area"
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        testID="ad-line-input"
      />
      <TextInput
        value={landmark}
        onChangeText={setLandmark}
        placeholder="Landmark (optional)"
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        testID="ad-landmark-input"
      />

      <Text style={styles.subLabel}>City</Text>
      <View style={styles.cityRow}>
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCity(c)}
            style={[styles.cityChip, city === c && styles.cityChipActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.cityText, city === c && styles.cityTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.defaultRow}
        onPress={() => setIsDefault(!isDefault)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, isDefault && styles.checkboxOn]}>
          {isDefault ? <View style={styles.checkboxDot} /> : null}
        </View>
        <Text style={styles.defaultRowText}>Make this my default address</Text>
      </TouchableOpacity>

      <View style={{ gap: 10, marginTop: 14 }}>
        <PrimaryButton label="Save address" onPress={save} testID="ad-save-btn" />
        <TouchableOpacity
          style={styles.secondary}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  scroll: { padding: 20, paddingBottom: 40, gap: 12 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 40,
    lineHeight: 19,
  },
  useCurrentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  useCurrentBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  addrIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 14, fontWeight: "800", color: colors.textMain },
  defaultPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  defaultText: { fontSize: 10, fontWeight: "800", color: colors.primary },
  addrText: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 17 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    backgroundColor: colors.primaryLight,
  },
  addBtnText: { fontWeight: "800", color: colors.primary, fontSize: 14 },
  form: {
    padding: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  labelRow: { flexDirection: "row", gap: 8 },
  labelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  labelChipText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  labelChipTextActive: { color: "#FFFFFF" },
  locBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    alignSelf: "flex-start",
  },
  locText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  input: {
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textMain,
    fontWeight: "500",
  },
  subLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  cityRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  cityText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  cityTextActive: { color: colors.primary },
  defaultRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkboxDot: { width: 10, height: 10, borderRadius: 2, backgroundColor: "#FFFFFF" },
  defaultRowText: { fontSize: 13, color: colors.textMain, fontWeight: "500" },
  secondary: { alignItems: "center", paddingVertical: 8 },
  secondaryText: { color: colors.textMuted, fontWeight: "700", fontSize: 14 },
});
