import { useRef, useState } from "react";
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
import { ArrowLeft, ShieldCheck } from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, radius } from "@/src/theme";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { dataService } from "@/src/data/service";

const SLOTS = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const { phone, email } = useLocalSearchParams<{ phone?: string; email?: string }>();
  const [digits, setDigits] = useState<string[]>(Array(SLOTS).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<(TextInput | null)[]>([]);

  const code = digits.join("");
  const isComplete = code.length === SLOTS;

  const onChangeDigit = (idx: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    if (clean && idx < SLOTS - 1) refs.current[idx + 1]?.focus();
  };

  const onKeyPress = (idx: number, key: string) => {
    if (key === "Backspace" && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const routeAfterAuth = async () => {
    try {
      const fresh = await dataService.getProfile();
      if (fresh?.name) {
        router.replace("/(tabs)");
        return;
      }
    } catch {}
    router.replace({
      pathname: "/(auth)/profile-setup",
      params: { phone, email },
    });
  };

  const onVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        if (email) {
          const { error: e } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: "email",
          });
          if (e) throw e;
        } else if (phone) {
          const e164 = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
          const { error: e } = await supabase.auth.verifyOtp({
            phone: e164,
            token: code,
            type: "sms",
          });
          if (e) throw e;
        }
      }
      await routeAfterAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
            hitSlop={12}
            testID="verify-back-btn"
          >
            <ArrowLeft size={22} color={colors.textMain} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <ShieldCheck size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{" "}
            <Text style={styles.phone}>
              {email ?? (phone ? `+91 ${phone}` : "your account")}
            </Text>
          </Text>

          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                onChangeText={(v) => onChangeDigit(i, v)}
                onKeyPress={({ nativeEvent }) =>
                  onKeyPress(i, nativeEvent.key)
                }
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
                selectTextOnFocus
                testID={`otp-input-${i}`}
              />
            ))}
          </View>

          {error ? <Text style={styles.err}>{error}</Text> : null}

          <TouchableOpacity style={styles.resend} testID="resend-btn">
            <Text style={styles.resendText}>
              Didn&apos;t get a code? <Text style={styles.resendLink}>Resend</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <PrimaryButton
            label="Verify & Continue"
            onPress={onVerify}
            disabled={!isComplete}
            loading={loading}
            testID="verify-continue-btn"
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
  phone: { color: colors.textMain, fontWeight: "700" },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    gap: 10,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: colors.textMain,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  err: { color: colors.error, fontSize: 13, marginTop: 10 },
  resend: { alignItems: "center", marginTop: 20 },
  resendText: { color: colors.textMuted, fontSize: 13 },
  resendLink: { color: colors.primary, fontWeight: "700" },
  spacer: { flex: 1, minHeight: 40 },
});
