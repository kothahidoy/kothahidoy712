import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  ChevronRight,
  Wrench,
  Star,
  Users,
  Shield,
  Zap,
  Phone,
  Mail,
  Clock,
  Sparkles,
} from "lucide-react-native";

import { MfixitLogo } from "@/src/components/MfixitLogo";
import { useSession } from "@/src/context/SessionContext";
import { colors, radius } from "@/src/theme";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { notify } from "@/src/utils/dialogs";

// ─────────────────────────────────────────────────────────────────────
// Editable Welcome-screen config (populated from /api/admin/cms/welcome-screen)
// ─────────────────────────────────────────────────────────────────────
type WelcomeCfg = {
  hero_image_url: string;
  hero_image_enabled: boolean;
  brand_name: string;
  brand_subtitle: string;
  brand_badge_enabled: boolean;
  title_text: string;
  title_color: string;
  title_enabled: boolean;
  subtitle_text: string;
  subtitle_color: string;
  subtitle_enabled: boolean;
  description_text: string;
  description_color: string;
  description_enabled: boolean;
  trust_1_text: string;
  trust_1_enabled: boolean;
  trust_2_text: string;
  trust_2_enabled: boolean;
  trust_3_text: string;
  trust_3_enabled: boolean;
  trust_text_color: string;
  sit_back_text: string;
  sit_back_color: string;
  sit_back_enabled: boolean;
  google_btn_label: string;
  google_btn_enabled: boolean;
  phone_btn_label: string;
  phone_btn_enabled: boolean;
  email_btn_label: string;
  email_btn_enabled: boolean;
  explore_btn_label: string;
  explore_btn_color: string;
  explore_btn_enabled: boolean;
  provider_btn_label: string;
  provider_btn_enabled: boolean;
};

const DEFAULTS: WelcomeCfg = {
  hero_image_url:
    "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBob21lJTIwcmVwYWlyJTIwdGVjaG5pY2lhbnxlbnwwfHx8fDE3ODAwNzU4MzF8MA&ixlib=rb-4.1.0&q=85&w=900",
  hero_image_enabled: true,
  brand_name: "Mfixit",
  brand_subtitle: "Verified pros · 24×7",
  brand_badge_enabled: true,
  title_text: "AC, Plumbing, Cleaning\nFixed in 30 Minutes",
  title_color: "#FFFFFF",
  title_enabled: true,
  subtitle_text: "Same-day service. No hidden charges.",
  subtitle_color: "#2563EB",
  subtitle_enabled: true,
  description_text:
    "Book a verified pro in 60 seconds — trusted by your neighbors.",
  description_color: "#CBD5E1",
  description_enabled: true,
  trust_1_text: "10,000+ happy homes in Durgapur",
  trust_1_enabled: true,
  trust_2_text: "4.8 average rating",
  trust_2_enabled: true,
  trust_3_text: "30-day service warranty",
  trust_3_enabled: true,
  trust_text_color: "#FFFFFF",
  sit_back_text: "Sit back, we'll take care of it 👍",
  sit_back_color: "#2563EB",
  sit_back_enabled: true,
  google_btn_label: "Continue with Google",
  google_btn_enabled: true,
  phone_btn_label: "Continue with Phone",
  phone_btn_enabled: true,
  email_btn_label: "Continue with Email",
  email_btn_enabled: true,
  explore_btn_label: "Explore services without signing in",
  explore_btn_color: "#2563EB",
  explore_btn_enabled: true,
  provider_btn_label: "Provider Login",
  provider_btn_enabled: true,
};

// Compute API base once (relative on web, env on native)
const API_BASE = (() => {
  if (typeof window !== "undefined") return "";
  return process.env.EXPO_PUBLIC_BACKEND_URL || "";
})();

export default function Welcome() {
  const router = useRouter();
  const { hasSession, profile } = useSession();
  const [cfg, setCfg] = useState<WelcomeCfg>(DEFAULTS);

  // Fetch admin-editable config once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/cms/welcome-screen`, {
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data && typeof data === "object") {
          setCfg({ ...DEFAULTS, ...data });
        }
      } catch {
        /* keep defaults on failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const anyAuthOption = useMemo(
    () =>
      cfg.google_btn_enabled ||
      cfg.phone_btn_enabled ||
      cfg.email_btn_enabled ||
      cfg.explore_btn_enabled ||
      cfg.provider_btn_enabled,
    [cfg],
  );

  return (
    <View style={styles.root}>
      {cfg.hero_image_enabled && !!cfg.hero_image_url ? (
        <Image source={{ uri: cfg.hero_image_url }} style={styles.hero} />
      ) : null}
      <LinearGradient
        colors={["transparent", "rgba(15,23,42,0.7)", "rgba(15,23,42,0.95)"]}
        style={styles.gradient}
      />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {cfg.brand_badge_enabled ? (
          <View style={styles.brandRow}>
            <View style={styles.brandBadgeWrap}>
              <MfixitLogo size={32} variant="dark" showWordmark={false} />
              <View>
                <Text style={styles.brandText}>{cfg.brand_name}</Text>
                <Text style={styles.brandSub}>{cfg.brand_subtitle}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View />
        )}

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCopy}>
            {/* Title with lightning bolt */}
            {cfg.title_enabled ? (
              <View style={styles.titleRow}>
                <Zap
                  size={28}
                  color={colors.primary}
                  fill={colors.primary}
                  strokeWidth={2}
                />
                <Text style={[styles.title, { color: cfg.title_color }]}>
                  {cfg.title_text}
                </Text>
              </View>
            ) : null}

            {/* Subtitle */}
            {cfg.subtitle_enabled ? (
              <Text
                style={[styles.subtitleBlue, { color: cfg.subtitle_color }]}
              >
                {cfg.subtitle_text}
              </Text>
            ) : null}

            {/* Description */}
            {cfg.description_enabled ? (
              <Text
                style={[styles.description, { color: cfg.description_color }]}
              >
                {cfg.description_text}
              </Text>
            ) : null}

            {/* Trust items */}
            {cfg.trust_1_enabled || cfg.trust_2_enabled || cfg.trust_3_enabled ? (
              <View style={styles.trustList}>
                {cfg.trust_1_enabled ? (
                  <View style={styles.trustItem}>
                    <Users
                      size={20}
                      color={colors.primary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.trustItemText,
                        { color: cfg.trust_text_color },
                      ]}
                    >
                      {cfg.trust_1_text}
                    </Text>
                  </View>
                ) : null}
                {cfg.trust_2_enabled ? (
                  <View style={styles.trustItem}>
                    <Star
                      size={20}
                      color={colors.primary}
                      fill={colors.primary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.trustItemText,
                        { color: cfg.trust_text_color },
                      ]}
                    >
                      {cfg.trust_2_text}
                    </Text>
                  </View>
                ) : null}
                {cfg.trust_3_enabled ? (
                  <View style={styles.trustItem}>
                    <Shield
                      size={20}
                      color={colors.primary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.trustItemText,
                        { color: cfg.trust_text_color },
                      ]}
                    >
                      {cfg.trust_3_text}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Sit back banner */}
            {cfg.sit_back_enabled ? (
              <View style={styles.sitBackBanner}>
                <Text
                  style={[styles.sitBackText, { color: cfg.sit_back_color }]}
                >
                  {cfg.sit_back_text}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            {/* Google */}
            {cfg.google_btn_enabled ? (
              <TouchableOpacity
                style={styles.googleBtnRecommended}
                activeOpacity={0.85}
                onPress={onGoogleSignIn}
                testID="welcome-google-btn"
              >
                <View style={styles.recommendedBadge}>
                  <Sparkles size={12} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
                <View style={styles.googleBtnContent}>
                  <Image
                    source={{
                      uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png",
                    }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.btnLabel}>{cfg.google_btn_label}</Text>
                  <ChevronRight size={20} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ) : null}

            {/* Phone */}
            {cfg.phone_btn_enabled ? (
              <TouchableOpacity
                style={styles.whiteBtn}
                activeOpacity={0.85}
                onPress={() => router.push("/(auth)/phone")}
                testID="welcome-phone-btn"
              >
                <View style={styles.phoneIconCircle}>
                  <Phone size={18} color="#FFFFFF" strokeWidth={2} />
                </View>
                <Text style={styles.btnLabel}>{cfg.phone_btn_label}</Text>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}

            {/* Email */}
            {cfg.email_btn_enabled ? (
              <TouchableOpacity
                style={styles.darkBtn}
                activeOpacity={0.85}
                onPress={() => router.push("/(auth)/email")}
                testID="welcome-email-btn"
              >
                <View style={styles.emailIconCircle}>
                  <Mail size={18} color="#FFFFFF" strokeWidth={2} />
                </View>
                <Text style={styles.darkBtnLabel}>{cfg.email_btn_label}</Text>
                <ChevronRight size={20} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}

            {/* Explore without signing in */}
            {cfg.explore_btn_enabled ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.exploreBtn}
                onPress={() => router.push("/(auth)/profile-setup")}
                testID="welcome-skip-btn"
              >
                <Clock
                  size={18}
                  color={cfg.explore_btn_color}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.exploreText,
                    { color: cfg.explore_btn_color },
                  ]}
                >
                  {cfg.explore_btn_label}
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Provider Login */}
            {cfg.provider_btn_enabled ? (
              <TouchableOpacity
                style={styles.providerLogin}
                activeOpacity={0.85}
                onPress={() => router.push("/(provider)/login")}
                testID="welcome-provider-btn"
              >
                <Wrench size={18} color={colors.primary} strokeWidth={2} />
                <Text style={styles.providerLoginText}>
                  {cfg.provider_btn_label}
                </Text>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}

            {/* Fallback if admin disabled every auth option */}
            {!anyAuthOption ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.exploreBtn}
                onPress={() => router.push("/(auth)/profile-setup")}
              >
                <Clock size={18} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.exploreText, { color: colors.primary }]}>
                  Continue
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F172A" },
  hero: { position: "absolute", width: "100%", height: "45%" },
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
  brandText: {
    fontWeight: "800",
    color: colors.textMain,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: -1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
  },
  heroCopy: { marginBottom: 16 },

  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
    flex: 1,
  },
  subtitleBlue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  description: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  trustList: { marginTop: 16, gap: 12 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  trustItemText: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" },

  sitBackBanner: {
    marginTop: 16,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  sitBackText: { color: colors.primary, fontSize: 15, fontWeight: "700" },

  actions: { paddingBottom: 20, gap: 10 },

  googleBtnRecommended: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: "hidden",
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -1,
  },
  recommendedText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  googleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: 20,
    gap: 14,
  },
  googleIcon: { width: 24, height: 24 },
  btnLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
    flex: 1,
  },

  whiteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 20,
    gap: 14,
  },
  phoneIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },

  darkBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(51, 65, 85, 0.8)",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  emailIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
  },
  darkBtnLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },

  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  exploreText: { color: colors.primary, fontSize: 15, fontWeight: "700" },

  providerLogin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(51, 65, 85, 0.6)",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  providerLoginText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
});
