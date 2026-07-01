import React, { useCallback, useState, useEffect } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Calendar,
  ChevronRight,
  Clock,
  LogOut,
  MapPin,
  Briefcase,
} from "lucide-react-native";

import { providerService } from "@/src/data/providerService";
import { colors, radius, shadow } from "@/src/theme";
import { Booking, BookingStatus, Provider } from "@/src/types";
import { confirmAsync, notify } from "@/src/utils/dialogs";
import { useNotifications } from "@/src/hooks/useNotifications";
import { NotificationBell } from "@/src/components/NotificationBell";
import { BellRing } from "lucide-react-native";

const STATUS_TINTS: Record<string, { bg: string; fg: string; label: string }> = {
  assigned: { bg: colors.primaryLight, fg: colors.primary, label: "Assigned" },
  in_progress: { bg: colors.warningLight, fg: "#B45309", label: "In Progress" },
};

export default function ProviderJobs() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Provider notifications — bell rings until they hit "Ready to accept".
  const notif = useNotifications({
    targetType: "provider",
    targetId: provider?.id,
    loopBell: true,
  });

  const loadData = useCallback(async () => {
    try {
      const currentProvider = await providerService.getCurrentProvider();
      if (!currentProvider) {
        router.replace("/(provider)/login");
        return;
      }
      setProvider(currentProvider);
      const providerJobs = await providerService.listJobs(currentProvider.id);
      setJobs(providerJobs);
    } catch (e) {
      console.warn("Failed to load jobs", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Refresh job list whenever a new provider notification arrives.
  const notifLen = notif.list.length;
  useEffect(() => {
    if (notifLen > 0) loadData();
  }, [notifLen, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    const confirmed = await confirmAsync(
      "Logout?",
      "Are you sure you want to logout from the provider portal?",
      "Logout",
      "Cancel"
    );
    if (confirmed) {
      await providerService.logout();
      router.replace("/(provider)/login");
    }
  };

  const categoryName = provider
    ? providerService.getCategoryName(provider.serviceType)
    : "";

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{provider?.name ?? "Provider"}</Text>
          <View style={styles.categoryPill}>
            <Briefcase size={12} color={colors.primary} />
            <Text style={styles.categoryText}>{categoryName}</Text>
            <View
              style={[
                styles.availabilityDot,
                {
                  backgroundColor: provider?.isAvailable
                    ? colors.success
                    : colors.warning,
                },
              ]}
            />
            <Text style={styles.availabilityText}>
              {provider?.isAvailable ? "Available" : "On Job"}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <NotificationBell
            list={notif.list}
            unseen={notif.unseen}
            ringing={notif.ringing}
            onMarkSeen={notif.markSeen}
            onMarkAllSeen={notif.markAllSeen}
            onStopRing={notif.stopRing}
            color="#111"
            title="Your alerts"
          />
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            hitSlop={12}
            testID="provider-logout-btn"
          >
            <LogOut size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ringing "Ready to accept" banner — appears whenever bell is looping */}
      {notif.ringing ? (
        <View style={styles.ringBar}>
          <BellRing size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.ringTitle}>New job assigned!</Text>
            <Text style={styles.ringSub}>Tap Ready to stop the ring and view the job.</Text>
          </View>
          <TouchableOpacity
            style={styles.readyBtn}
            onPress={() => {
              notif.acknowledgeLatest();
              notif.stopRing();
              loadData();
            }}
            testID="provider-ready-btn"
          >
            <Text style={styles.readyBtnText}>Ready</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{jobs.length}</Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {jobs.filter((j) => j.status === "assigned").length}
          </Text>
          <Text style={styles.statLabel}>Pending Start</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {jobs.filter((j) => j.status === "in_progress").length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Jobs</Text>
      </View>

      {jobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Briefcase size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No active jobs</Text>
          <Text style={styles.emptySubtitle}>
            You'll see assigned jobs here once admin assigns them to you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const tint = STATUS_TINTS[item.status] ?? STATUS_TINTS.assigned;
            const date = new Date(item.scheduledDate);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(provider)/job/${item.id}`)}
                activeOpacity={0.85}
                testID={`job-card-${item.id}`}
              >
                <Image source={{ uri: item.serviceImage }} style={styles.img} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={[styles.statusPill, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.statusText, { color: tint.fg }]}>
                      {tint.label}
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
                      })}
                    </Text>
                    <Clock size={11} color={colors.textMuted} />
                    <Text style={styles.meta}>{item.timeSlot}</Text>
                  </View>
                  <View style={styles.row}>
                    <MapPin size={11} color={colors.textMuted} />
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.address?.city ?? "N/A"}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: colors.textMuted },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  greeting: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textMain,
    marginBottom: 6,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  ringBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    ...shadow.md,
  },
  ringTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  ringSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
  readyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  readyBtnText: { color: "#DC2626", fontWeight: "800", fontSize: 13 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textMain,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMain,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 10,
  },
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
  img: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMain,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginRight: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 2,
  },
});
