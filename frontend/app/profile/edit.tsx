import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, User } from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { useSession } from "@/src/context/SessionContext";
import { CITIES } from "@/src/data/seed";
import { dataService } from "@/src/data/service";
import { colors, radius } from "@/src/theme";
import { notify } from "@/src/utils/dialogs";

export default function EditProfile() {
  const router = useRouter();
  const { profile, setProfile } = useSession();
  const [name, setName] = useState(profile?.name || "");
  const [city, setCity] = useState(profile?.city || CITIES[0]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(!profile);

  useEffect(() => {
    if (profile) return;
    (async () => {
      const p = await dataService.getProfile();
      if (p) {
        setProfile(p);
        setName(p.name || "");
        setCity(p.city || CITIES[0]);
      }
      setInitializing(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSave = name.trim().length > 1;

  const onSave = async () => {
    if (!canSave || !profile) return;
    setLoading(true);
    try {
      const saved = await dataService.saveProfile({
        ...profile,
        name: name.trim(),
        city,
      });
      setProfile(saved);
      notify("Saved", "Your profile has been updated.");
      router.back();
    } catch (e: any) {
      notify("Couldn't save", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <ArrowLeft size={22} color={colors.textMain} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit profile</Text>
            <View style={{ width: 22 }} />
          </View>

          <View style={styles.iconWrap}>
            <User size={28} color={colors.primary} />
          </View>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Aritra Sen"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Phone number</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>{profile?.phone || "Not linked"}</Text>
          </View>
          <Text style={styles.helperText}>
            Phone number can't be changed here since it's tied to OTP sign-in.
          </Text>

          <Text style={styles.label}>City</Text>
          <View style={styles.cityGrid}>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.cityChip, city === c && styles.cityChipActive]}
                activeOpacity={0.8}
                onPress={() => setCity(c)}
              >
                <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <PrimaryButton
            label={loading ? "Saving..." : "Save changes"}
            onPress={onSave}
            disabled={!canSave || loading}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.textMain },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMain, marginBottom: 8, marginTop: 18 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textMain,
  },
  readOnlyInput: { backgroundColor: "#F5F5F5", justifyContent: "center" },
  readOnlyText: { fontSize: 15, color: colors.textMuted },
  helperText: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  cityChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cityChipText: { fontSize: 13, color: colors.textMain, fontWeight: "600" },
  cityChipTextActive: { color: "#fff" },
});
