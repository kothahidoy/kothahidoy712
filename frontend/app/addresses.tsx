import { useCallback, useState } from "react";
import {
  Alert,
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

export default function Addresses() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setAddresses(await dataService.listAddresses());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
        Alert.alert("Permission denied", "Enable location to auto-fill address.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const p = places[0];
        if (p) {
          const parts = [p.name, p.street, p.district].filter(Boolean).join(", ");
          if (parts) setAddressLine(parts);
          if (p.city && CITIES.includes(p.city)) setCity(p.city);
        }
      } catch {
        // ignore
      }
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    if (addressLine.trim().length < 5) {
      Alert.alert("Address required", "Please enter your full address.");
      return;
    }
    await onSave({
      label: label.trim() || "Home",
      addressLine: addressLine.trim(),
      landmark: landmark.trim() || undefined,
      city,
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

      <TextInput
        value={addressLine}
        onChangeText={setAddressLine}
        placeholder="House / flat, street, area"
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
