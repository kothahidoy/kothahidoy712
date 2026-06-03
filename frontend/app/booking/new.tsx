import { useEffect, useMemo, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDays, format } from "date-fns";
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Navigation,
  Pencil,
  Tag,
} from "lucide-react-native";
import * as Location from "expo-location";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { useSession } from "@/src/context/SessionContext";
import { dataService } from "@/src/data/service";
import { CITIES } from "@/src/data/seed";
import { runRazorpayCheckout } from "@/src/lib/razorpay";
import { colors, radius, shadow } from "@/src/theme";
import { SavedAddress, Service } from "@/src/types";
import { notify } from "@/src/utils/dialogs";

type PayMethod = "razorpay" | "cash";

export default function BookingNew() {
  const router = useRouter();
  const { profile } = useSession();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [service, setService] = useState<Service | null>(null);

  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState<Date>(today);
  const [slot, setSlot] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState("");
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  // No default — the customer MUST pick a payment method explicitly so the
  // booking can't be confirmed by accident with the wrong option.
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);

  const slots = dataService.getTimeSlots();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  useEffect(() => {
    if (!serviceId) return;
    dataService.getServiceById(serviceId).then((s) => setService(s ?? null));
  }, [serviceId]);

  const detectLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        notify(
          "Location permission",
          "Enable location to auto-detect your address.",
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      // Reverse geocode (best-effort)
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
    } catch (e) {
      notify("Could not detect location", String(e));
    } finally {
      setLocating(false);
    }
  };

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    const map: Record<string, number> = {
      MFIX30: 30,
      COOLAC: 20,
      WEEKEND25: 25,
    };
    const d = map[code] ?? 0;
    setDiscount(d);
    notify(
      d ? "Promo applied" : "Invalid promo",
      d ? `${d}% off applied to your booking.` : "Try MFIX30 / COOLAC / WEEKEND25",
    );
  };

  const subtotal = service?.startingPrice ?? 0;
  const discountAmount = Math.round((subtotal * discount) / 100);
  const total = subtotal - discountAmount;

  const canBook =
    !!service &&
    !!slot &&
    addressLine.trim().length > 5 &&
    !!payMethod &&
    !loading;

  const onBook = async () => {
    if (!service || !slot || !payMethod) return;
    setLoading(true);

    const address: SavedAddress = {
      id: "ad-" + Date.now(),
      label: "Home",
      addressLine: addressLine.trim(),
      landmark: landmark.trim() || undefined,
      city,
      latitude: coords?.lat ?? 23.5204,
      longitude: coords?.lng ?? 87.3119,
    };

    // ───────── Cash on Service ─────────
    if (payMethod === "cash") {
      const booking = await dataService.createBooking({
        serviceId: service.id,
        serviceTitle: service.title,
        serviceImage: service.image,
        scheduledDate: date.toISOString(),
        timeSlot: slot,
        address,
        notes: notes.trim() || undefined,
        price: total,
        paymentStatus: "unpaid",
        paymentMethod: "cash",
      });
      setLoading(false);
      router.replace({
        pathname: "/booking/confirmation",
        params: { id: booking.id, pay: "cash" },
      });
      return;
    }

    // ───────── Razorpay — PAY FIRST, BOOK ONLY ON SUCCESS ─────────
    const result = await runRazorpayCheckout({
      amountInr: total,
      customerName: profile?.name,
      customerEmail: profile?.email,
      customerPhone: profile?.phone,
      description: `${service.title} • ${format(date, "EEE d MMM")} ${slot}`,
    });

    if (result.status !== "paid") {
      setLoading(false);
      if (result.status === "dismissed") {
        notify(
          "Payment cancelled",
          "No charge was made. Your booking has not been created.",
        );
      } else {
        notify("Payment failed", result.reason);
      }
      // IMPORTANT: do NOT create a booking — return to the form.
      return;
    }

    // Signature verified server-side → safe to create the booking now.
    try {
      const booking = await dataService.createBooking({
        serviceId: service.id,
        serviceTitle: service.title,
        serviceImage: service.image,
        scheduledDate: date.toISOString(),
        timeSlot: slot,
        address,
        notes: notes.trim() || undefined,
        price: total,
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        paymentId: result.paymentId,
        paymentOrder: result.orderId,
      });
      setLoading(false);
      router.replace({
        pathname: "/booking/confirmation",
        params: { id: booking.id, pay: "paid", pid: result.paymentId },
      });
    } catch (e) {
      setLoading(false);
      // Edge case: payment captured but booking insert failed (network /
      // RLS). Tell the user clearly and keep the payment id visible so
      // support can reconcile.
      notify(
        "Payment captured — saving failed",
        `We received your payment (${result.paymentId}) but couldn't save the booking. Please contact support with this id.`,
      );
    }
  };

  if (!service) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ padding: 20 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          testID="bk-back-btn"
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.crumb}>Book service</Text>
          <Text style={styles.title} numberOfLines={1}>
            {service.title}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Date */}
          <Text style={styles.sectionTitle}>Choose date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {dates.map((d) => {
              const active = format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
              return (
                <TouchableOpacity
                  key={d.toISOString()}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setDate(d)}
                  activeOpacity={0.85}
                  testID={`bk-date-${format(d, "yyyy-MM-dd")}`}
                >
                  <Text
                    style={[styles.dateDow, active && styles.dateDowActive]}
                  >
                    {format(d, "EEE")}
                  </Text>
                  <Text
                    style={[styles.dateNum, active && styles.dateNumActive]}
                  >
                    {format(d, "d")}
                  </Text>
                  <Text
                    style={[styles.dateMo, active && styles.dateMoActive]}
                  >
                    {format(d, "MMM")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time */}
          <Text style={styles.sectionTitle}>Choose time slot</Text>
          <View style={styles.slots}>
            {slots.map((s) => {
              const active = slot === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.slot, active && styles.slotActive]}
                  onPress={() => setSlot(s)}
                  activeOpacity={0.85}
                  testID={`bk-slot-${s.replace(/[: ]/g, "")}`}
                >
                  <Clock
                    size={12}
                    color={active ? "#FFFFFF" : colors.textMuted}
                    strokeWidth={2.5}
                  />
                  <Text style={[styles.slotText, active && styles.slotTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Address */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Service address</Text>
            <TouchableOpacity
              style={styles.detect}
              onPress={detectLocation}
              disabled={locating}
              testID="bk-locate-btn"
              activeOpacity={0.8}
            >
              <Navigation size={12} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.detectText}>
                {locating ? "Detecting…" : "Use my location"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapMock} testID="bk-map-preview">
            <View style={styles.mapDot}>
              <MapPin size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.mapText}>
              {coords
                ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : "Pin will be placed on your location"}
            </Text>
          </View>

          <View style={styles.inputWrap}>
            <Pencil size={14} color={colors.textMuted} />
            <TextInput
              value={addressLine}
              onChangeText={setAddressLine}
              placeholder="House / flat, street, area"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              testID="bk-address-input"
            />
          </View>

          <View style={styles.inputWrap}>
            <Tag size={14} color={colors.textMuted} />
            <TextInput
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Nearby landmark (optional)"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              testID="bk-landmark-input"
            />
          </View>

          <Text style={styles.subLabel}>City</Text>
          <View style={styles.cityRow}>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCity(c)}
                style={[styles.cityChip, city === c && styles.cityChipActive]}
                activeOpacity={0.8}
                testID={`bk-city-${c.toLowerCase()}`}
              >
                <Text
                  style={[
                    styles.cityText,
                    city === c && styles.cityTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.sectionTitle}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any details for the professional…"
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={3}
            testID="bk-notes-input"
          />

          {/* Promo */}
          <Text style={styles.sectionTitle}>Promo code</Text>
          <View style={styles.promoRow}>
            <View style={[styles.inputWrap, { flex: 1, marginTop: 0 }]}>
              <Tag size={14} color={colors.textMuted} />
              <TextInput
                value={promo}
                onChangeText={(t) => setPromo(t.toUpperCase())}
                placeholder="Enter promo (try MFIX30)"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                autoCapitalize="characters"
                testID="bk-promo-input"
              />
            </View>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={applyPromo}
              activeOpacity={0.85}
              testID="bk-promo-apply"
            >
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {discount > 0 ? (
            <View style={styles.promoChip}>
              <Check size={12} color={colors.success} strokeWidth={3} />
              <Text style={styles.promoChipText}>
                {discount}% discount applied
              </Text>
            </View>
          ) : null}

          {/* Summary */}
          <Text style={styles.sectionTitle}>Bill summary</Text>
          <View style={styles.bill}>
            <Row label={service.title} value={`₹${subtotal}`} />
            {discount > 0 ? (
              <Row label={`Discount (${discount}%)`} value={`- ₹${discountAmount}`} positive />
            ) : null}
            <View style={styles.billDivider} />
            <Row label="Total" value={`₹${total}`} bold />
          </View>

          {/* Payment method — REQUIRED */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How do you want to pay?</Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Required</Text>
            </View>
          </View>
          {!payMethod ? (
            <Text style={styles.payHint}>
              Choose Pay online or Cash on Service to continue.
            </Text>
          ) : null}
          <View style={styles.payRow}>
            <TouchableOpacity
              style={[styles.payCard, payMethod === "razorpay" && styles.payCardActive]}
              onPress={() => setPayMethod("razorpay")}
              activeOpacity={0.85}
              testID="bk-pay-online"
            >
              <View style={styles.payCardHeader}>
                <Text style={styles.payCardTitle}>💳 Pay online</Text>
                {payMethod === "razorpay" ? (
                  <View style={styles.payDot}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.payRing} />
                )}
              </View>
              <Text style={styles.payCardSub}>
                UPI / Card / NetBanking — Razorpay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payCard, payMethod === "cash" && styles.payCardActive]}
              onPress={() => setPayMethod("cash")}
              activeOpacity={0.85}
              testID="bk-pay-cash"
            >
              <View style={styles.payCardHeader}>
                <Text style={styles.payCardTitle}>💵 Cash on Service</Text>
                {payMethod === "cash" ? (
                  <View style={styles.payDot}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.payRing} />
                )}
              </View>
              <Text style={styles.payCardSub}>
                Pay the professional when work is done
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={["bottom"]} style={styles.cta}>
        <PrimaryButton
          label={
            !payMethod
              ? "Choose a payment method"
              : payMethod === "razorpay"
                ? `Pay ₹${total} & Book`
                : `Confirm booking · ₹${total}`
          }
          onPress={onBook}
          disabled={!canBook}
          loading={loading}
          testID="bk-confirm-btn"
        />
      </SafeAreaView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  bold,
  positive,
}: {
  label: string;
  value: string;
  bold?: boolean;
  positive?: boolean;
}) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, bold && { fontWeight: "800", color: colors.textMain }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.billValue,
          bold && { fontSize: 18, fontWeight: "800", color: colors.textMain },
          positive && { color: colors.success },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  payRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  requiredBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  requiredText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
    letterSpacing: 0.2,
  },
  payHint: {
    fontSize: 12,
    color: "#B91C1C",
    marginTop: 6,
    fontWeight: "500",
  },
  payCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  payCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight ?? "#EEF2FF",
  },
  payCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  payCardTitle: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  payCardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  payDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  payRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
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
  crumb: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "800", color: colors.textMain },
  scroll: { padding: 20, paddingBottom: 30 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 18,
  },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  dateRow: { gap: 10, paddingVertical: 12 },
  dateChip: {
    width: 60,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateDow: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  dateDowActive: { color: "rgba(255,255,255,0.85)" },
  dateNum: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 2,
  },
  dateNumActive: { color: "#FFFFFF" },
  dateMo: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  dateMoActive: { color: "rgba(255,255,255,0.85)" },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: 12, fontWeight: "700", color: colors.textMain },
  slotTextActive: { color: "#FFFFFF" },
  detect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  detectText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  mapMock: {
    marginTop: 12,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  mapDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.floating,
  },
  mapText: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: colors.textMain,
    fontWeight: "500",
  },
  textarea: {
    height: 90,
    paddingVertical: 12,
    paddingHorizontal: 14,
    textAlignVertical: "top",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 14,
    marginBottom: 8,
  },
  cityRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
  },
  cityChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  cityText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  cityTextActive: { color: colors.primary },
  promoRow: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "center" },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    height: 50,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  promoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  promoChipText: { fontSize: 12, fontWeight: "700", color: colors.success },
  bill: {
    marginTop: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  billLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },
  billValue: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  billDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 8,
  },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.bottomNav,
  },
});
