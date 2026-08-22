import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
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
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  User,
  X,
  XCircle,
} from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { ProviderTrackingCard } from "@/src/components/ProviderTrackingCard";
import { useSession } from "@/src/context/SessionContext";
import { dataService } from "@/src/data/service";
import { bookingApi, SlotDate, TimeSlot } from "@/src/data/bookingFlow";
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
    const b = await dataService.getBookingById(id);
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
      "If your slot is within the cancellation window, a fee may apply. This action cannot be undone.",
      "Cancel booking",
      "Keep booking",
    );
    if (!ok) return;
    try {
      const res = await bookingApi.cancelBooking(booking.id);
      if (res.cancellation_fee > 0) {
        notify(
          "Booking cancelled",
          `A late-cancellation fee of ₹${res.cancellation_fee} applies since this was within the free-cancellation window.`,
        );
      } else {
        notify("Booking cancelled", "No cancellation fee — you're all set.");
      }
    } catch (e: any) {
      notify("Couldn't cancel", e?.message || "Please try again.");
      return;
    }
    await load();
  };

  const onMarkDone = async () => {
    await dataService.markCompleted(booking.id);
    await load();
  };

  const submitReview = async () => {
    try {
      const res = await bookingApi.rateBooking(booking.id, rating, "");
      notify(
        res.published ? "Thanks for the 5★!" : "Thank you!",
        res.published
          ? "Your review is now visible on the service page."
          : "Your rating has been submitted. Our team will review it before it's shown publicly.",
      );
      await load();
    } catch (e: any) {
      notify("Couldn't submit", e?.message || "Please try again.");
    }
  };

  const canCancel = ["pending", "confirmed", "assigned", "in_progress"].includes(
    booking.status,
  );
  const canReschedule = ["pending", "confirmed", "assigned"].includes(booking.status);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [slotDates, setSlotDates] = useState<SlotDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const openReschedule = async () => {
    setRescheduleOpen(true);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setLoadingDates(true);
    try {
      const dates = await bookingApi.getSlotDates(7);
      setSlotDates(dates);
    } finally {
      setLoadingDates(false);
    }
  };

  const onPickDate = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const s = await bookingApi.getSlots(date);
      setSlots(s);
    } finally {
      setLoadingSlots(false);
    }
  };

  const onConfirmReschedule = async () => {
    if (!selectedDate || !selectedSlot) return;
    setRescheduling(true);
    try {
      await bookingApi.rescheduleBooking(booking.id, selectedDate, selectedSlot);
      setRescheduleOpen(false);
      notify("Booking rescheduled", "Your new slot is confirmed.");
      await load();
    } catch (e: any) {
      notify("Couldn't reschedule", e?.message || "Please try again.");
    } finally {
      setRescheduling(false);
    }
  };

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

        {/* Live Provider Tracking — shows map + provider's live GPS pin */}
        {booking.providerId &&
          (booking.status === "assigned" || booking.status === "in_progress") && (
            <ProviderTrackingCard
              bookingId={booking.id}
              destination={
                booking.address
                  ? {
                      latitude: booking.address.latitude,
                      longitude: booking.address.longitude,
                    }
                  : null
              }
              destinationLabel={booking.address?.addressLine}
            />
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
            <Text style={styles.rateTitle}>
              {booking.rating ? "Your rating" : "How was your experience?"}
            </Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => !booking.rating && setRating(i)}
                  disabled={!!booking.rating}
                  testID={`bd-star-${i}`}
                  activeOpacity={0.7}
                >
                  <Star
                    size={32}
                    color={i <= (booking.rating || rating) ? colors.star : colors.border}
                    fill={i <= (booking.rating || rating) ? colors.star : "transparent"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {!booking.rating && (
              <PrimaryButton
                label="Submit rating"
                onPress={submitReview}
                size="md"
                disabled={!rating}
                testID="bd-submit-rating"
              />
            )}
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
          {canReschedule ? (
            <TouchableOpacity
              style={styles.rescheduleBtn}
              activeOpacity={0.8}
              onPress={openReschedule}
              testID="bd-reschedule-btn"
            >
              <CalendarClock size={16} color={colors.primary} />
              <Text style={styles.rescheduleText}>Reschedule</Text>
            </TouchableOpacity>
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

      <Modal visible={rescheduleOpen} animationType="slide" transparent onRequestClose={() => setRescheduleOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule booking</Text>
              <TouchableOpacity onPress={() => setRescheduleOpen(false)} hitSlop={10}>
                <X size={20} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Pick a new date</Text>
            {loadingDates ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {slotDates.map((d) => (
                  <TouchableOpacity
                    key={d.date}
                    style={[styles.dateChip, selectedDate === d.date && styles.dateChipActive]}
                    onPress={() => onPickDate(d.date)}
                  >
                    <Text style={[styles.dateChipDay, selectedDate === d.date && styles.dateChipTextActive]}>
                      {d.day_name}
                    </Text>
                    <Text style={[styles.dateChipNum, selectedDate === d.date && styles.dateChipTextActive]}>
                      {d.day_num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedDate && (
              <>
                <Text style={styles.modalLabel}>Pick a new time slot</Text>
                {loadingSlots ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
                ) : (
                  <View style={styles.slotGrid}>
                    {slots.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        disabled={!s.available}
                        style={[
                          styles.slotChip,
                          selectedSlot === s.time && styles.slotChipActive,
                          !s.available && styles.slotChipDisabled,
                        ]}
                        onPress={() => setSelectedSlot(s.time)}
                      >
                        <Text
                          style={[
                            styles.slotChipText,
                            selectedSlot === s.time && styles.dateChipTextActive,
                            !s.available && styles.slotChipTextDisabled,
                          ]}
                        >
                          {s.time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            <PrimaryButton
              label={rescheduling ? "Rescheduling..." : "Confirm new slot"}
              onPress={onConfirmReschedule}
              disabled={!selectedDate || !selectedSlot || rescheduling}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
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
  rescheduleBtn: {
    height: 50,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  rescheduleText: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.textMain },
  modalLabel: { fontSize: 13, fontWeight: "700", color: colors.textMain, marginBottom: 10 },
  dateChip: {
    width: 56,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateChipDay: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  dateChipNum: { fontSize: 16, color: colors.textMain, fontWeight: "800", marginTop: 2 },
  dateChipTextActive: { color: "#fff" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  slotChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotChipDisabled: { opacity: 0.4 },
  slotChipText: { fontSize: 13, fontWeight: "600", color: colors.textMain },
  slotChipTextDisabled: { color: colors.textMuted },
});
