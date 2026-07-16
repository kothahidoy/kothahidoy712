import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { IndianRupee, TrendingUp } from "lucide-react-native";

import { providerService } from "@/src/data/providerService";
import { colors, radius, shadow } from "@/src/theme";
import { Booking, Provider } from "@/src/types";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function ProviderEarnings() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const currentProvider = await providerService.getCurrentProvider();
      if (!currentProvider) {
        router.replace("/(provider)/login");
        return;
      }
      setProvider(currentProvider);
      const completed = await providerService.listCompletedJobs(currentProvider.id, 90);
      setJobs(completed);
    } catch (e) {
      console.warn("Failed to load earnings", e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const stats = useMemo(() => {
    const now = new Date();
    const today0 = startOfDay(now);
    const week0 = new Date(today0);
    week0.setDate(week0.getDate() - 6); // last 7 days incl. today
    const month0 = new Date(today0);
    month0.setDate(1);

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    // Last 7 days, oldest → newest, for the bar chart.
    const days: { label: string; total: number }[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today0);
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), total: 0 };
    });

    for (const job of jobs) {
      const jobDate = startOfDay(new Date(job.scheduledDate));
      const price = job.price || 0;

      if (jobDate >= month0) {
        monthTotal += price;
        monthCount++;
      }
      if (jobDate >= week0) {
        weekTotal += price;
        weekCount++;
        const dayIdx = Math.round((jobDate.getTime() - week0.getTime()) / 86400000);
        if (dayIdx >= 0 && dayIdx < 7) days[dayIdx].total += price;
      }
      if (jobDate.getTime() === today0.getTime()) {
        todayTotal += price;
        todayCount++;
      }
    }

    return { todayTotal, weekTotal, monthTotal, todayCount, weekCount, monthCount, days };
  }, [jobs]);

  const maxDayTotal = Math.max(1, ...stats.days.map((d) => d.total));

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>{provider?.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statsRow}>
          <StatCard label="Today" amount={stats.todayTotal} count={stats.todayCount} />
          <StatCard label="This week" amount={stats.weekTotal} count={stats.weekCount} highlight />
          <StatCard label="This month" amount={stats.monthTotal} count={stats.monthCount} />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <TrendingUp size={16} color={colors.primary} />
            <Text style={styles.chartTitle}>Last 7 days</Text>
          </View>
          <View style={styles.chartBars}>
            {stats.days.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barValue}>{d.total > 0 ? `₹${d.total}` : ""}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, (d.total / maxDayTotal) * 90),
                      backgroundColor: d.total > 0 ? colors.primary : "#E5E7EB",
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {jobs.length === 0 && (
          <View style={styles.emptyBox}>
            <IndianRupee size={32} color={colors.textSubtle} />
            <Text style={styles.emptyText}>No completed jobs yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  amount,
  count,
  highlight,
}: {
  label: string;
  amount: number;
  count: number;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text style={[styles.statLabel, highlight && styles.statLabelHighlight]}>{label}</Text>
      <Text style={[styles.statAmount, highlight && styles.statAmountHighlight]}>₹{amount}</Text>
      <Text style={[styles.statCount, highlight && styles.statCountHighlight]}>
        {count} job{count === 1 ? "" : "s"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FB" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "800", color: colors.textMain },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    padding: 12,
    ...shadow.card,
  },
  statCardHighlight: { backgroundColor: colors.primary },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  statLabelHighlight: { color: "#EDE9FE" },
  statAmount: { fontSize: 18, fontWeight: "800", color: colors.textMain, marginTop: 6 },
  statAmountHighlight: { color: "#fff" },
  statCount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  statCountHighlight: { color: "#EDE9FE" },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: 16,
    ...shadow.card,
  },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 130,
  },
  barCol: { alignItems: "center", flex: 1 },
  barValue: { fontSize: 9, color: colors.textMuted, marginBottom: 4 },
  bar: { width: 18, borderRadius: 6 },
  barLabel: { fontSize: 10, color: colors.textMuted, marginTop: 6 },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 13, color: colors.textMuted },
});
