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
import { verifyOTP, sendOTP, isDemoMode } from "@/src/lib/phoneAuth";
import { providerService } from "@/src/data/providerService";
import { notify } from "@/src/utils/dialogs";

const SLOTS = 6;
const RESEND_COOLDOWN = 30;

export default function ProviderVerifyScreen() {
  const router = useRouter();
  const { phone, verificationId } = useLocalSearchParams<{
    phone?: string;
    verificationId?: string;
  }>();
  
  const [digits, setDigits] = useState<string[]>(Array(SLOTS).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const refs = useRef<(TextInput | null)[]>([]);

  const code = digits.join("");
  const isComplete = code.length === SLOTS;

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onChangeDigit = (idx: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    setError(null);
    if (clean && idx < SLOTS - 1) refs.current[idx + 1]?.focus();
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
      // First verify the OTP
      const otpResult = await verifyOTP(code, verificationId);
      
      if (!otpResult.success) {
        setError(otpResult.error || "Invalid code");
        setDigits(Array(SLOTS).fill(""));
        refs.current[0]?.focus();
        return;
      }
      
      // OTP verified - now check if provider exists
      const normalizedPhone = phone.replace(/\D/g, "").trim();
      const provider = await providerService.login(normalizedPhone);
      
      if (provider) {
        // Provider found - navigate to jobs
        router.replace("/(provider)/jobs");
      } else {
        // Phone verified but not a registered provider
        notify(
          "Not Registered",
          "Your phone is verified but you're not registered as a provider. Please contact admin."
        );
        router.replace("/(provider)/login");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendCooldown > 0 || !phone) return;
    
    setError(null);
    setResendCooldown(RESEND_COOLDOWN);
    
    try {
      if (!isDemoMode()) {
        const result = await sendOTP(phone);
        if (!result.success) {
          setError(result.error || "Failed to resend code");
        }
      }
    } catch (e) {
      setError("Failed to resend code");
    }
  };

  // Auto-submit when all digits entered
  useEffect(() => {
    if (isComplete && !loading) {
      onVerify();
    }
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

          {isDemoMode() && (
            <View style={styles.demoHint}>
              <Text style={styles.demoHintText}>
                Demo code: <Text style={styles.demoCode}>123456</Text>
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.resend, resendCooldown > 0 && styles.resendDisabled]}
            onPress={onResend}
            disabled={resendCooldown > 0}
            testID="provider-resend-btn"
          >
            <RefreshCw
              size={14}
              color={resendCooldown > 0 ? colors.textMuted : colors.primary}
            />
            <Text
              style={[
                styles.resendText,
                resendCooldown > 0 && styles.resendTextDisabled,
              ]}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend code"}
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
