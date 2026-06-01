import { useCallback, useState } from "react";
import {
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
  CheckCircle2,
  ChevronRight,
  IndianRupee,
  Settings as SettingsIcon,
  ShieldAlert,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react-native";

import { adminService, AdminStats } from "@/src/data/admin";
import { useSession } from "@/src/context/SessionContext";
import { colors, radius, shadow } from "@/src/theme";

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, isLoading, hasSession, refreshProfile } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Pull fresh role + stats whenever this screen comes into focus.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        await refreshProfile();
        if (isAdmin) setStats(await adminService.getStats());
      })();
    }, [isAdmin, refreshProfile]),
  );

  // While the session is still resolving, render nothing (avoids a
  // flash of "Access denied" before the role is loaded).
  if (isLoading || (hasSession && isAdmin === false && stats === null)) {
    // Small delay window — when we have a session but role hasn't been
    // confirmed yet, stay silent.
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.deny}>
          <View style={styles.denyIcon}>
            <ShieldAlert size={32} color={colors.error} strokeWidth={2} />
          </View>
          <Text style={styles.denyTitle}>Access denied</Text>
          <Text style={styles.denySub}>
            You don&apos;t have admin permissions. Ask the owner to promote your
            account in Supabase.
          </Text>
          <TouchableOpacity
            style={styles.denyCTA}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.85}
          >
            <Text style={styles.denyCTAText}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.replace("/(tabs)/profile")}
          hitSlop={12}
          testID="admin-back-btn"
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.crumb}>Mfixit · Admin</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          <KpiCard
            icon={IndianRupee}
            label="Revenue"
            value={`₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`}
            tint="#16A34A"
            bg={colors.successLight}
          />
          <KpiCard
            icon={Calendar}
            label="Bookings"
            value={stats?.totalBookings.toString() ?? "0"}
            tint={colors.primary}
            bg={colors.primaryLight}
          />
          <KpiCard
            icon={Users}
            label="Customers"
            value={stats?.totalCustomers.toString() ?? "0"}
            tint="#7C3AED"
            bg="#F3E8FF"
          />
          <KpiCard
            icon={TrendingUp}
            label="Active"
            value={stats?.activeBookings.toString() ?? "0"}
            tint="#F59E0B"
            bg={colors.warningLight}
          />
          <KpiCard
            icon={CheckCircle2}
            label="Completed"
            value={stats?.completedBookings.toString() ?? "0"}
            tint={colors.success}
            bg={colors.successLight}
          />
          <KpiCard
            icon={XCircle}
            label="Cancelled"
            value={stats?.cancelledBookings.toString() ?? "0"}
            tint={colors.error}
            bg={colors.errorLight}
          />
        </View>

        <Text style={styles.sectionTitle}>Manage</Text>

        <View style={styles.menu}>
          <MenuItem
            icon={Calendar}
            label="All bookings"
            sub="View & update status, contact customers"
            onPress={() => router.push("/admin/bookings")}
            testID="admin-bookings-link"
          />
          <MenuItem
            icon={Users}
            label="Customers"
            sub="Browse all registered users"
            onPress={() => router.push("/admin/customers")}
            testID="admin-customers-link"
          />
          <MenuItem
            icon={SettingsIcon}
            label="Settings"
            sub="Pricing, regions, holiday slots — coming soon"
            onPress={() => null}
            testID="admin-settings-link"
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tint,
  bg,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  value: string;
  tint: string;
  bg: string;
}) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
        <Icon size={18} color={tint} strokeWidth={2.5} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({
  icon: Icon,
  label,
  sub,
  onPress,
  testID,
  last,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  sub: string;
  onPress: () => void;
  testID: string;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !last && styles.menuDivider]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      <View style={styles.menuIcon}>
        <Icon size={18} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
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
  crumb: { fontSize: 11, color: colors.textMuted, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  title: { fontSize: 24, fontWeight: "800", color: colors.textMain, letterSpacing: -0.3 },
  scroll: { padding: 20, paddingBottom: 30 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: {
    flexBasis: "31.5%",
    flexGrow: 1,
    padding: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiValue: { fontSize: 18, fontWeight: "800", color: colors.textMain, letterSpacing: -0.3 },
  kpiLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: "600" },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 24,
    marginBottom: 12,
  },
  menu: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  menuSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  deny: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12 },
  denyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  denyTitle: { fontSize: 22, fontWeight: "800", color: colors.textMain },
  denySub: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  denyCTA: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  denyCTAText: { color: "#FFFFFF", fontWeight: "700" },
});
