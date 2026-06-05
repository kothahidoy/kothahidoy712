import { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  User,
  XCircle,
} from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { useSession } from "@/src/context/SessionContext";
import { dataService } from "@/src/data/service";
import { providerService } from "@/src/data/providerService";
import { supabase } from "@/src/lib/supabase";
import { runRazorpayCheckout } from "@/src/lib/razorpay";
import { colors, radius, shadow } from "@/src/theme";
import { Booking, BookingStatus } from "@/src/types";
import { confirmAsync, notify } from "@/src/utils/dialogs";

const STATUS: Record<BookingStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pending", bg: colors.warningLight, fg: "#B45309" },
  confirmed: { label: "Confirmed", bg: colors.primaryLight, fg: colors.primary },
  assigned: { label: "Provider Assigned", bg: "#E0E7FF", fg: "#4F46E5" },
  in_progress: { label: "In Progress", bg: colors.successLight, fg: colors.success },
  completed: { label: "Completed", bg: colors.successLight, fg: colors.success },
  cancelled: { label: "Cancelled", bg: colors.errorLight, fg: colors.error },
};

export default function BookingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const all = await dataService.listBookings();
    const b = all.find((x) => x.id === id) ?? null;
    setBooking(b);
    setRating(b?.rating ?? 0);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!booking) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ padding: 20 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const date = new Date(booking.scheduledDate);
  const sc = STATUS[booking.status];

  const onCancel = async () => {
    const ok = await confirmAsync(
      "Cancel booking?",
      "This action cannot be undone.",
      "Cancel booking",
      "Keep booking",
    );
    if (!ok) return;
    await dataService.cancelBooking(booking.id);
    await load();
  };

  const onMarkDone = async () => {
    await dataService.markCompleted(booking.id);
    await load();
  };

  const submitReview = async () => {
    await dataService.submitReview(booking.id, rating, "");
    notify("Thank you!", "Your rating has been submitted.");
    await load();
  };

  const canCancel = ["pending", "confirmed", "assigned", "in_progress"].includes(
    booking.status,
  );

  const isUnpaid =
    booking.paymentStatus === "unpaid" || booking.paymentStatus === "failed";

  const onPayNow = async () => {
    if (!booking || paying) return;
    setPaying(true);
    const result = await runRazorpayCheckout({
      receiptId: `bk_${booking.id}`,
      amountInr: booking.price,
      customerName: profile?.name,
      customerEmail: profile?.email,
      customerPhone: profile?.phone,
      description: `${booking.serviceTitle} • ${booking.timeSlot}`,
    });
    if (result.status === "paid") {
      // Persist the verified payment onto the existing booking row.
      try {
        if (supabase) {
          await supabase
            .from("bookings")
            .update({
              payment_status: "paid",
              payment_method: "razorpay",
              payment_id: result.paymentId,
              payment_order: result.orderId,
              paid_at: new Date().toISOString(),
            })
            .eq("id", booking.id);
        }
      } catch (e) {
        console.warn("[pay-now] update booking failed", e);
      }
      notify("Payment successful", `Paid ₹${booking.price} via Razorpay.`);
      await load();
    } else if (result.status === "failed") {
      notify("Payment failed", result.reason);
    }
    // dismissed → silent
    setPaying(false);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          testID="bd-back-btn"
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>Booking details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Image
            source={{ uri: booking.serviceImage }}
            style={styles.heroImg}
          />
          <View style={{ padding: 14 }}>
            <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
              {booking.status === "completed" ? (
                <CheckCircle2 size={11} color={sc.fg} strokeWidth={2.5} />
              ) : booking.status === "cancelled" ? (
                <XCircle size={11} color={sc.fg} strokeWidth={2.5} />
              ) : (
                <Clock size={11} color={sc.fg} strokeWidth={2.5} />
              )}
              <Text style={[styles.statusText, { color: sc.fg }]}>
                {sc.label}
              </Text>
            </View>
            <Text style={styles.svcTitle}>{booking.serviceTitle}</Text>

            <View style={styles.metaRow}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {date.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{booking.timeSlot}</Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={2}>
                {booking.address.addressLine}, {booking.address.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Provider Info */}
        {booking.providerId && (
          <View style={styles.providerCard}>
            <View style={styles.providerAvatar}>
              <User size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.providerLabel}>Your Service Provider</Text>
              <Text style={styles.providerName}>{booking.providerName ?? "Assigned Provider"}</Text>
              <Text style={styles.providerStatus}>
                {booking.status === "assigned" && "Will arrive on scheduled time"}
                {booking.status === "in_progress" && "Currently working on your service"}
                {booking.status === "completed" && "Service completed"}
              </Text>
            </View>
          </View>
        )}

        {/* Contact pro */}
        {booking.status !== "cancelled" && booking.status !== "completed" ? (
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactBtn}
              activeOpacity={0.8}
              testID="bd-call-btn"
            >
              <Phone size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.contactText}>Call pro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactBtn}
              activeOpacity={0.8}
              testID="bd-message-btn"
            >
              <MessageSquare size={16} color={colors.primary} strokeWidth={2.5} />
              <Text style={styles.contactText}>Message</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Price */}
        <View style={styles.bill}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Total paid</Text>
            <Text style={styles.billValue}>₹{booking.price}</Text>
          </View>
          {booking.notes ? (
            <>
              <View style={styles.billDivider} />
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </>
          ) : null}
        </View>

        {/* Rate */}
        {booking.status === "completed" ? (
          <View style={styles.rateBox} testID="bd-rate-box">
            <Text style={styles.rateTitle}>How was your experience?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i)}
                  testID={`bd-star-${i}`}
                  activeOpacity={0.7}
                >
                  <Star
                    size={32}
                    color={i <= rating ? colors.star : colors.border}
                    fill={i <= rating ? colors.star : "transparent"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton
              label={booking.rating ? "Update rating" : "Submit rating"}
              onPress={submitReview}
              size="md"
              disabled={!rating}
              testID="bd-submit-rating"
            />
          </View>
        ) : null}

        {/* Actions */}
        <View style={{ marginTop: 20, gap: 10 }}>
          {isUnpaid && booking.status !== "cancelled" ? (
            <View style={styles.payBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.payBannerTitle}>Payment pending</Text>
                <Text style={styles.payBannerSub}>
                  ₹{booking.price} • pay securely via Razorpay
                </Text>
              </View>
              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={onPayNow}
                disabled={paying}
                activeOpacity={0.85}
                testID="bd-pay-now"
              >
                <Text style={styles.payNowText}>
                  {paying ? "Opening…" : `Pay ₹${booking.price}`}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {booking.paymentStatus === "paid" ? (
            <View style={styles.paidBanner}>
              <CheckCircle2 size={16} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.paidText}>
                Paid via Razorpay
                {booking.paymentId ? ` · ${booking.paymentId.slice(-8)}` : ""}
              </Text>
            </View>
          ) : null}
          {booking.status === "confirmed" || booking.status === "assigned" || booking.status === "in_progress" ? (
            <PrimaryButton
              label="Mark as completed"
              variant="secondary"
              onPress={onMarkDone}
              testID="bd-done-btn"
            />
          ) : null}
          {canCancel ? (
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={onCancel}
              testID="bd-cancel-btn"
            >
              <Text style={styles.cancelText}>Cancel booking</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  payBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight ?? "#EEF2FF",
    borderRadius: radius.lg,
    padding: 14,
    gap: 12,
  },
  payBannerTitle: { fontSize: 14, fontWeight: "800", color: colors.textMain },
  payBannerSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  payNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  payNowText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  paidBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.successLight,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  paidText: { fontSize: 13, fontWeight: "700", color: colors.success },
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
  scroll: { padding: 20, paddingBottom: 40 },
  heroCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  heroImg: { width: "100%", height: 180 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 11, fontWeight: "800" },
  svcTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  metaText: { fontSize: 13, color: colors.textBody, flex: 1 },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  providerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMain,
    marginTop: 2,
  },
  providerStatus: {
    fontSize: 11,
    color: colors.success,
    fontWeight: "600",
    marginTop: 2,
  },
  contactRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
  },
  contactText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  bill: {
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billRow: { flexDirection: "row", justifyContent: "space-between" },
  billLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },
  billValue: { fontSize: 18, fontWeight: "800", color: colors.textMain },
  billDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 10 },
  notesLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  notesText: { fontSize: 13, color: colors.textBody, marginTop: 4 },
  rateBox: {
    marginTop: 20,
    padding: 18,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  rateTitle: { fontSize: 15, fontWeight: "800", color: colors.textMain },
  stars: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 18,
  },
  cancelBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: colors.error, fontWeight: "800", fontSize: 14 },
});
