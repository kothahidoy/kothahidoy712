/**
 * Location-select screen (Urban Company style).
 * ────────────────────────────────────────────────────────────────────
 * Shown right after login / profile setup (and on first home visit when
 * the customer has no saved address yet).
 *
 *  • "At my current location"  → GPS + reverse geocode → green
 *    "Delivering service at <Place>" confirmation → saved as the
 *    DEFAULT "Home" address → auto-selected at booking time.
 *  • "I'll enter my location manually" → address form with city chips.
 *  • "Skip for now" → continue without saving.
 */
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MapPin, Navigation, PencilLine, CheckCircle2 } from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { CITIES } from "@/src/data/seed";
import { dataService } from "@/src/data/service";
import { colors, radius, shadow } from "@/src/theme";
import {
  detectCurrentAddress,
  GeoAddress,
  LOCATION_PROMPT_KEY,
} from "@/src/utils/geo";
import { notify } from "@/src/utils/dialogs";
import PlacesSearchInput, { PlaceResult } from "@/src/components/PlacesSearchInput";

const GREEN = "#16A34A";

type Stage = "choice" | "detecting" | "confirm" | "manual";

export default function LocationSelect() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("choice");
  const [detected, setDetected] = useState<GeoAddress | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  const startPulse = useCallback(() => {
    pulse.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const finish = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LOCATION_PROMPT_KEY, "1");
    } catch {
      /* ignore */
    }
    router.replace("/(tabs)");
  }, [router]);

  const onDetect = useCallback(async () => {
    setStage("detecting");
    startPulse();
    const result = await detectCurrentAddress();
    if (result.status === "denied") {
      notify(
        "Location permission needed",
        "Please allow location access, or enter your address manually.",
      );
      setStage("choice");
      return;
    }
    if (result.status === "error") {
      notify("Could not detect location", "Please enter your address manually.");
      setStage("manual");
      return;
    }
    setCoords({ lat: result.latitude, lng: result.longitude });
    if (result.address) {
      setDetected(result.address);
      setStage("confirm");
    } else {
      notify(
        "Almost there",
        "We found your location but not its name. Please type your address.",
      );
      setStage("manual");
    }
  }, [startPulse]);

  const saveDetected = useCallback(async () => {
    if (!detected || !coords) return;
    setSaving(true);
    try {
      const cityName =
        detected.city && CITIES.includes(detected.city)
          ? detected.city
          : detected.city || CITIES[0];
      await dataService.saveAddress({
        label: "Home",
        addressLine: detected.addressLine || detected.name,
        landmark: undefined,
        city: cityName,
        latitude: coords.lat,
        longitude: coords.lng,
        isDefault: true,
      });
      await finish();
    } catch (e: any) {
      notify("Could not save", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }, [detected, coords, finish]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.08],
  });

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {stage === "manual" ? (
        <ManualForm
          onBack={() => setStage("choice")}
          onSaved={finish}
        />
      ) : (
        <View style={styles.body}>
          {/* Illustration */}
          <View style={styles.illustration}>
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
            <View style={styles.pinCircle}>
              <MapPin size={44} color={colors.primary} strokeWidth={2.2} />
            </View>
          </View>

          {stage === "confirm" && detected ? (
            <View style={styles.confirmWrap} testID="loc-confirm-block">
              <Text style={styles.deliveringAt}>Delivering service at</Text>
              <Text style={styles.placeName} testID="loc-place-name">
                {detected.name}
              </Text>
              <Text style={styles.placeSub} numberOfLines={2}>
                {detected.displayName}
              </Text>
              <View style={{ height: 22 }} />
              <PrimaryButton
                label={saving ? "Saving…" : "Confirm & save this address"}
                onPress={saveDetected}
                loading={saving}
                testID="loc-confirm-btn"
              />
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onDetect}
                activeOpacity={0.8}
                testID="loc-retry-btn"
              >
                <Navigation size={15} color={colors.primary} strokeWidth={2.4} />
                <Text style={styles.secondaryBtnText}>Detect again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => setStage("manual")}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>Enter a different address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.choiceWrap}>
              <Text style={styles.title}>Where do you want your service?</Text>
              <Text style={styles.subtitle}>
                We use your location to show verified pros and services
                available near you.
              </Text>

              <View style={{ height: 24 }} />

              <TouchableOpacity
                style={[styles.primaryCta, stage === "detecting" && { opacity: 0.75 }]}
                onPress={onDetect}
                disabled={stage === "detecting"}
                activeOpacity={0.88}
                testID="loc-current-btn"
              >
                {stage === "detecting" ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Navigation size={18} color="#FFFFFF" strokeWidth={2.4} />
                )}
                <Text style={styles.primaryCtaText}>
                  {stage === "detecting"
                    ? "Detecting your location…"
                    : "At my current location"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineCta}
                onPress={() => setStage("manual")}
                activeOpacity={0.85}
                testID="loc-manual-btn"
              >
                <PencilLine size={17} color={colors.primary} strokeWidth={2.2} />
                <Text style={styles.outlineCtaText}>
                  {"I'll enter my location manually"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={finish}
                activeOpacity={0.7}
                testID="loc-skip-btn"
              >
                <Text style={styles.linkText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ───────────────────────────── Manual form ─────────────────────────────

function ManualForm({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [houseFlat, setHouseFlat] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState({ lat: 23.5204, lng: 87.3119 }); // Durgapur center — fallback only

  const onPlaceSelected = (place: PlaceResult) => {
    setAddressLine(place.addressLine || place.name);
    setCoords({ lat: place.latitude, lng: place.longitude });
    if (place.city && CITIES.includes(place.city as any)) {
      setCity(place.city as any);
    }
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
    setSaving(true);
    try {
      await dataService.saveAddress({
        label: "Home",
        addressLine: addressLine.trim(),
        houseFlat: houseFlat.trim(),
        landmark: landmark.trim() || undefined,
        city,
        latitude: coords.lat,
        longitude: coords.lng,
        isDefault: true,
      });
      await onSaved();
    } catch (e: any) {
      notify("Could not save", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.manualScroll}>
        <View style={styles.manualIcon}>
          <MapPin size={26} color={colors.primary} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>Enter your location</Text>
        <Text style={styles.subtitle}>
          This address will be saved and auto-selected when you book a service.
        </Text>

        <Text style={styles.fieldLabel}>Search for your address</Text>
        <PlacesSearchInput
          placeholder="Search area, street, landmark..."
          latitude={coords.lat}
          longitude={coords.lng}
          onSelect={onPlaceSelected}
        />

        <Text style={styles.fieldLabel}>House / Flat number</Text>
        <TextInput
          value={houseFlat}
          onChangeText={setHouseFlat}
          placeholder="e.g. Flat 302, Block B"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          testID="loc-manual-housenum"
        />

        <Text style={styles.fieldLabel}>Full address</Text>
        <TextInput
          value={addressLine}
          onChangeText={setAddressLine}
          placeholder="Street, area"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          testID="loc-manual-address"
        />

        <Text style={styles.fieldLabel}>Landmark (optional)</Text>
        <TextInput
          value={landmark}
          onChangeText={setLandmark}
          placeholder="e.g. Near City Centre"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          testID="loc-manual-landmark"
        />

        <Text style={styles.fieldLabel}>City</Text>
        <View style={styles.cityRow}>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCity(c)}
              style={[styles.cityChip, city === c && styles.cityChipActive]}
              activeOpacity={0.85}
              testID={`loc-city-${c.toLowerCase()}`}
            >
              <Text
                style={[styles.cityText, city === c && styles.cityTextActive]}
              >
                {c}
              </Text>
              {city === c ? (
                <CheckCircle2 size={13} color={colors.primary} strokeWidth={2.6} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 26 }} />
        <PrimaryButton
          label={saving ? "Saving…" : "Save & continue"}
          onPress={save}
          loading={saving}
          testID="loc-manual-save"
        />
        <TouchableOpacity style={styles.linkBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.linkText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ───────────────────────────── Styles ─────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, paddingHorizontal: 20, justifyContent: "flex-end" },
  illustration: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.primary,
  },
  pinCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  choiceWrap: { paddingBottom: 18 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  primaryCtaText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  outlineCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    marginTop: 12,
  },
  outlineCtaText: { fontSize: 15, fontWeight: "700", color: colors.primary },
  linkBtn: { alignItems: "center", paddingVertical: 16 },
  linkText: { fontSize: 14, fontWeight: "700", color: colors.textMuted },
  // confirm state
  confirmWrap: { paddingBottom: 18, alignItems: "center" },
  deliveringAt: {
    fontSize: 14,
    fontWeight: "700",
    color: GREEN,
    marginBottom: 6,
  },
  placeName: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textMain,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  placeSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    alignSelf: "stretch",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    marginTop: 12,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  // manual form
  manualScroll: { padding: 20, flexGrow: 1 },
  manualIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMain,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textMain,
    fontWeight: "500",
  },
  cityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  cityText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  cityTextActive: { color: colors.primary },
});
