import React, { useState } from "react";
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
import { ArrowLeft, MessageCircle, AlertCircle } from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, radius } from "@/src/theme";
import { sendOtp, OtpError } from "@/src/lib/otpApi";

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
      const res = await sendOtp(phone);
      router.push({
        pathname: "/(auth)/verify",
        params: {
          phone,
          authType: "user",
          channel: res.channel,
          expiresIn: String(res.expires_in_seconds),
          resendAfter: String(res.resend_after_seconds),
        },
      });
    } catch (e) {
      if (e instanceof OtpError) {
        if (e.code === "RESEND_TOO_SOON" && e.retryAfter) {
          setError(`Please wait ${e.retryAfter}s before requesting another code.`);
        } else {
          setError(e.message || "Could not send code. Try again.");
        }
      } else {
        setError(e instanceof Error ? e.message : "Could not send code");
      }
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
            <MessageCircle size={28} color="#25D366" />
          </View>
          <Text style={styles.title}>Enter your WhatsApp number</Text>
          <Text style={styles.subtitle}>
            We'll send a 6-digit verification code to your WhatsApp.
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

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={colors.error} />
              <Text style={styles.err}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.note}>
            <MessageCircle size={16} color="#25D366" />
            <Text style={styles.noteText}>
              Make sure WhatsApp is installed and active on this number.
            </Text>
          </View>

          <View style={styles.spacer} />

          <PrimaryButton
            label={loading ? "Sending code..." : "Send WhatsApp code"}
            onPress={onContinue}
            disabled={!isValid || loading}
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
    backgroundColor: "#25D36620",
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
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: radius.md,
  },
  err: { color: colors.error, fontSize: 13, flex: 1 },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: "#25D36610",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#25D36630",
  },
  noteText: { color: "#1F8B4D", fontSize: 12, flex: 1, lineHeight: 18 },
  spacer: { flex: 1, minHeight: 40 },
});
