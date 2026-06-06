import React, { useState, useEffect } from "react";
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
import {
  ArrowLeft,
  Shield,
  Wrench,
  AlertCircle,
} from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { providerService } from "@/src/data/providerService";
import { colors, radius } from "@/src/theme";
import { notify } from "@/src/utils/dialogs";
import { sendOTP, isDemoMode } from "@/src/lib/phoneAuth";
import { isFirebaseConfigured, ensureFirebaseInitialized } from "@/src/lib/firebase";

export default function ProviderLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const provider = await providerService.getCurrentProvider();
        if (provider) {
          router.replace("/(provider)/jobs");
        }
      } catch (e) {
        console.warn("Session check failed", e);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  // Initialize demo providers if in demo mode
  useEffect(() => {
    providerService.initDemoProviders();
    providerService.initDemoBookings();
  }, []);

  // Initialize Firebase on mount
  useEffect(() => {
    if (isFirebaseConfigured) {
      ensureFirebaseInitialized();
    }
  }, []);

  const handleSendOTP = async () => {
    const normalizedPhone = phone.replace(/\D/g, "").trim();
    if (!normalizedPhone || normalizedPhone.length < 10) {
      notify("Invalid phone", "Please enter a valid 10-digit phone number.");
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      // First check if provider exists in the system
      const providers = await providerService.listAllProviders();
      const providerExists = providers.some(
        (p) => p.phone.replace(/\D/g, "") === normalizedPhone
      );
      
      if (!providerExists) {
        notify(
          "Not registered",
          "No service provider found with this phone number. Please contact admin."
        );
        setLoading(false);
        return;
      }
      
      // Provider exists - send OTP (without reCAPTCHA for now)
      const result = await sendOTP(phone, null);
      
      if (!result.success) {
        setError(result.error || "Failed to send code");
        return;
      }
      
      // Navigate to provider verify screen
      router.push({
        pathname: "/(provider)/verify",
        params: {
          phone: normalizedPhone,
          verificationId: result.verificationId,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemoData = async () => {
    setLoading(true);
    try {
      await providerService.resetDemoData();
      notify("Demo Reset", "All demo data has been reset. You can now test the full flow fresh.");
    } catch (e) {
      notify("Reset Failed", "Could not reset demo data.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Checking session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
            hitSlop={12}
            testID="provider-login-back"
          >
            <ArrowLeft size={22} color={colors.textMain} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Wrench size={40} color={colors.primary} strokeWidth={2} />
            </View>
          </View>

          <Text style={styles.title}>Provider Portal</Text>
          <Text style={styles.subtitle}>
            Enter your registered phone number. We'll send a verification code to confirm your identity.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <View style={styles.cc}>
                <Text style={styles.ccText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t.replace(/[^0-9 ]/g, ""));
                  setError(null);
                }}
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
                testID="provider-phone-input"
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.infoBox}>
            <Shield size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              Only registered service providers can login. Contact your admin if
              you're not registered yet.
            </Text>
          </View>

          {isDemoMode() && (
            <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.infoText, { color: colors.primary }]}>
                🔧 <Text style={{ fontWeight: "700" }}>Demo Mode</Text>{"\n"}
                Use phone <Text style={{ fontWeight: "700" }}>9876543210</Text> (Rahul Sharma - Electrician){"\n"}
                OTP code: <Text style={{ fontWeight: "700" }}>123456</Text>
              </Text>
            </View>
          )}

          <PrimaryButton
            label={loading ? "Sending code..." : "Send Verification Code"}
            onPress={handleSendOTP}
            disabled={loading || !phone.trim() || (!recaptchaReady && isFirebaseConfigured)}
            loading={loading}
            testID="provider-login-btn"
          />

          {isDemoMode() && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetDemoData}
              disabled={loading}
            >
              <Text style={styles.resetBtnText}>Reset Demo Data</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: colors.textMuted },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  iconWrap: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textMain,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
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
  ccText: { fontSize: 14, fontWeight: "600", color: colors.textMain },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    fontSize: 16,
    color: colors.textMain,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: radius.md,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: 16,
    alignItems: "center",
    padding: 12,
  },
  resetBtnText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
});
