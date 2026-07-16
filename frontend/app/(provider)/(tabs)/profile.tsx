import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  HeadphonesIcon,
  LogOut,
  MessageCircle,
  Phone,
  Star,
  User as UserIcon,
} from "lucide-react-native";

import { providerService } from "@/src/data/providerService";
import { CATEGORIES } from "@/src/data/seed";
import { Booking, Provider } from "@/src/types";
import { colors, radius, shadow } from "@/src/theme";
import { confirmAsync, notify } from "@/src/utils/dialogs";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

export default function ProviderProfile() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [whatsapp, setWhatsapp] = useState("919999999999");
  const [supportPhone, setSupportPhone] = useState("+91 98765 00000");

  const loadData = useCallback(async () => {
    try {
      const currentProvider = await providerService.getCurrentProvider();
      if (!currentProvider) {
        router.replace("/(provider)/login");
        return;
      }
      setProvider(currentProvider);
      const jobs = await providerService.listCompletedJobs(currentProvider.id, 365);
      setCompletedJobs(jobs);
      try {
        const res = await fetch(`${API_BASE}/api/admin/cms/profile-screen`);
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.whatsapp_number) setWhatsapp(cfg.whatsapp_number);
          if (cfg.support_phone) setSupportPhone(cfg.support_phone);
        }
      } catch {}
    } catch (e) {
      console.warn("Failed to load provider profile", e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const ratingStats = useMemo(() => {
    const rated = completedJobs.filter((j) => !!j.rating);
    if (rated.length === 0) return { avg: 0, count: 0 };
    const sum = rated.reduce((s, j) => s + (j.rating || 0), 0);
    return { avg: sum / rated.length, count: rated.length };
  }, [completedJobs]);

  const categoryName = provider
    ? CATEGORIES.find((c) => c.id === provider.serviceType)?.name || provider.serviceType
    : "";

  const onToggleAvailability = async (value: boolean) => {
    if (!provider) return;
    setTogglingAvail(true);
    const prev = provider;
    setProvider({ ...provider, isAvailable: value });
    const res = await providerService.setMyAvailability(provider.id, value);
    if (!res.success) {
      setProvider(prev);
      notify("Couldn't update", res.error || "Please try again.");
    }
    setTogglingAvail(false);
  };

  const onLogout = async () => {
    const confirmed = await confirmAsync(
      "Logout?",
      "Are you sure you want to logout from the provider portal?",
      "Logout",
      "Cancel",
    );
    if (confirmed) {
      await providerService.logout();
      router.replace("/(provider)/login");
    }
  };

  const callSupport = () => Linking.openURL(`tel:${supportPhone.replace(/\s/g, "")}`);
  const whatsappSupport = () =>
    Linking.openURL(`https://wa.me/${whatsapp}?text=Hi%2C%20I%20need%20help%20(Provider)`).catch(
      () => notify("WhatsApp not installed"),
    );

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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <UserIcon size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.name}>{provider?.name}</Text>
            <Text style={styles.sub}>{categoryName}</Text>
            <Text style={styles.sub}>{provider?.phone}</Text>
          </View>
        </View>

        <View style={styles.availRow}>
          <View>
            <Text style={styles.availLabel}>
              {provider?.isAvailable ? "Available for jobs" : "Off duty"}
            </Text>
            <Text style={styles.availSub}>
              {provider?.isAvailable
                ? "You'll be shown to admin for new job assignments"
                : "You won't receive new job assignments"}
            </Text>
          </View>
          <Switch
            value={!!provider?.isAvailable}
            onValueChange={onToggleAvailability}
            disabled={togglingAvail}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.ratingRow}>
            <Star size={22} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingValue}>
              {ratingStats.count > 0 ? ratingStats.avg.toFixed(1) : "—"}
            </Text>
          </View>
          <Text style={styles.ratingSub}>
            {ratingStats.count > 0
              ? `Based on ${ratingStats.count} customer review${ratingStats.count === 1 ? "" : "s"}`
              : "No ratings yet"}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <TouchableOpacity style={styles.row} onPress={callSupport}>
          <Phone size={18} color={colors.textMain} />
          <Text style={styles.rowText}>Call support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={whatsappSupport}>
          <MessageCircle size={18} color={colors.textMain} />
          <Text style={styles.rowText}>WhatsApp support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => notify("Help", "Contact support for any issues with jobs, payments, or your account.")}>
          <HeadphonesIcon size={18} color={colors.textMain} />
          <Text style={styles.rowText}>Help & FAQs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.row, styles.logoutRow]} onPress={onLogout}>
          <LogOut size={18} color="#DC2626" />
          <Text style={[styles.rowText, { color: "#DC2626" }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FB" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16, paddingBottom: 40 },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  availRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.card,
  },
  availLabel: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  availSub: { fontSize: 11, color: colors.textMuted, marginTop: 3, maxWidth: 220 },
  ratingCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
    ...shadow.card,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ratingValue: { fontSize: 24, fontWeight: "800", color: colors.textMain },
  ratingSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 8, marginLeft: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    ...shadow.card,
  },
  rowText: { fontSize: 14, fontWeight: "600", color: colors.textMain },
  logoutRow: { marginTop: 10 },
});
