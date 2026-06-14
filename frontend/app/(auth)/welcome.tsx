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

const HERO =
  "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBob21lJTIwcmVwYWlyJTIwdGVjaG5pY2lhbnxlbnwwfHx8fDE3ODAwNzU4MzF8MA&ixlib=rb-4.1.0&q=85&w=900";

export default function Welcome() {
  const router = useRouter();
  const { hasSession, profile } = useSession();

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
            {/* Title with lightning bolt */}
            <View style={styles.titleRow}>
              <Zap size={28} color="#F97316" fill="#F97316" strokeWidth={2} />
              <Text style={styles.title}>
                AC, Plumbing, Cleaning{"\n"}Fixed in 30 Minutes
              </Text>
            </View>

            {/* Orange subtitle */}
            <Text style={styles.subtitleOrange}>
              Same-day service. No hidden charges.
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              Book a verified pro in 60 seconds — trusted by your neighbors.
            </Text>

            {/* Limited slots banner */}
            <View style={styles.limitedSlots}>
              <View style={styles.redDot} />
              <Text style={styles.limitedSlotsText}>
                Limited slots available today • Next: 2:30 PM
              </Text>
            </View>

            {/* Trust items - vertical list */}
            <View style={styles.trustList}>
              <View style={styles.trustItem}>
                <Users size={20} color="#F97316" strokeWidth={2} />
                <Text style={styles.trustItemText}>10,000+ happy homes in Durgapur</Text>
              </View>
              <View style={styles.trustItem}>
                <Star size={20} color="#F97316" fill="#F97316" strokeWidth={2} />
                <Text style={styles.trustItemText}>4.8 average rating</Text>
              </View>
              <View style={styles.trustItem}>
                <Shield size={20} color="#F97316" strokeWidth={2} />
                <Text style={styles.trustItemText}>30-day service warranty</Text>
              </View>
            </View>

            {/* Sit back banner */}
            <View style={styles.sitBackBanner}>
              <Text style={styles.sitBackText}>
                Sit back, we'll take care of it 👍
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            {/* Google - Recommended */}
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
                <Text style={styles.btnLabel}>Continue with Google</Text>
                <ChevronRight size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity
              style={styles.whiteBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/(auth)/phone")}
              testID="welcome-phone-btn"
            >
              <View style={styles.phoneIconCircle}>
                <Phone size={18} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.btnLabel}>Continue with Phone</Text>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Email - Dark style */}
            <TouchableOpacity
              style={styles.darkBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/(auth)/email")}
              testID="welcome-email-btn"
            >
              <View style={styles.emailIconCircle}>
                <Mail size={18} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.darkBtnLabel}>Continue with Email</Text>
              <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Explore without signing in */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.exploreBtn}
              onPress={() => router.push("/(auth)/profile-setup")}
              testID="welcome-skip-btn"
            >
              <Clock size={18} color="#F97316" strokeWidth={2} />
              <Text style={styles.exploreText}>
                Explore services without signing in
              </Text>
            </TouchableOpacity>

            {/* Provider Login */}
            <TouchableOpacity
              style={styles.providerLogin}
              activeOpacity={0.85}
              onPress={() => router.push("/(provider)/login")}
              testID="welcome-provider-btn"
            >
              <Wrench size={18} color="#F97316" strokeWidth={2} />
              <Text style={styles.providerLoginText}>Provider Login</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
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
  brandText: { fontWeight: "800", color: colors.textMain, fontSize: 15, letterSpacing: -0.3 },
  brandSub: { fontSize: 10, color: colors.textMuted, fontWeight: "600", marginTop: -1 },
  content: { flexGrow: 1, justifyContent: "flex-end", paddingHorizontal: 20 },
  heroCopy: { marginBottom: 16 },
  
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
    flex: 1,
  },
  subtitleOrange: {
    color: "#F97316",
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
  
  limitedSlots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  limitedSlotsText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  
  trustList: {
    marginTop: 16,
    gap: 12,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trustItemText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  
  sitBackBanner: {
    marginTop: 16,
    backgroundColor: "rgba(249, 115, 22, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  sitBackText: {
    color: "#F97316",
    fontSize: 15,
    fontWeight: "700",
  },
  
  actions: { paddingBottom: 20, gap: 10 },
  
  googleBtnRecommended: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F97316",
    overflow: "hidden",
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F97316",
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
  btnLabel: { fontSize: 16, fontWeight: "700", color: colors.textMain, flex: 1 },
  
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
  darkBtnLabel: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", flex: 1 },
  
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  exploreText: {
    color: "#F97316",
    fontSize: 15,
    fontWeight: "700",
  },
  
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
