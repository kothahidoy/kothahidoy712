import React, { useRef, useState, useEffect } from "react";
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
import { ArrowLeft, ShieldCheck, AlertCircle, RefreshCw, Wrench } from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, radius } from "@/src/theme";
import { verifyOtp, resendOtp, OtpError } from "@/src/lib/otpApi";
import { providerService } from "@/src/data/providerService";
import { notify } from "@/src/utils/dialogs";
import { supabase } from "@/src/lib/supabase";

const SLOTS = 6;

export default function ProviderVerifyScreen() {
  const router = useRouter();
  const { phone, resendAfter } = useLocalSearchParams<{
    phone?: string;
    resendAfter?: string;
  }>();

  const initialCooldown = Number(resendAfter || "25");
  const [digits, setDigits] = useState<string[]>(Array(SLOTS).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(initialCooldown);
  const [resending, setResending] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  const code = digits.join("");
  const isComplete = code.length === SLOTS;

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onChangeDigit = (idx: number, v: string) => {
    const cleaned = v.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const next = Array(SLOTS).fill("");
      for (let i = 0; i < Math.min(cleaned.length, SLOTS); i++) next[i] = cleaned[i];
      setDigits(next);
      setError(null);
      const focusIdx = Math.min(cleaned.length, SLOTS - 1);
      refs.current[focusIdx]?.focus();
      return;
    }
    const single = cleaned.slice(-1);
    const next = [...digits];
    next[idx] = single;
    setDigits(next);
    setError(null);
    if (single && idx < SLOTS - 1) refs.current[idx + 1]?.focus();
  };

  const onKeyPress = (idx: number, key: string) => {
    if (key === "Backspace" && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const onVerify = async () => {
    if (!isComplete || !phone) return;
    setError(null);
    setLoading(true);

    try {
      // First verify the OTP via MSG91 backend
      const res = await verifyOtp(phone, code);

      // Hand any Supabase session to supabase-js so RLS works going forward.
      if (res.session && supabase) {
        try {
          await supabase.auth.setSession({
            access_token: res.session.access_token,
            refresh_token: res.session.refresh_token,
          });
        } catch (err) {
          console.warn("[provider verify] setSession failed", err);
        }
      }

      // OTP verified - now check if provider exists
      const normalizedPhone = phone.replace(/\D/g, "").trim();
      const provider = await providerService.login(normalizedPhone);

      if (provider) {
        router.replace("/(provider)/jobs");
      } else {
        notify(
          "Not Registered",
          "Your phone is verified but you're not registered as a provider. Please contact admin."
        );
        router.replace("/(provider)/login");
      }
    } catch (e) {
      if (e instanceof OtpError) {
        let msg = e.message || "Verification failed";
        if (e.code === "INVALID_OTP" && typeof e.attemptsLeft === "number") {
          msg = `${msg} (${e.attemptsLeft} ${e.attemptsLeft === 1 ? "try" : "tries"} left)`;
        }
        setError(msg);
      } else {
        setError(e instanceof Error ? e.message : "Verification failed");
      }
      setDigits(Array(SLOTS).fill(""));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendCooldown > 0 || resending || !phone) return;
    setError(null);
    setResending(true);
    try {
      const res = await resendOtp(phone);
      setResendCooldown(res.resend_after_seconds || initialCooldown);
      setDigits(Array(SLOTS).fill(""));
      refs.current[0]?.focus();
    } catch (e) {
      if (e instanceof OtpError) {
        if (e.code === "RESEND_TOO_SOON" && e.retryAfter) {
          setResendCooldown(e.retryAfter);
        } else {
          setError(e.message || "Failed to resend code");
        }
      } else {
        setError("Failed to resend code");
      }
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when all digits entered
  useEffect(() => {
    if (isComplete && !loading) onVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

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
            testID="provider-verify-back-btn"
          >
            <ArrowLeft size={22} color={colors.textMain} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <View style={styles.iconBadge}>
              <Wrench size={14} color="#fff" />
            </View>
            <ShieldCheck size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Provider Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{" "}
            <Text style={styles.phone}>+91 {phone}</Text>
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
                style={[
                  styles.otpBox,
                  d ? styles.otpBoxFilled : null,
                  error ? styles.otpBoxError : null,
                ]}
                selectTextOnFocus
                testID={`provider-otp-input-${i}`}
              />
            ))}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={colors.error} />
              <Text style={styles.err}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.resend, (resendCooldown > 0 || resending) && styles.resendDisabled]}
            onPress={onResend}
            disabled={resendCooldown > 0 || resending}
            testID="provider-resend-btn"
          >
            <RefreshCw
              size={14}
              color={resendCooldown > 0 ? colors.textMuted : colors.primary}
            />
            <Text
              style={[
                styles.resendText,
                (resendCooldown > 0 || resending) && styles.resendTextDisabled,
              ]}
            >
              {resending
                ? "Resending..."
                : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend code via WhatsApp"}
            </Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <PrimaryButton
            label={loading ? "Verifying..." : "Verify & Login"}
            onPress={onVerify}
            disabled={!isComplete || loading}
            loading={loading}
            testID="provider-verify-btn"
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
    position: "relative",
  },
  iconBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
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
  otpBoxError: {
    borderColor: colors.error,
    backgroundColor: "#FEF2F2",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: radius.md,
  },
  err: { color: colors.error, fontSize: 13, flex: 1 },
  demoHint: {
    marginTop: 12,
    alignItems: "center",
  },
  demoHintText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  demoCode: {
    fontWeight: "700",
    color: colors.primary,
  },
  resend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    padding: 12,
  },
  resendDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  resendTextDisabled: {
    color: colors.textMuted,
  },
  spacer: { flex: 1, minHeight: 40 },
});
