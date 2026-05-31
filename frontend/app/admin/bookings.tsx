import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Filter,
  MapPin,
} from "lucide-react-native";

import { adminService } from "@/src/data/admin";
import { colors, radius, shadow } from "@/src/theme";
import { Booking, BookingStatus } from "@/src/types";
import { notify } from "@/src/utils/dialogs";

const STATUSES: { id: BookingStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "in_progress", label: "On the way" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const STATUS_TINTS: Record<BookingStatus, { bg: string; fg: string }> = {
  pending: { bg: colors.warningLight, fg: "#B45309" },
  confirmed: { bg: colors.primaryLight, fg: colors.primary },
  in_progress: { bg: colors.successLight, fg: colors.success },
  completed: { bg: colors.successLight, fg: colors.success },
  cancelled: { bg: colors.errorLight, fg: colors.error },
};

export default function AdminBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");

  const load = useCallback(async () => {
    setBookings(await adminService.listAllBookings());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = filter === "all"
    ? bookings
    : bookings.filter((b) => b.status === filter);

  const advance = async (b: Booking) => {
    const next: Record<BookingStatus, BookingStatus> = {
      pending: "confirmed",
      confirmed: "in_progress",
      in_progress: "completed",
      completed: "completed",
      cancelled: "cancelled",
    };
    const nextStatus = next[b.status];
    if (nextStatus === b.status) {
      notify("Already final", "This booking is in a final state.");
      return;
    }
    await adminService.updateBookingStatus(b.id, nextStatus);
    notify("Status updated", `Booking moved to ${nextStatus.replace("_", " ")}`);
    load();
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          testID="ab-back-btn"
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.crumb}>Admin</Text>
          <Text style={styles.title}>All bookings · {bookings.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => setFilter(s.id)}
            style={[styles.chip, filter === s.id && styles.chipActive]}
            activeOpacity={0.85}
            testID={`ab-filter-${s.id}`}
          >
            <Text
              style={[styles.chipText, filter === s.id && styles.chipTextActive]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Filter size={32} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>No bookings</Text>
          <Text style={styles.emptySub}>
            No bookings matching this filter yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const tint = STATUS_TINTS[item.status];
            const date = new Date(item.scheduledDate);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => advance(item)}
                activeOpacity={0.85}
                testID={`ab-card-${item.id}`}
              >
                <Image source={{ uri: item.serviceImage }} style={styles.img} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={[styles.statusPill, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.statusText, { color: tint.fg }]}>
                      {item.status.replace("_", " ")}
                    </Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.serviceTitle}
                  </Text>
                  <View style={styles.row}>
                    <Calendar size={11} color={colors.textMuted} />
                    <Text style={styles.meta}>
                      {date.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {item.timeSlot}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <MapPin size={11} color={colors.textMuted} />
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.address.city}
                    </Text>
                  </View>
                  <Text style={styles.price}>₹{item.price}</Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
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
  crumb: { fontSize: 11, color: colors.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  filters: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: "#FFFFFF" },
  list: { paddingHorizontal: 20, paddingBottom: 30, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  img: { width: 70, height: 70, borderRadius: 10 },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "capitalize" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 11, color: colors.textMuted, flex: 1 },
  price: { fontSize: 15, fontWeight: "800", color: colors.primary, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.textMain },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: "center" },
});
