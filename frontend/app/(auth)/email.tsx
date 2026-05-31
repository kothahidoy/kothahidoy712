import { useState } from "react";
import { Linking, Platform } from "react-native";
import {
  KeyboardAvoidingView,
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
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setOtpError(null);
    setVerifying(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error: e } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp,
          type: "email",
        });
        if (e) throw e;
      }
      // SessionContext listener will pick up the new session; navigate to
      // profile setup so first-time users can enter their name + city.
      router.replace({
        pathname: "/(auth)/profile-setup",
        params: { email: email.trim().toLowerCase() },
      });
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Invalid or expired code");
    } finally {
      setVerifying(false);
    }
  };

  const onSendLink = async () => {
    if (!isValid) return;
    setError(null);
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        // Build a redirect URL that Supabase will append session tokens to
        // after the user clicks the magic link. On web preview that's just
        // window.location.origin; on native it's the app deep link scheme.
        const redirectTo =
          Platform.OS === "web" && typeof window !== "undefined"
            ? `${window.location.origin}/`
            : Linking.createURL("/");
        const { error: e } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
        });
        if (e) throw e;
        setSent(true);
      } else {
        // Demo mode — no real email, just go to profile setup.
        router.push({
          pathname: "/(auth)/profile-setup",
          params: { email: email.trim().toLowerCase() },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send link");
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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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

          {sent ? (
            <>
              <Text style={styles.title}>Check your email 📬</Text>
              <Text style={styles.subtitle}>
                We&apos;ve sent a sign-in link + a 6-digit code to{" "}
                <Text style={styles.email}>{email}</Text>.
              </Text>
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  ✨ <Text style={{ fontWeight: "700" }}>Easiest:</Text> click
                  the &quot;Sign in to Mfixit&quot; button in the email.{"\n\n"}
                  🔢 <Text style={{ fontWeight: "700" }}>Or:</Text> type the
                  6-digit code from the email below.
                </Text>
              </View>

              <TextInput
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                placeholderTextColor={colors.textSubtle}
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, { letterSpacing: 8, textAlign: "center" }]}
                testID="email-otp-input"
              />
              {otpError ? <Text style={styles.err}>{otpError}</Text> : null}

              <View style={{ height: 14 }} />

              <PrimaryButton
                label="Verify code"
                onPress={onVerifyOtp}
                disabled={otp.length !== 6}
                loading={verifying}
                testID="email-verify-otp-btn"
              />

              <TouchableOpacity
                style={styles.resend}
                onPress={onSendLink}
                disabled={loading}
                testID="email-resend-btn"
              >
                <Text style={styles.resendText}>
                  Didn&apos;t get the email?{" "}
                  <Text style={styles.resendLink}>
                    {loading ? "Resending…" : "Resend"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Sign in with email</Text>
              <Text style={styles.subtitle}>
                We&apos;ll email you a magic link. Click it once and you&apos;re
                in — no password, no code.
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
                <View style={styles.tipBox}>
                  <Text style={styles.tipText}>
                    Demo mode — we&apos;ll skip the email and take you straight
                    to profile setup.
                  </Text>
                </View>
              ) : null}

              <View style={styles.spacer} />

              <PrimaryButton
                label="Send magic link"
                onPress={onSendLink}
                disabled={!isValid}
                loading={loading}
                testID="email-continue-btn"
              />
            </>
          )}
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
  email: { color: colors.textMain, fontWeight: "700" },
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
  tipBox: {
    marginTop: 20,
    backgroundColor: colors.primaryLight,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  tipText: { color: colors.primary, fontSize: 13, fontWeight: "500", lineHeight: 19 },
  resend: { alignItems: "center", marginTop: 18 },
  resendText: { color: colors.textMuted, fontSize: 13 },
  resendLink: { color: colors.primary, fontWeight: "700" },
  spacer: { flex: 1, minHeight: 40 },
});
