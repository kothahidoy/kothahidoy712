import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Trash2, Bell, MapPin, Info, AlertTriangle } from "lucide-react-native";

import { useSession } from "@/src/context/SessionContext";
import { CITIES } from "@/src/data/seed";
import { dataService } from "@/src/data/service";
import { storage } from "@/src/utils/storage";
import { colors } from "@/src/theme";
import { notify } from "@/src/utils/dialogs";

const NOTIF_ENABLED_KEY = "settings.notif_enabled";
const APP_VERSION = "1.0.0";

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, setProfile } = useSession();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [city, setCity] = useState(profile?.city || CITIES[0]);
  const [supportEmail, setSupportEmail] = useState("support@mfixit.in");

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<boolean>(NOTIF_ENABLED_KEY, true).catch(() => true);
      setNotifEnabled(stored ?? true);
      try {
        const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${API_BASE}/api/admin/cms/profile-screen`);
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.support_email) setSupportEmail(cfg.support_email);
        }
      } catch {}
    })();
  }, []);

  const toggleNotif = async (val: boolean) => {
    setNotifEnabled(val);
    try {
      await storage.setItem(NOTIF_ENABLED_KEY, val);
    } catch {}
  };

  const onChangeCity = async (c: string) => {
    setCity(c);
    if (!profile) return;
    try {
      const saved = await dataService.saveProfile({ ...profile, city: c });
      setProfile(saved);
    } catch {}
  };

  const onClearLocalData = () => {
    notify("Clear local data?", "This clears cached data on this device only. Nothing on your account is deleted.");
    (async () => {
      await dataService.clearLocalCache();
    })();
  };

  const onDeleteAccountRequest = () => {
    const subject = encodeURIComponent("Account deletion request");
    const body = encodeURIComponent(
      `Hi Mfixit team,\n\nPlease delete my account and associated data.\n\nName: ${profile?.name || ""}\nPhone: ${profile?.phone || ""}\nEmail: ${profile?.email || ""}\n\nThanks.`,
    );
    Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${body}`).catch(() => {
      notify("Couldn't open mail app", `Please email ${supportEmail} directly to request account deletion.`);
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.row}>
          <Bell size={18} color={colors.textMain} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.rowTitle}>Notifications</Text>
            <Text style={styles.rowSubtitle}>Get alerts about your bookings</Text>
          </View>
          <Switch value={notifEnabled} onValueChange={toggleNotif} trackColor={{ true: colors.primary }} />
        </View>

        <Text style={styles.sectionLabel}>Default city</Text>
        <View style={styles.cityGrid}>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.cityChip, city === c && styles.cityChipActive]}
              onPress={() => onChangeCity(c)}
            >
              <MapPin size={12} color={city === c ? "#fff" : colors.textMain} />
              <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.row} onPress={onClearLocalData}>
          <Trash2 size={18} color={colors.textMain} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.rowTitle}>Clear local data</Text>
            <Text style={styles.rowSubtitle}>Reset cached data on this device</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={onDeleteAccountRequest}>
          <AlertTriangle size={18} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.rowTitle, { color: "#DC2626" }]}>Delete account</Text>
            <Text style={styles.rowSubtitle}>Send a request to close your account</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.row}>
          <Info size={18} color={colors.textMuted} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.rowTitle}>App version</Text>
            <Text style={styles.rowSubtitle}>Mfixit v{APP_VERSION}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.textMain },
  scroll: { padding: 20, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.textMain },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: 20, marginBottom: 10 },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cityChipText: { fontSize: 13, color: colors.textMain, fontWeight: "600" },
  cityChipTextActive: { color: "#fff" },
});
