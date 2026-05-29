import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react-native";

import { dataService } from "@/src/data/service";
import { colors, radius, shadow } from "@/src/theme";
import { Booking, BookingStatus } from "@/src/types";

type Filter = "active" | "completed" | "cancelled";

const TABS: { id: Filter; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const matches = (b: Booking, f: Filter) => {
  if (f === "active")
    return ["pending", "confirmed", "in_progress"].includes(b.status);
  return b.status === f;
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "On the way",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<BookingStatus, { bg: string; fg: string }> = {
  pending: { bg: colors.warningLight, fg: "#B45309" },
  confirmed: { bg: colors.primaryLight, fg: colors.primary },
  in_progress: { bg: colors.successLight, fg: colors.success },
  completed: { bg: colors.successLight, fg: colors.success },
  cancelled: { bg: colors.errorLight, fg: colors.error },
};

export default function BookingsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("active");
  const [bookings, setBookings] = useState<Booking[]>([]);

  useFocusEffect(
    useCallback(() => {
      dataService.listBookings().then(setBookings);
    }, []),
  );

  const filtered = bookings.filter((b) => matches(b, filter));

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My bookings</Text>
        <Text style={styles.subtitle}>Track every service you booked</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, filter === t.id && styles.tabActive]}
            activeOpacity={0.85}
            onPress={() => setFilter(t.id)}
            testID={`bookings-tab-${t.id}`}
          >
            <Text
              style={[
                styles.tabText,
                filter === t.id && styles.tabTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty} testID="bookings-empty">
          <View style={styles.emptyIcon}>
            <Calendar size={32} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>No {filter} bookings</Text>
          <Text style={styles.emptySub}>
            {filter === "active"
              ? "Book your first service from the home tab."
              : "Your past bookings will show here."}
          </Text>
          <TouchableOpacity
            style={styles.emptyCTA}
            onPress={() => router.push("/(tabs)")}
            testID="bookings-empty-cta"
          >
            <Text style={styles.emptyCTAText}>Explore services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => router.push(`/booking/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function BookingCard({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress: () => void;
}) {
  const sc = STATUS_COLORS[booking.status];
  const date = new Date(booking.scheduledDate);
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
      testID={`booking-card-${booking.id}`}
    >
      <Image source={{ uri: booking.serviceImage }} style={styles.cardImg} />
      <View style={styles.cardBody}>
        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
          {booking.status === "completed" ? (
            <CheckCircle2 size={11} color={sc.fg} strokeWidth={2.5} />
          ) : booking.status === "cancelled" ? (
            <XCircle size={11} color={sc.fg} strokeWidth={2.5} />
          ) : (
            <Clock size={11} color={sc.fg} strokeWidth={2.5} />
          )}
          <Text style={[styles.statusText, { color: sc.fg }]}>
            {STATUS_LABELS[booking.status]}
          </Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {booking.serviceTitle}
        </Text>
        <View style={styles.metaRow}>
          <Calendar size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {date.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}{" "}
            · {booking.timeSlot}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MapPin size={12} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {booking.address.label} · {booking.address.city}
          </Text>
        </View>
        <Text style={styles.price}>₹{booking.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  tabTextActive: { color: "#FFFFFF" },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardImg: { width: 84, height: 84, borderRadius: 12 },
  cardBody: { flex: 1, gap: 4 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 10, fontWeight: "800" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.textMain },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: colors.textMuted, flex: 1 },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 2,
  },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMain,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCTA: {
    marginTop: 22,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  emptyCTAText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
