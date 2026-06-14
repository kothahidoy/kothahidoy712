import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  BadgeCheck,
  ChevronRight,
  ShieldCheck,
  Wrench,
} from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { MfixitLogo } from "@/src/components/MfixitLogo";
import { useSession } from "@/src/context/SessionContext";
import { colors, radius } from "@/src/theme";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { notify } from "@/src/utils/dialogs";

const HERO =
  "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBob21lJTIwcmVwYWlyJTIwdGVjaG5pY2lhbnxlbnwwfHx8fDE3ODAwNzU4MzF8MA&ixlib=rb-4.1.0&q=85&w=900";

export default function Welcome() {
  const router = useRouter();
  const { hasSession, profile } = useSession();

  // Magic-link / OAuth redirects land here with the session in the URL
  // hash. Once Supabase has parsed it and our context has updated, push
  // the user into the app immediately — no extra tap required.
  useEffect(() => {
    if (hasSession) {
      router.replace(profile?.name ? "/(tabs)" : "/(auth)/profile-setup");
    }
  }, [hasSession, profile?.name, router]);

  const onGoogleSignIn = async () => {
    if (!isSupabaseConfigured || !supabase) {
      notify("Google sign-in", "Configure Supabase Google provider first.");
      return;
    }
    const redirectTo =
      Platform.OS === "web" && typeof window !== "undefined"
        ? `${window.location.origin}/`
        : Linking.createURL("/");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      notify(
        "Google sign-in failed",
        error.message.includes("provider is not enabled")
          ? "Please enable Google provider in your Supabase dashboard first."
          : error.message,
      );
    }
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: HERO }} style={styles.hero} />
      <LinearGradient
        colors={["transparent", "rgba(15,23,42,0.7)", "rgba(15,23,42,0.95)"]}
        style={styles.gradient}
      />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadgeWrap}>
            <MfixitLogo size={32} variant="dark" showWordmark={false} />
            <View>
              <Text style={styles.brandText}>Mfixit</Text>
              <Text style={styles.brandSub}>Verified pros · 24×7</Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCopy}>
            <Text style={styles.title}>
              Trusted home services{"\n"}at your doorstep
            </Text>
            <Text style={styles.subtitle}>
              Verified pros for electrical, plumbing, AC, cleaning, salon & more
              — book in 60 seconds.
            </Text>

            <View style={styles.trustRow}>
              <View style={styles.trustChip}>
                <BadgeCheck size={14} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.trustText}>Verified pros</Text>
              </View>
              <View style={styles.trustChip}>
                <ShieldCheck size={14} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.trustText}>30-day warranty</Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Continue with Email"
              onPress={() => router.push("/(auth)/email")}
              testID="welcome-email-btn"
            />

            <TouchableOpacity
              style={styles.googleBtn}
              activeOpacity={0.85}
              onPress={onGoogleSignIn}
              testID="welcome-google-btn"
            >
              <Image
                source={{
                  uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png",
                }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleLabel}>Continue with Google</Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/(auth)/phone")}
              testID="welcome-phone-btn"
            >
              <View style={styles.phoneIconWrap}>
                <Text style={styles.phoneIcon}>📱</Text>
              </View>
              <Text style={styles.googleLabel}>Continue with Phone</Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.skip}
              onPress={() => router.push("/(auth)/profile-setup")}
              testID="welcome-skip-btn"
            >
              <Text style={styles.skipText}>
                Explore without signing in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.providerLogin}
              activeOpacity={0.85}
              onPress={() => router.push("/(provider)/login")}
              testID="welcome-provider-btn"
            >
              <Wrench size={16} color={colors.primary} />
              <Text style={styles.providerLoginText}>Provider Login</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By continuing you agree to our{" "}
              <Text style={styles.disclaimerLink}>Terms</Text> &{" "}
              <Text style={styles.disclaimerLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F172A" },
  hero: { position: "absolute", width: "100%", height: "55%" },
  gradient: { position: "absolute", width: "100%", height: "100%" },
  safe: { flex: 1, justifyContent: "space-between" },
  brandRow: { paddingHorizontal: 20, paddingTop: 8 },
  brandBadgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  brandText: { fontWeight: "800", color: colors.textMain, fontSize: 15, letterSpacing: -0.3 },
  brandSub: { fontSize: 10, color: colors.textMuted, fontWeight: "600", marginTop: -1 },
  content: { flexGrow: 1, justifyContent: "flex-end", paddingHorizontal: 20 },
  heroCopy: { marginBottom: 28 },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitle: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  trustRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  trustChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  trustText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  actions: { paddingBottom: 24, gap: 12 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 54,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    gap: 12,
  },
  phoneIconWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneIcon: { fontSize: 18 },
  googleIcon: { width: 20, height: 20 },
  googleLabel: { fontSize: 16, fontWeight: "700", color: colors.textMain, flex: 1 },
  skip: { alignItems: "center", paddingVertical: 10 },
  skipText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", opacity: 0.85 },
  providerLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  providerLoginText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  disclaimer: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
  disclaimerLink: { color: "#FFFFFF", fontWeight: "600" },
});
