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
import { ArrowLeft, Mail } from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, radius } from "@/src/theme";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onContinue = async () => {
    if (!isValid) return;
    setError(null);
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error: e } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: {
            // shouldCreateUser true is the default; we keep it explicit so
            // first-time users can sign up + sign in in a single step.
            shouldCreateUser: true,
          },
        });
        if (e) throw e;
      }
      router.push({
        pathname: "/(auth)/verify",
        params: { email: email.trim().toLowerCase() },
      });
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
            testID="email-back-btn"
          >
            <ArrowLeft size={22} color={colors.textMain} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Mail size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Enter your email</Text>
          <Text style={styles.subtitle}>
            We&apos;ll email you a 6-digit code to sign you in. No password
            needed.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSubtle}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            testID="email-input"
          />

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
            testID="email-continue-btn"
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
  input: {
    marginTop: 28,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.textMain,
    fontWeight: "500",
  },
  err: { color: colors.error, fontSize: 13, marginTop: 10 },
  demoNote: {
    marginTop: 16,
    backgroundColor: colors.warningLight,
    padding: 12,
    borderRadius: radius.md,
  },
  demoNoteText: { color: "#92400E", fontSize: 12, fontWeight: "600" },
  spacer: { flex: 1, minHeight: 40 },
});
