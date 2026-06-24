import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Clock, Home, CheckCircle2, CreditCard, Banknote } from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { useCart } from "@/src/context/CartContext";
import { useSession } from "@/src/context/SessionContext";
import { bookingApi } from "@/src/data/bookingFlow";
import { dataService } from "@/src/data/service";
import { SavedAddress } from "@/src/types";
import { notify } from "@/src/utils/dialogs";
import { runRazorpayCheckout } from "@/src/lib/razorpay";

const PURPLE = "#6E3DF5";
const PURPLE_LIGHT = "#EFE9FE";
const GREEN = "#16A34A";

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { profile } = useSession();
  const params = useLocalSearchParams<{ slot_date?: string; slot_time?: string; coupon?: string; tip?: string; plus_plan?: string }>();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"cash" | "razorpay">("cash");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const addrs = await dataService.listAddresses();
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) setSelectedAddrId(def.id);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const couponCode = (params.coupon as string) || "";
  const tipAmount = Number(params.tip || 0);
  const plusPlanId = (params.plus_plan as string) || "";

  const selectedAddr = useMemo(() => addresses.find((a) => a.id === selectedAddrId) || null, [addresses, selectedAddrId]);

  const formattedDate = useMemo(() => {
    if (!params.slot_date) return "";
    try {
      const d = new Date(params.slot_date as string);
      return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
    } catch { return params.slot_date as string; }
  }, [params.slot_date]);

  const handleConfirm = async () => {
    if (!selectedAddr) {
      notify("Address required", "Please add a service address");
      router.push("/addresses");
      return;
    }
    if (!params.slot_date || !params.slot_time) {
      notify("Slot required", "Please select a time slot");
      router.back();
      return;
    }
    setSubmitting(true);
    try {
      const result = await bookingApi.createBooking({
        items: items.map((it) => ({
          service_id: it.service_id,
          quantity: it.quantity,
          price: it.service_price || 0,
          title: it.service_title,
          image: it.service_image,
        })),
        address: {
          addressLine: selectedAddr.addressLine,
          city: selectedAddr.city,
          landmark: selectedAddr.landmark,
          latitude: selectedAddr.latitude,
          longitude: selectedAddr.longitude,
        },
        slot_date: params.slot_date as string,
        slot_time: params.slot_time as string,
        payment_method: payMethod,
        coupon_code: couponCode || undefined,
        tip_amount: tipAmount,
        plus_plan_id: plusPlanId || undefined,
      });

      const booking = result.booking;

      // Razorpay flow
      if (payMethod === "razorpay") {
        try {
          await runRazorpayCheckout({
            amountInr: result.summary.grand_total,
            description: `Booking ${booking.id?.slice(0, 8) || ""}`,
            customerName: profile?.name,
            customerEmail: profile?.email,
            customerPhone: profile?.phone,
          });
        } catch (payErr: any) {
          notify("Payment incomplete", payErr?.message || "Payment did not complete. Your booking is saved as Pending.");
        }
      }

      await clearCart();
      notify("Booking confirmed!", `Your booking is ${booking.status || "pending"}.`);
      router.replace({ pathname: "/booking/confirmation", params: { id: booking.id } });
    } catch (e: any) {
      notify("Booking failed", e?.message || "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & checkout</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Slot block */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service slot</Text>
          <View style={styles.slotInfoRow}>
            <Calendar size={18} color={PURPLE} />
            <Text style={styles.slotInfoText}>{formattedDate}</Text>
            <Clock size={18} color={PURPLE} />
            <Text style={styles.slotInfoText}>{params.slot_time}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Text style={styles.changeLink}>Change slot</Text>
          </TouchableOpacity>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service address</Text>
          {addresses.length === 0 ? (
            <TouchableOpacity style={styles.addAddrBtn} onPress={() => router.push("/addresses")}>
              <Home size={16} color={PURPLE} />
              <Text style={styles.addAddrText}>Add address</Text>
            </TouchableOpacity>
          ) : (
            addresses.map((a) => {
              const active = a.id === selectedAddrId;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.addrCard, active && styles.addrCardActive]}
                  onPress={() => setSelectedAddrId(a.id)}
                  activeOpacity={0.85}
                >
                  <Home size={18} color={active ? PURPLE : colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addrLabel}>{a.label}</Text>
                    <Text style={styles.addrLine} numberOfLines={2}>{a.addressLine}, {a.city}</Text>
                  </View>
                  {active && <CheckCircle2 size={20} color={PURPLE} />}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment method</Text>
          <TouchableOpacity
            style={[styles.payCard, payMethod === "razorpay" && styles.payCardActive]}
            onPress={() => setPayMethod("razorpay")}
            activeOpacity={0.85}
          >
            <CreditCard size={22} color={payMethod === "razorpay" ? PURPLE : colors.textMain} />
            <View style={{ flex: 1 }}>
              <Text style={styles.payTitle}>Pay online</Text>
              <Text style={styles.paySub}>UPI / Cards / NetBanking via Razorpay</Text>
            </View>
            {payMethod === "razorpay" && <CheckCircle2 size={20} color={PURPLE} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.payCard, payMethod === "cash" && styles.payCardActive]}
            onPress={() => setPayMethod("cash")}
            activeOpacity={0.85}
          >
            <Banknote size={22} color={payMethod === "cash" ? PURPLE : colors.textMain} />
            <View style={{ flex: 1 }}>
              <Text style={styles.payTitle}>Cash after service</Text>
              <Text style={styles.paySub}>Pay the professional after work is done</Text>
            </View>
            {payMethod === "cash" && <CheckCircle2 size={20} color={PURPLE} />}
          </TouchableOpacity>
        </View>

        {/* Items review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({items.length})</Text>
          {items.map((it) => (
            <View key={it.id} style={styles.reviewRow}>
              <Text style={styles.reviewName} numberOfLines={2}>
                {it.service_title}  <Text style={{ color: colors.textMuted }}>× {it.quantity}</Text>
              </Text>
              <Text style={styles.reviewPrice}>₹{(it.service_price || 0) * it.quantity}</Text>
            </View>
          ))}
          {!!couponCode && (
            <View style={styles.reviewRow}>
              <Text style={[styles.reviewName, { color: GREEN }]}>Coupon: {couponCode}</Text>
            </View>
          )}
          {tipAmount > 0 && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewName}>Tip</Text>
              <Text style={styles.reviewPrice}>₹{tipAmount}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{Math.round(total + tipAmount)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>Confirm booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  iconBtn: { padding: 4, width: 32 },
  headerTitle: { flex: 1, marginLeft: 8, fontSize: 18, fontWeight: "800", color: colors.textMain },

  body: { flex: 1 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.textMain, marginBottom: 12 },

  slotInfoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  slotInfoText: { fontSize: 14, color: colors.textMain, fontWeight: "600", marginRight: 8 },
  changeLink: { color: PURPLE, fontWeight: "700", fontSize: 13 },

  addrCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 12, marginBottom: 8,
  },
  addrCardActive: { borderColor: PURPLE, borderWidth: 2, backgroundColor: PURPLE_LIGHT },
  addrLabel: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  addrLine: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  addAddrBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", borderRadius: 12, justifyContent: "center" },
  addAddrText: { color: PURPLE, fontWeight: "700" },

  payCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 14, marginBottom: 10,
  },
  payCardActive: { borderColor: PURPLE, borderWidth: 2, backgroundColor: PURPLE_LIGHT },
  payTitle: { fontSize: 15, fontWeight: "700", color: colors.textMain },
  paySub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  reviewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  reviewName: { flex: 1, fontSize: 14, color: colors.textBody, marginRight: 10 },
  reviewPrice: { fontSize: 14, fontWeight: "700", color: colors.textMain },

  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    flexDirection: "row", alignItems: "center", gap: 16,
    padding: 14, backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: colors.border,
    ...shadow.bottomNav,
  },
  totalLabel: { fontSize: 12, color: colors.textMuted },
  totalAmount: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  confirmBtn: { flex: 1, backgroundColor: PURPLE, paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
