import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, MapPin, User } from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { useSession } from "@/src/context/SessionContext";
import { CITIES } from "@/src/data/seed";
import { dataService } from "@/src/data/service";
import { colors, radius } from "@/src/theme";

export default function ProfileSetup() {
  const router = useRouter();
  const { phone, email } = useLocalSearchParams<{ phone?: string; email?: string }>();
  const { setProfile } = useSession();
  const [name, setName] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [loading, setLoading] = useState(false);

  const canContinue = name.trim().length > 1;

  const onContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    const saved = await dataService.saveProfile({
      name: name.trim(),
      city,
      phone: phone ? `+91 ${phone}` : undefined,
      email: email ?? undefined,
    });
    setProfile(saved);
    setLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
            hitSlop={12}
            testID="profile-back-btn"
          >
            <ArrowLeft size={22} color={colors.textMain} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <User size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>One last thing</Text>
          <Text style={styles.subtitle}>
            Tell us your name and city so we can show services near you.
          </Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Aritra Sen"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            autoCapitalize="words"
            testID="profile-name-input"
          />

          <Text style={styles.label}>Select your city</Text>
          <View style={styles.cityGrid}>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.cityChip, city === c && styles.cityChipActive]}
                activeOpacity={0.8}
                onPress={() => setCity(c)}
                testID={`profile-city-${c.toLowerCase()}`}
              >
                <MapPin
                  size={14}
                  color={city === c ? colors.primary : colors.textMuted}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.cityText,
                    city === c && styles.cityTextActive,
                  ]}
                >
                  {c}
                </Text>
                {city === c ? (
                  <Check size={14} color={colors.primary} strokeWidth={2.5} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.spacer} />

          <PrimaryButton
            label="Continue"
            onPress={onContinue}
            disabled={!canContinue}
            loading={loading}
            testID="profile-continue-btn"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, flexGrow: 1 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "800", color: colors.textMain },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMain,
    marginTop: 22,
    marginBottom: 8,
  },
  input: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textMain,
    fontWeight: "500",
  },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  cityChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  cityText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  cityTextActive: { color: colors.primary },
  spacer: { flex: 1, minHeight: 40 },
});
