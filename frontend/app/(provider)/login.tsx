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
  Phone,
  Shield,
  Wrench,
} from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { providerService } from "@/src/data/providerService";
import { colors, radius } from "@/src/theme";
import { notify } from "@/src/utils/dialogs";
import { isSupabaseConfigured } from "@/src/lib/supabase";

export default function ProviderLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

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
    if (!isSupabaseConfigured) {
      providerService.initDemoProviders();
    }
  }, []);

  const handleLogin = async () => {
    const normalizedPhone = phone.replace(/\D/g, "").trim();
    if (!normalizedPhone || normalizedPhone.length < 10) {
      notify("Invalid phone", "Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const provider = await providerService.login(normalizedPhone);
      if (provider) {
        router.replace("/(provider)/jobs");
      } else {
        notify(
          "Not registered",
          "No service provider found with this phone number. Please contact admin."
        );
      }
    } catch (e) {
      notify("Login failed", "Something went wrong. Please try again.");
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
            Login with your registered phone number to view and manage your
            assigned jobs.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Phone size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
                testID="provider-phone-input"
              />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Shield size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              Only registered service providers can login. Contact your admin if
              you're not registered yet.
            </Text>
          </View>

          {!isSupabaseConfigured && (
            <View style={[styles.infoBox, { backgroundColor: colors.warningLight }]}>
              <Text style={[styles.infoText, { color: "#B45309" }]}>
                💡 Demo Mode: Use phone 9876543210 to login as a demo provider
              </Text>
            </View>
          )}

          <PrimaryButton
            label={loading ? "Logging in..." : "Login"}
            onPress={handleLogin}
            disabled={loading || !phone.trim()}
            testID="provider-login-btn"
          />
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
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textMain,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.primaryLight,
    padding: 14,
    borderRadius: radius.lg,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    lineHeight: 18,
  },
});
