import React, { useState, useRef, useEffect } from "react";
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
import { ArrowLeft, Phone, AlertCircle } from "lucide-react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, radius } from "@/src/theme";
import { sendOTP, formatPhoneE164, isDemoMode } from "@/src/lib/phoneAuth";
import { isFirebaseConfigured, firebase } from "@/src/lib/firebase";

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // reCAPTCHA ref for Firebase
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const isValid = phone.replace(/\D/g, "").length >= 10;

  // Check reCAPTCHA readiness
  useEffect(() => {
    if (Platform.OS === "web" && isFirebaseConfigured) {
      // On web, reCAPTCHA needs a moment to initialize
      const timer = setTimeout(() => setRecaptchaReady(true), 500);
      return () => clearTimeout(timer);
    } else {
      setRecaptchaReady(true);
    }
  }, []);

  const onContinue = async () => {
    if (!isValid) return;
    setError(null);
    setLoading(true);
    
    try {
      const e164Phone = formatPhoneE164(phone);
      
      // Get reCAPTCHA verifier for web
      let verifier = null;
      if (Platform.OS === "web" && isFirebaseConfigured && recaptchaVerifier.current) {
        verifier = recaptchaVerifier.current;
      }
      
      const result = await sendOTP(phone, verifier);
      
      if (!result.success) {
        setError(result.error || "Failed to send code");
        return;
      }
      
      // Navigate to verify screen with phone and verification ID
      router.push({
        pathname: "/(auth)/verify",
        params: {
          phone,
          verificationId: result.verificationId,
          authType: "user", // User authentication
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {/* Firebase reCAPTCHA Modal */}
      {isFirebaseConfigured && firebase && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebase.options}
          attemptInvisibleVerification={true}
        />
      )}
      
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
            We'll send a 6-digit code to verify your identity.
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

          {/* Demo Mode Notice */}
          {isDemoMode() ? (
            <View style={styles.demoNote}>
              <Text style={styles.demoNoteTitle}>🔧 Demo Mode</Text>
              <Text style={styles.demoNoteText}>
                Firebase not configured. Any 6-digit code will work.{"\n"}
                Default code: <Text style={styles.demoCode}>123456</Text>
              </Text>
            </View>
          ) : !isFirebaseConfigured ? (
            <View style={styles.configNote}>
              <AlertCircle size={16} color="#B45309" />
              <Text style={styles.configNoteText}>
                Add Firebase credentials to enable real SMS verification.
              </Text>
            </View>
          ) : null}

          <View style={styles.spacer} />

          <PrimaryButton
            label={loading ? "Sending code..." : "Send code"}
            onPress={onContinue}
            disabled={!isValid || loading || (!recaptchaReady && isFirebaseConfigured)}
            loading={loading}
            testID="phone-continue-btn"
          />
          
          {loading && (
            <Text style={styles.loadingHint}>
              {isFirebaseConfigured ? "Verifying reCAPTCHA..." : "Processing..."}
            </Text>
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
  demoNote: {
    marginTop: 16,
    backgroundColor: colors.primaryLight,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  demoNoteTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  demoNoteText: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  demoCode: {
    fontWeight: "800",
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 4,
  },
  configNote: {
    marginTop: 16,
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  configNoteText: {
    color: "#92400E",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  spacer: { flex: 1, minHeight: 40 },
  loadingHint: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
});
