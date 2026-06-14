import { useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  Mail, 
  RefreshCw,
  AlertCircle,
} from "lucide-react-native";

import { colors, radius, spacing, shadow } from "@/src/theme";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { dataService } from "@/src/data/service";

const RESEND_TIMEOUT = 30; // seconds

export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  
  // Refs for OTP inputs
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const otpValue = otp.join("");
  const isOtpComplete = otpValue.length === 6;

  // Timer for resend
  useEffect(() => {
    if (sent && resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [sent, resendTimer]);

  // Success animation
  const triggerSuccess = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    });
  };

  // Shake animation for errors
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const routeAfterAuth = async (emailForSetup: string) => {
    try {
      const fresh = await dataService.getProfile();
      if (fresh?.name) {
        router.replace("/(tabs)");
        return;
      }
    } catch {}
    router.replace({
      pathname: "/(auth)/profile-setup",
      params: { email: emailForSetup },
    });
  };

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpError(null);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      // Focus last filled or next empty
      const lastIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const onVerifyOtp = async () => {
    if (!isOtpComplete) return;
    setOtpError(null);
    setVerifying(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error: e } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otpValue,
          type: "email",
        });
        if (e) throw e;
      }
      setVerified(true);
      triggerSuccess();
      setTimeout(() => {
        routeAfterAuth(email.trim().toLowerCase());
      }, 1000);
    } catch (e) {
      triggerShake();
      setOtpError("Invalid code. Please try again.");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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
        setResendTimer(RESEND_TIMEOUT);
        setCanResend(false);
      } else {
        // Demo mode
        router.push({
          pathname: "/(auth)/profile-setup",
          params: { email: email.trim().toLowerCase() },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  const onResend = () => {
    if (!canResend) return;
    setOtp(["", "", "", "", "", ""]);
    setOtpError(null);
    onSendLink();
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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={12}
            testID="email-back-btn"
          >
            <ArrowLeft size={22} color={colors.textMain} strokeWidth={2} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <Mail size={28} color={colors.primary} strokeWidth={2} />
          </View>

          {sent ? (
            // ===== OTP VERIFICATION VIEW =====
            <>
              {/* Success Celebration */}
              {verified && (
                <Animated.View 
                  style={[
                    styles.successBanner,
                    { 
                      transform: [{ scale: scaleAnim }],
                      opacity: opacityAnim,
                    }
                  ]}
                >
                  <Text style={styles.successEmoji}>🎉</Text>
                  <Text style={styles.successText}>You're in!</Text>
                </Animated.View>
              )}

              <Text style={styles.title}>
                {verified ? "Welcome back!" : "Enter verification code"}
              </Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{"\n"}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              {/* OTP Input Boxes */}
              <Animated.View 
                style={[
                  styles.otpContainer,
                  { transform: [{ translateX: shakeAnim }] }
                ]}
              >
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      otpError ? styles.otpBoxError : null,
                      verified ? styles.otpBoxSuccess : null,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!verifying && !verified}
                    testID={`otp-input-${index}`}
                  />
                ))}
              </Animated.View>

              {/* Error Message */}
              {otpError && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color={colors.error} strokeWidth={2} />
                  <Text style={styles.errorText}>{otpError}</Text>
                </View>
              )}

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  !isOtpComplete && styles.verifyBtnDisabled,
                  verified && styles.verifyBtnSuccess,
                ]}
                onPress={onVerifyOtp}
                disabled={!isOtpComplete || verifying || verified}
                activeOpacity={0.9}
                testID="email-verify-otp-btn"
              >
                {verified ? (
                  <>
                    <Check size={20} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.verifyBtnText}>Verified!</Text>
                  </>
                ) : verifying ? (
                  <Text style={styles.verifyBtnText}>Verifying...</Text>
                ) : (
                  <Text style={styles.verifyBtnText}>Verify Code</Text>
                )}
              </TouchableOpacity>

              {/* Resend Section */}
              <View style={styles.resendSection}>
                {canResend ? (
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={onResend}
                    disabled={loading}
                    testID="email-resend-btn"
                  >
                    <RefreshCw size={16} color={colors.accent} strokeWidth={2} />
                    <Text style={styles.resendBtnText}>
                      {loading ? "Sending..." : "Resend Code"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.timerRow}>
                    <Clock size={14} color={colors.textMuted} strokeWidth={2} />
                    <Text style={styles.timerText}>
                      Resend code in {resendTimer}s
                    </Text>
                  </View>
                )}
              </View>

              {/* Tip Box */}
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Tip:</Text> Check your spam folder 
                  if you don't see the email.
                </Text>
              </View>
            </>
          ) : (
            // ===== EMAIL INPUT VIEW =====
            <>
              <Text style={styles.title}>Sign in with Email</Text>
              <Text style={styles.subtitle}>
                We'll send you a 6-digit verification code.{"\n"}No password needed.
              </Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email address</Text>
                <TextInput
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError(null);
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textSubtle}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  style={[styles.input, error ? styles.inputError : null]}
                  testID="email-input"
                />
              </View>

              {/* Error */}
              {error && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color={colors.error} strokeWidth={2} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Demo Mode Notice */}
              {!isSupabaseConfigured && (
                <View style={styles.demoBox}>
                  <Text style={styles.demoText}>
                    🎭 Demo mode — we'll skip verification and take you directly to setup.
                  </Text>
                </View>
              )}

              <View style={{ flex: 1, minHeight: 40 }} />

              {/* Send Code Button */}
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  !isValid && styles.sendBtnDisabled,
                ]}
                onPress={onSendLink}
                disabled={!isValid || loading}
                activeOpacity={0.9}
                testID="email-continue-btn"
              >
                <Text style={styles.sendBtnText}>
                  {loading ? "Sending..." : "Send Verification Code"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  scroll: { 
    padding: spacing.xl, 
    flexGrow: 1 
  },
  
  // Back Button
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // Icon
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  
  // Typography
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textMain,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  emailHighlight: { 
    color: colors.primary, 
    fontWeight: "700" 
  },
  
  // Email Input
  inputContainer: {
    marginTop: spacing.xl,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textBody,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 58,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.textMain,
    fontWeight: "500",
  },
  inputError: {
    borderColor: colors.error,
  },
  
  // OTP Input
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xs,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: "700",
    color: colors.textMain,
    textAlign: "center",
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  otpBoxError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  otpBoxSuccess: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  
  // Error Box
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { 
    color: colors.error, 
    fontSize: 13, 
    fontWeight: "600",
    flex: 1,
  },
  
  // Verify Button
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    marginTop: spacing.xl,
    ...shadow.stickyCta,
  },
  verifyBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
  },
  verifyBtnSuccess: {
    backgroundColor: colors.success,
  },
  verifyBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  
  // Resend Section
  resendSection: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  resendBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accent,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timerText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
  
  // Tip Box
  tipBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  tipText: { 
    color: colors.textBody, 
    fontSize: 13, 
    fontWeight: "500", 
    lineHeight: 19 
  },
  tipBold: { 
    fontWeight: "700", 
    color: colors.primary 
  },
  
  // Demo Box
  demoBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  demoText: { 
    color: colors.textBody, 
    fontSize: 13, 
    fontWeight: "500" 
  },
  
  // Send Button
  sendBtn: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.stickyCta,
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
  },
  sendBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  
  // Success Banner
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.successLight,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.success,
  },
  successEmoji: {
    fontSize: 32,
  },
  successText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.success,
  },
});
