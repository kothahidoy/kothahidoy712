import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
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
  Check,
  ChevronRight,
  Filter,
  MapPin,
  User,
  UserCheck,
  X,
} from "lucide-react-native";

import { adminService } from "@/src/data/admin";
import { providerService } from "@/src/data/providerService";
import { dataService } from "@/src/data/service";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { colors, radius, shadow } from "@/src/theme";
import { Booking, BookingStatus, Provider, Service } from "@/src/types";
import { confirmAsync, notify } from "@/src/utils/dialogs";

const STATUSES: { id: BookingStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const STATUS_TINTS: Record<BookingStatus, { bg: string; fg: string }> = {
  pending: { bg: colors.warningLight, fg: "#B45309" },
  confirmed: { bg: colors.primaryLight, fg: colors.primary },
  assigned: { bg: "#E0E7FF", fg: "#4F46E5" },
  in_progress: { bg: colors.successLight, fg: colors.success },
  completed: { bg: colors.successLight, fg: colors.success },
  cancelled: { bg: colors.errorLight, fg: colors.error },
};

export default function AdminBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  
  // Provider assignment modal state
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Initialize demo data if user is not authenticated (demo mode)
  // This ensures demo providers exist even when Supabase is configured
  // but the user hasn't logged in
  useEffect(() => {
    const initDemoDataIfNeeded = async () => {
      // Always initialize demo providers for unauthenticated users
      // Even if Supabase is configured, anonymous users need local demo data
      let hasAuthSession = false;
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getUser();
        hasAuthSession = !!data.user;
      }
      
      // If no auth session, initialize demo data
      if (!hasAuthSession) {
        await providerService.initDemoProviders();
      }
    };
    initDemoDataIfNeeded();
  }, []);

  const load = useCallback(async () => {
    const [bookingsList, servicesList] = await Promise.all([
      adminService.listAllBookings(),
      dataService.getServices(),
    ]);
    setBookings(bookingsList);
    setServices(servicesList);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = filter === "all"
    ? bookings
    : bookings.filter((b) => b.status === filter);

  // Get category ID for a booking (service -> category)
  const getCategoryForBooking = (booking: Booking): string | null => {
    const service = services.find((s) => s.id === booking.serviceId);
    return service?.categoryId ?? null;
  };

  // Open provider assignment modal
  const openAssignModal = async (booking: Booking) => {
    // Only allow assignment if not already assigned
    if (booking.providerId) {
      notify("Already Assigned", "This booking already has a provider assigned.");
      return;
    }
    
    // Only allow assignment for confirmed or pending bookings
    if (!["pending", "confirmed"].includes(booking.status)) {
      notify("Cannot Assign", "Only pending or confirmed bookings can be assigned.");
      return;
    }

    setSelectedBooking(booking);
    setAssignModalVisible(true);
    setLoadingProviders(true);

    try {
      const categoryId = getCategoryForBooking(booking);
      if (categoryId) {
        const providers = await providerService.getAvailableProvidersFor(categoryId);
        setAvailableProviders(providers);
      } else {
        setAvailableProviders([]);
      }
    } catch (e) {
      console.warn("Failed to load providers", e);
      setAvailableProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Assign provider to booking
  const handleAssignProvider = async (provider: Provider) => {
    if (!selectedBooking) return;

    const confirmed = await confirmAsync(
      "Assign Provider?",
      `Assign ${provider.name} to this booking?\n\nThis will mark the booking as "Assigned" and the provider will be notified.`,
      "Assign",
      "Cancel"
    );
    if (!confirmed) return;

    setAssigning(true);
    try {
      const result = await providerService.assignProvider(
        selectedBooking.id,
        provider.id
      );
      if (result.success) {
        notify("Provider Assigned! ✅", `${provider.name} has been assigned to this booking.`);
        setAssignModalVisible(false);
        setSelectedBooking(null);
        load(); // Refresh bookings
      } else {
        notify("Assignment Failed", result.error ?? "Could not assign provider. Please try again.");
      }
    } catch (e) {
      notify("Error", "Something went wrong. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const advance = async (b: Booking) => {
    const next: Record<BookingStatus, BookingStatus> = {
      pending: "confirmed",
      confirmed: "assigned", // Changed: confirmed -> assigned (need to assign provider)
      assigned: "in_progress",
      in_progress: "completed",
      completed: "completed",
      cancelled: "cancelled",
    };
    const nextStatus = next[b.status];
    if (nextStatus === b.status) {
      notify("Already final", "This booking is in a final state.");
      return;
    }
    
    // If moving from confirmed, require provider assignment first
    if (b.status === "confirmed" && !b.providerId) {
      openAssignModal(b);
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
            const canAssign = ["pending", "confirmed"].includes(item.status) && !item.providerId;
            
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => advance(item)}
                activeOpacity={0.85}
                testID={`ab-card-${item.id}`}
              >
                <Image source={{ uri: item.serviceImage }} style={styles.img} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusPill, { backgroundColor: tint.bg }]}>
                      <Text style={[styles.statusText, { color: tint.fg }]}>
                        {item.status.replace("_", " ")}
                      </Text>
                    </View>
                    {item.providerId && (
                      <View style={styles.providerBadge}>
                        <UserCheck size={10} color={colors.success} />
                        <Text style={styles.providerBadgeText} numberOfLines={1}>
                          {item.providerName ?? "Assigned"}
                        </Text>
                      </View>
                    )}
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
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.price}</Text>
                    {canAssign && (
                      <TouchableOpacity
                        style={styles.assignBtn}
                        onPress={() => openAssignModal(item)}
                        hitSlop={8}
                      >
                        <User size={12} color="#FFFFFF" />
                        <Text style={styles.assignBtnText}>Assign</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Provider Assignment Modal */}
      <Modal
        visible={assignModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Provider</Text>
              <TouchableOpacity
                onPress={() => setAssignModalVisible(false)}
                hitSlop={12}
                style={styles.modalClose}
              >
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <View style={styles.modalBookingInfo}>
                <Text style={styles.modalBookingTitle}>{selectedBooking.serviceTitle}</Text>
                <Text style={styles.modalBookingMeta}>
                  {new Date(selectedBooking.scheduledDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })} · {selectedBooking.timeSlot}
                </Text>
              </View>
            )}

            <Text style={styles.modalSubtitle}>Available Providers</Text>

            {loadingProviders ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.modalLoadingText}>Loading providers...</Text>
              </View>
            ) : availableProviders.length === 0 ? (
              <View style={styles.modalEmpty}>
                <User size={32} color={colors.textMuted} />
                <Text style={styles.modalEmptyText}>No available providers for this service category</Text>
              </View>
            ) : (
              <ScrollView style={styles.providerList}>
                {availableProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    style={styles.providerCard}
                    onPress={() => handleAssignProvider(provider)}
                    disabled={assigning}
                    activeOpacity={0.85}
                  >
                    <View style={styles.providerAvatar}>
                      <User size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.providerName}>
                        {provider.name} ({providerService.getCategoryName(provider.serviceType)})
                      </Text>
                      <Text style={styles.providerStatus}>
                        {provider.isAvailable ? "✓ Available" : "On Job"}
                      </Text>
                    </View>
                    {assigning ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={styles.providerSelectBtn}>
                        <Check size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "capitalize" },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  providerBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.success,
    maxWidth: 70,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 11, color: colors.textMuted, flex: 1 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  price: { fontSize: 15, fontWeight: "800", color: colors.primary },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  assignBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textMain,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBookingInfo: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  modalBookingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  modalBookingMeta: {
    fontSize: 12,
    color: colors.primary,
    opacity: 0.8,
    marginTop: 2,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalLoading: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modalEmpty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  modalEmptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  providerList: {
    maxHeight: 300,
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  providerName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMain,
  },
  providerStatus: {
    fontSize: 11,
    color: colors.success,
    fontWeight: "600",
    marginTop: 2,
  },
  providerSelectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
