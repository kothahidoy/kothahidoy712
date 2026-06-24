import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft, Minus, Plus, ShoppingCart, Home, Pencil, Phone,
  Percent, Tag, ChevronRight, X, Check, Sparkles,
} from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { useCart } from "@/src/context/CartContext";
import { useSession } from "@/src/context/SessionContext";
import { bookingApi, PlusPlan, Coupon, RecommendItem } from "@/src/data/bookingFlow";
import { notify } from "@/src/utils/dialogs";

const PURPLE = "#6E3DF5";
const PURPLE_LIGHT = "#EFE9FE";
const GREEN = "#16A34A";
const GREEN_LIGHT = "#D1FAE5";

export default function CartScreen() {
  const router = useRouter();
  const { items, total, updateQuantity, removeFromCart, addToCart } = useCart();
  const { profile, isAuthenticated } = useSession();

  const [plusPlans, setPlusPlans] = useState<PlusPlan[]>([]);
  const [plusActive, setPlusActive] = useState(false);
  const [selectedPlusPlanId, setSelectedPlusPlanId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [recommendations, setRecommendations] = useState<RecommendItem[]>([]);
  const [tip, setTip] = useState(0);
  const [coupModalOpen, setCoupModalOpen] = useState(false);
  const [customTipOpen, setCustomTipOpen] = useState(false);
  const [customTipInput, setCustomTipInput] = useState("");

  // Load data
  useEffect(() => {
    (async () => {
      const [plans, statusObj, coupList, recs] = await Promise.all([
        bookingApi.getPlusPlans(),
        bookingApi.getPlusStatus(),
        bookingApi.getCoupons(total),
        bookingApi.getRecommendations(items.map((i) => i.service_id), undefined, 8),
      ]);
      setPlusPlans(plans);
      setPlusActive(!!statusObj.active);
      setCoupons(coupList);
      setRecommendations(recs);
    })();
  }, [total, items.length]);

  // Calculate amounts
  const itemTotal = total;
  const selectedPlan = useMemo(
    () => plusPlans.find((p) => p.id === selectedPlusPlanId) || null,
    [plusPlans, selectedPlusPlanId]
  );
  const plusBenefit = useMemo(() => {
    if (!plusActive && !selectedPlan) return 0;
    const pct = (selectedPlan?.duration_months || 6) >= 12 ? 15 : 10;
    return Math.min(itemTotal * (pct / 100), 100);
  }, [plusActive, selectedPlan, itemTotal]);
  const couponSaving = appliedDiscount;
  const taxes = Math.round((itemTotal - couponSaving - plusBenefit) * 0.08 * 100) / 100;
  const plusPrice = selectedPlan?.price || 0;
  const total_amount = Math.max(0, itemTotal - couponSaving - plusBenefit + taxes);
  const amount_to_pay = total_amount + tip + plusPrice;
  const totalSavings = (items.reduce((s, it) => s + (it.service_price || 0) * it.quantity, 0) * 0.1)
    + couponSaving + plusBenefit;

  // Group items by category (using service_title prefix as fallback "group")
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    items.forEach((it) => {
      const grp = "Services";
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(it);
    });
    return groups;
  }, [items]);

  const handleApplyCoupon = async (code: string) => {
    try {
      const r = await bookingApi.applyCoupon(code, itemTotal);
      setAppliedCoupon(r.coupon);
      setAppliedDiscount(r.discount);
      setCoupModalOpen(false);
      notify("Coupon applied", `You saved ₹${r.discount}`);
    } catch (e: any) {
      notify("Couldn't apply", e?.message || "Invalid coupon");
    }
  };

  const handleProceedToSlot = () => {
    if (!isAuthenticated) {
      notify("Sign in required", "Please sign in to continue");
      router.push("/welcome");
      return;
    }
    if (items.length === 0) {
      notify("Empty cart", "Add services to your cart first");
      return;
    }
    router.push({
      pathname: "/booking/slot",
      params: {
        coupon: appliedCoupon?.code || "",
        tip: String(tip),
        plus_plan: selectedPlusPlanId || "",
      },
    });
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <ArrowLeft size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your cart</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingCart size={56} color={colors.textSubtle} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyDesc}>Browse services & add to cart to get started</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push("/")} activeOpacity={0.9}>
            <Text style={styles.exploreBtnText}>Explore services</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your cart</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 180 }}>
        {/* Savings banner */}
        {totalSavings > 0 && (
          <View style={styles.savingsBanner}>
            <Tag size={18} color={GREEN} />
            <Text style={styles.savingsText}>
              Saving ₹{Math.round(totalSavings)} on this order
            </Text>
          </View>
        )}

        {/* Items group */}
        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <View key={groupName} style={styles.section}>
            <Text style={styles.groupTitle}>{groupName}</Text>
            {groupItems.map((it) => (
              <View key={it.id} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{it.service_title || "Service"}</Text>
                </View>
                <View style={styles.qtyBox}>
                  <TouchableOpacity onPress={() => updateQuantity(it.id, Math.max(0, it.quantity - 1))} hitSlop={6}>
                    <Minus size={16} color={PURPLE} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{it.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(it.id, it.quantity + 1)} hitSlop={6}>
                    <Plus size={16} color={PURPLE} />
                  </TouchableOpacity>
                </View>
                <View style={{ alignItems: "flex-end", minWidth: 70 }}>
                  <Text style={styles.itemPrice}>₹{(it.service_price || 0) * it.quantity}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push("/")} activeOpacity={0.7}>
              <Plus size={16} color={PURPLE} />
              <Text style={styles.addMoreText}>Add more items</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Plus membership */}
        {plusPlans.length > 0 && !plusActive && (
          <View style={styles.plusCard}>
            <View style={styles.plusHeader}>
              <View style={[styles.plusIconBubble]}><Sparkles size={14} color="#fff" /></View>
              <Text style={styles.plusBrand}>plus</Text>
            </View>
            {(() => {
              const featured = plusPlans.find((p) => p.duration_months === 6) || plusPlans[0];
              const isAdded = selectedPlusPlanId === featured.id;
              return (
                <View>
                  <View style={styles.plusRow}>
                    <Text style={styles.plusTitle}>{featured.name}</Text>
                    <TouchableOpacity
                      style={[styles.plusAddBtn, isAdded && styles.plusAddedBtn]}
                      onPress={() => setSelectedPlusPlanId(isAdded ? null : featured.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.plusAddText, isAdded && styles.plusAddedText]}>
                        {isAdded ? "Added" : "Add"}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ alignItems: "flex-end", marginLeft: 10 }}>
                      <Text style={styles.plusPrice}>₹{featured.price}</Text>
                      {featured.original_price && (
                        <Text style={styles.plusOriginal}>₹{featured.original_price}</Text>
                      )}
                    </View>
                  </View>
                  {featured.benefits.slice(0, 1).map((b, i) => (
                    <View key={i} style={styles.plusBenefit}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.plusBenefitText}>{b}</Text>
                    </View>
                  ))}
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.plusViewAll}>View all benefits</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        )}
        {plusActive && (
          <View style={[styles.plusCard, { backgroundColor: GREEN_LIGHT }]}>
            <View style={styles.plusHeader}>
              <View style={[styles.plusIconBubble, { backgroundColor: GREEN }]}><Check size={14} color="#fff" /></View>
              <Text style={[styles.plusBrand, { color: GREEN }]}>plus</Text>
            </View>
            <Text style={styles.plusActiveText}>You&apos;re a Plus member • Enjoy your benefits</Text>
          </View>
        )}

        {/* People also take */}
        {recommendations.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <Text style={[styles.groupTitle, { paddingHorizontal: 16 }]}>People also take</Text>
            <FlatList
              data={recommendations}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(x) => x.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => (
                <View style={styles.recCard}>
                  <Image
                    source={{ uri: item.image || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400" }}
                    style={styles.recImg}
                  />
                  <Text style={styles.recTitle} numberOfLines={2}>{item.title}</Text>
                  {!!item.rating && (
                    <Text style={styles.recRating}>★ {item.rating?.toFixed(2)} ({(item.review_count || 0)})</Text>
                  )}
                  <View style={styles.recBottom}>
                    <View>
                      <Text style={styles.recStartsAt}>Starts at</Text>
                      <Text style={styles.recPrice}>₹{item.starting_price}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.recAddBtn}
                      activeOpacity={0.8}
                      onPress={async () => {
                        const ok = await addToCart(item.id, 1);
                        if (ok) notify("Added", "Service added to cart");
                      }}
                    >
                      <Text style={styles.recAddText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* Coupons */}
        <TouchableOpacity
          style={styles.couponRow}
          activeOpacity={0.7}
          onPress={() => setCoupModalOpen(true)}
        >
          <View style={styles.couponLeftIcon}><Percent size={16} color="#fff" /></View>
          <Text style={styles.couponLabel}>
            {appliedCoupon ? `${appliedCoupon.code} applied` : "Coupons and offers"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.couponViewAll}>View all</Text>
            <ChevronRight size={18} color={PURPLE} />
          </View>
        </TouchableOpacity>

        {/* Phone */}
        {profile?.phone && (
          <View style={styles.phoneRow}>
            <Phone size={18} color={colors.textMain} />
            <Text style={styles.phoneText}>
              {profile.name?.split(" ")[0] || "User"}, {profile.phone}
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/profile")}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment summary</Text>
          <Row label="Item total" right={(
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={styles.strikethrough}>₹{Math.round(itemTotal * 1.12)}</Text>
              <Text style={styles.rowValue}>₹{Math.round(itemTotal)}</Text>
            </View>
          )} />
          {couponSaving > 0 && <Row label="Coupon discount" value={`-₹${Math.round(couponSaving)}`} valueColor={GREEN} />}
          {plusBenefit > 0 && <Row label="Plus savings" value={`-₹${Math.round(plusBenefit)}`} valueColor={GREEN} />}
          <Row label="Taxes and Fee" value={`₹${Math.round(taxes)}`} />
          <View style={styles.summaryDivider} />
          <Row label="Total amount" value={`₹${Math.round(total_amount)}`} bold />
          {plusPrice > 0 && <Row label={`Plus (${selectedPlan?.name})`} value={`₹${plusPrice}`} />}
          {tip > 0 && <Row label="Tip" value={`₹${tip}`} />}
          <Row label="Amount to pay" value={`₹${Math.round(amount_to_pay)}`} bold large />
        </View>

        {/* Tip */}
        <View style={styles.tipSection}>
          <Text style={styles.summaryTitle}>Add a tip to thank the Professional</Text>
          <View style={styles.tipRow}>
            {[50, 75, 100].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tipPill, tip === t && styles.tipPillActive]}
                onPress={() => setTip(tip === t ? 0 : t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipPillText, tip === t && styles.tipPillTextActive]}>₹ {t}</Text>
                {t === 75 && <Text style={styles.popularBadge}>POPULAR</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.tipPill, ![0, 50, 75, 100].includes(tip) && styles.tipPillActive]}
              onPress={() => { setCustomTipInput(String(tip || "")); setCustomTipOpen(true); }}
              activeOpacity={0.8}
            >
              <Text style={styles.tipPillText}>{![0, 50, 75, 100].includes(tip) ? `₹ ${tip}` : "Custom"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.tipHint}>100% of the tip goes to the professional.</Text>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.policyCard}>
          <Text style={styles.summaryTitle}>Cancellation policy</Text>
          <Text style={styles.policyText}>
            Free cancellations if done more than 12 hrs before the service. A fee will be charged otherwise.
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.policyLink}>Read full policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky address + CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.addressRow}>
          <Home size={18} color={colors.textMain} />
          <Text style={styles.addressText} numberOfLines={1}>
            Home — Add your address to continue
          </Text>
          <Pencil size={16} color={colors.textMuted} />
        </View>
        <TouchableOpacity style={styles.selectSlotBtn} onPress={handleProceedToSlot} activeOpacity={0.9}>
          <Text style={styles.selectSlotText}>Select slot</Text>
        </TouchableOpacity>
      </View>

      {/* Coupons Modal */}
      <Modal visible={coupModalOpen} animationType="slide" transparent onRequestClose={() => setCoupModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Coupons & Offers</Text>
              <TouchableOpacity onPress={() => setCoupModalOpen(false)} hitSlop={8}><X size={22} color={colors.textMain} /></TouchableOpacity>
            </View>
            <FlatList
              data={coupons}
              keyExtractor={(x) => x.id}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              renderItem={({ item }) => (
                <View style={[styles.coupItem, !item.applicable && { opacity: 0.55 }]}>
                  <View style={styles.coupBadge}><Text style={styles.coupCode}>{item.code}</Text></View>
                  <Text style={styles.coupItemTitle}>{item.title}</Text>
                  {!!item.description && <Text style={styles.coupItemDesc}>{item.description}</Text>}
                  {item.applicable ? (
                    <TouchableOpacity style={styles.coupApplyBtn} onPress={() => handleApplyCoupon(item.code)} activeOpacity={0.85}>
                      <Text style={styles.coupApplyText}>Apply • Save ₹{Math.round(item.discount || 0)}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.coupNa}>
                      Min ₹{item.min_cart_value} cart required
                    </Text>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ color: colors.textMuted, textAlign: "center", paddingVertical: 30 }}>
                  No coupons available right now
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Custom tip modal */}
      <Modal visible={customTipOpen} animationType="fade" transparent onRequestClose={() => setCustomTipOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.tipModal}>
            <Text style={styles.modalTitle}>Custom tip</Text>
            <TextInput
              value={customTipInput}
              onChangeText={setCustomTipInput}
              keyboardType="number-pad"
              placeholder="Enter amount"
              style={styles.tipInput}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#F1F5F9" }]} onPress={() => setCustomTipOpen(false)}>
                <Text style={{ color: colors.textMain, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: PURPLE }]}
                onPress={() => { setTip(Number(customTipInput) || 0); setCustomTipOpen(false); }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({
  label, value, right, bold, large, valueColor,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  bold?: boolean;
  large?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={summaryStyles.row}>
      <Text style={[summaryStyles.label, bold && summaryStyles.boldLabel, large && summaryStyles.largeLabel]}>{label}</Text>
      {right ? right : (
        <Text style={[summaryStyles.value, bold && summaryStyles.boldValue, large && summaryStyles.largeValue, valueColor ? { color: valueColor } : null]}>
          {value}
        </Text>
      )}
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  label: { fontSize: 14, color: colors.textBody },
  value: { fontSize: 14, color: colors.textMain, fontWeight: "500" },
  boldLabel: { fontWeight: "700", color: colors.textMain },
  boldValue: { fontWeight: "700" },
  largeLabel: { fontSize: 15 },
  largeValue: { fontSize: 15 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  iconBtn: { padding: 4, width: 32 },
  headerTitle: { flex: 1, marginLeft: 8, fontSize: 22, fontWeight: "800", color: colors.textMain },

  body: { flex: 1 },

  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.textMain, marginTop: 8 },
  emptyDesc: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  exploreBtn: { marginTop: 14, backgroundColor: PURPLE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  savingsBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  savingsText: { fontSize: 15, fontWeight: "700", color: colors.textMain },

  section: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  groupTitle: { fontSize: 18, fontWeight: "800", color: colors.textMain, marginBottom: 12 },

  cartRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  itemTitle: { fontSize: 14, color: colors.textMain, fontWeight: "500" },
  qtyBox: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: PURPLE,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: PURPLE_LIGHT,
  },
  qtyText: { fontSize: 14, fontWeight: "700", color: PURPLE, minWidth: 16, textAlign: "center" },
  itemPrice: { fontSize: 15, fontWeight: "700", color: colors.textMain },

  addMoreBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12 },
  addMoreText: { color: PURPLE, fontWeight: "700", fontSize: 14 },

  plusCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 14, padding: 14,
  },
  plusHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  plusIconBubble: { width: 22, height: 22, borderRadius: 6, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center" },
  plusBrand: { fontSize: 17, fontWeight: "800", color: PURPLE, letterSpacing: 0.5 },

  plusRow: { flexDirection: "row", alignItems: "center" },
  plusTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.textMain },
  plusAddBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: PURPLE },
  plusAddText: { color: PURPLE, fontWeight: "700", fontSize: 13 },
  plusAddedBtn: { backgroundColor: PURPLE, borderColor: PURPLE },
  plusAddedText: { color: "#fff" },
  plusPrice: { fontSize: 16, fontWeight: "800", color: colors.textMain },
  plusOriginal: { fontSize: 12, color: colors.textMuted, textDecorationLine: "line-through" },

  plusBenefit: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 10 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.textBody, marginTop: 8 },
  plusBenefitText: { flex: 1, fontSize: 13, color: colors.textBody, lineHeight: 18 },
  plusViewAll: { marginTop: 10, color: colors.textMain, fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
  plusActiveText: { color: colors.textMain, fontWeight: "600", fontSize: 14 },

  recCard: {
    width: 150,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 8,
  },
  recImg: { width: "100%", height: 110, borderRadius: 10, marginBottom: 8, backgroundColor: "#F1F5F9" },
  recTitle: { fontSize: 13, fontWeight: "600", color: colors.textMain, minHeight: 36 },
  recRating: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  recBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  recStartsAt: { fontSize: 10, color: colors.textMuted },
  recPrice: { fontSize: 13, fontWeight: "700", color: colors.textMain },
  recAddBtn: { borderWidth: 1, borderColor: PURPLE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  recAddText: { color: PURPLE, fontWeight: "700", fontSize: 12 },

  couponRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  couponLeftIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
  couponLabel: { flex: 1, fontSize: 15, color: colors.textMain, fontWeight: "600" },
  couponViewAll: { color: PURPLE, fontSize: 14, fontWeight: "600", marginRight: 4 },

  phoneRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  phoneText: { flex: 1, fontSize: 14, color: colors.textMain, fontWeight: "500" },
  changeLink: { color: PURPLE, fontWeight: "700", fontSize: 14 },

  summaryCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: colors.textMain, marginBottom: 10 },
  strikethrough: { fontSize: 13, color: colors.textMuted, textDecorationLine: "line-through" },
  rowValue: { fontSize: 14, color: colors.textMain, fontWeight: "600" },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },

  tipSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  tipRow: { flexDirection: "row", gap: 10, marginVertical: 10, flexWrap: "wrap" },
  tipPill: { flex: 1, minWidth: 70, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center", position: "relative" },
  tipPillActive: { borderColor: PURPLE, borderWidth: 2, backgroundColor: PURPLE_LIGHT },
  tipPillText: { fontSize: 15, fontWeight: "700", color: colors.textMain },
  tipPillTextActive: { color: PURPLE },
  popularBadge: { position: "absolute", bottom: -10, backgroundColor: GREEN_LIGHT, color: GREEN, fontSize: 9, fontWeight: "800", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  tipHint: { fontSize: 12, color: colors.textMuted, marginTop: 8 },

  policyCard: { padding: 16 },
  policyText: { fontSize: 13, color: colors.textBody, lineHeight: 19 },
  policyLink: { color: colors.textMain, fontSize: 13, fontWeight: "700", textDecorationLine: "underline", marginTop: 8 },

  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: 8,
    ...shadow.bottomNav,
  },
  addressRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  addressText: { flex: 1, fontSize: 13, color: colors.textBody },
  selectSlotBtn: { backgroundColor: PURPLE, margin: 12, paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  selectSlotText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.textMain },

  coupItem: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, backgroundColor: "#fff" },
  coupBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, backgroundColor: GREEN_LIGHT, borderRadius: 6, marginBottom: 8, borderStyle: "dashed", borderWidth: 1, borderColor: GREEN },
  coupCode: { color: GREEN, fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
  coupItemTitle: { fontSize: 15, fontWeight: "700", color: colors.textMain },
  coupItemDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  coupApplyBtn: { marginTop: 10, backgroundColor: PURPLE, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  coupApplyText: { color: "#fff", fontWeight: "700" },
  coupNa: { marginTop: 8, color: colors.textMuted, fontSize: 12 },

  tipModal: { backgroundColor: "#fff", margin: 30, padding: 18, borderRadius: 16 },
  tipInput: { marginTop: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
});
