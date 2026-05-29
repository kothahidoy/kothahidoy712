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
import { useRouter } from "expo-router";
import { ArrowLeft, Phone } from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, radius } from "@/src/theme";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = phone.replace(/\D/g, "").length >= 10;

  const onContinue = async () => {
    if (!isValid) return;
    setError(null);
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const e164 = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
        const { error: e } = await supabase.auth.signInWithOtp({ phone: e164 });
        if (e) throw e;
      }
      // In demo mode (or after Supabase OTP send) we route to verify screen.
      router.push({ pathname: "/(auth)/verify", params: { phone } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
            hitSlop={12}
            testID="phone-back-btn"
          >
            <ArrowLeft size={22} color={colors.textMain} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Phone size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Enter your mobile number</Text>
          <Text style={styles.subtitle}>
            We&apos;ll send a 6-digit code to verify your identity.
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.cc}>
              <Text style={styles.ccText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^0-9 ]/g, ""))}
              keyboardType="phone-pad"
              placeholder="98765 43210"
              placeholderTextColor={colors.textSubtle}
              maxLength={11}
              style={styles.input}
              testID="phone-input"
            />
          </View>
          {error ? <Text style={styles.err}>{error}</Text> : null}

          {!isSupabaseConfigured ? (
            <View style={styles.demoNote}>
              <Text style={styles.demoNoteText}>
                Demo mode — any 6-digit code will work on the next screen.
              </Text>
            </View>
          ) : null}

          <View style={styles.spacer} />

          <PrimaryButton
            label="Send code"
            onPress={onContinue}
            disabled={!isValid}
            loading={loading}
            testID="phone-continue-btn"
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
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 28,
    gap: 8,
  },
  cc: {
    height: 56,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ccText: { fontSize: 16, fontWeight: "600", color: colors.textMain },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 17,
    color: colors.textMain,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  err: { color: colors.error, fontSize: 13, marginTop: 10 },
  demoNote: {
    marginTop: 16,
    backgroundColor: colors.warningLight,
    padding: 12,
    borderRadius: radius.md,
  },
  demoNoteText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "600",
  },
  spacer: { flex: 1, minHeight: 40 },
});
