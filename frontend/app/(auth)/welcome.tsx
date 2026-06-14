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
  Clock,
  Mail,
  Phone,
  Shield,
  Star,
  Users,
  Wrench,
  Zap,
} from "lucide-react-native";

import { MfixitLogo } from "@/src/components/MfixitLogo";
import { useSession } from "@/src/context/SessionContext";
import { colors, radius, spacing, shadow } from "@/src/theme";
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
        colors={["transparent", "rgba(15,23,42,0.75)", "rgba(15,23,42,0.98)"]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Brand Badge */}
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <MfixitLogo size={28} variant="dark" showWordmark={false} />
            <View>
              <Text style={styles.brandName}>Mfixit</Text>
              <Text style={styles.brandTagline}>Verified pros · 24×7</Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Copy Section */}
          <View style={styles.heroCopy}>
            {/* Main Headline with Emoji */}
            <View style={styles.headlineRow}>
              <Zap size={32} color={colors.accent} fill={colors.accent} />
              <Text style={styles.title}>
                AC, Plumbing, Cleaning{"\n"}Fixed in 30 Minutes
              </Text>
            </View>
            
            {/* Value Proposition Hook */}
            <Text style={styles.valueHook}>
              Same-day service. No hidden charges.
            </Text>
            
            {/* Supporting Text */}
            <Text style={styles.subtitle}>
              Book a verified pro in 60 seconds — trusted by your neighbors.
            </Text>

            {/* Urgency Trigger */}
            <View style={styles.urgencyBadge}>
              <View style={styles.urgencyDot} />
              <Text style={styles.urgencyText}>
                Limited slots available today • Next: 2:30 PM
              </Text>
            </View>

            {/* Trust Indicators with Local Context */}
            <View style={styles.trustSection}>
              <TrustBadge 
                icon={Users} 
                text="10,000+ happy homes in Durgapur" 
              />
              <TrustBadge 
                icon={Star} 
                text="4.8 average rating" 
                iconFill
              />
              <TrustBadge 
                icon={Shield} 
                text="30-day service warranty" 
              />
            </View>

            {/* Friendly Microcopy */}
            <View style={styles.microCopyBox}>
              <Text style={styles.microCopyText}>
                Sit back, we'll take care of it 👍
              </Text>
            </View>
          </View>

          {/* CTA Buttons Section */}
          <View style={styles.actions}>
            {/* Primary CTA - Google (Most Important) */}
            <View style={styles.googleContainer}>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>✨ Recommended</Text>
              </View>
              <TouchableOpacity
                style={styles.googleBtn}
                activeOpacity={0.9}
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
                <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Secondary CTA - Phone */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.9}
              onPress={() => router.push("/(auth)/phone")}
              testID="welcome-phone-btn"
            >
              <View style={styles.iconCircle}>
                <Phone size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.secondaryLabel}>Continue with Phone</Text>
              <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>

            {/* Tertiary CTA - Email */}
            <TouchableOpacity
              style={styles.tertiaryBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/(auth)/email")}
              testID="welcome-email-btn"
            >
              <View style={styles.iconCircleOutline}>
                <Mail size={18} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.tertiaryLabel}>Continue with Email</Text>
              <ChevronRight size={20} color="rgba(255,255,255,0.5)" strokeWidth={2} />
            </TouchableOpacity>

            {/* Explore Without Login - Better Copy */}
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/(auth)/profile-setup")}
              testID="welcome-skip-btn"
            >
              <Clock size={16} color={colors.accent} strokeWidth={2} />
              <Text style={styles.exploreText}>
                Explore services without signing in
              </Text>
            </TouchableOpacity>

            {/* Provider Login */}
            <TouchableOpacity
              style={styles.providerBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/(provider)/login")}
              testID="welcome-provider-btn"
            >
              <Wrench size={16} color={colors.accent} strokeWidth={2} />
              <Text style={styles.providerText}>Provider Login</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.4)" strokeWidth={2} />
            </TouchableOpacity>

            {/* Disclaimer */}
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

// Trust Badge Component
function TrustBadge({ 
  icon: Icon, 
  text, 
  iconFill = false 
}: { 
  icon: any; 
  text: string; 
  iconFill?: boolean;
}) {
  return (
    <View style={styles.trustBadge}>
      <View style={styles.trustIconWrap}>
        <Icon 
          size={14} 
          color={colors.accent} 
          strokeWidth={2} 
          fill={iconFill ? colors.accent : "transparent"}
        />
      </View>
      <Text style={styles.trustText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "#0F172A" 
  },
  hero: { 
    position: "absolute", 
    width: "100%", 
    height: "55%" 
  },
  gradient: { 
    position: "absolute", 
    width: "100%", 
    height: "100%" 
  },
  safe: { 
    flex: 1, 
    justifyContent: "space-between" 
  },
  
  // Brand
  brandRow: { 
    paddingHorizontal: spacing.xl, 
    paddingTop: spacing.sm 
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.97)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    ...shadow.card,
  },
  brandName: { 
    fontWeight: "800", 
    color: colors.textMain, 
    fontSize: 16, 
    letterSpacing: -0.3 
  },
  brandTagline: { 
    fontSize: 11, 
    color: colors.textMuted, 
    fontWeight: "600", 
    marginTop: -1 
  },
  
  // Content
  content: { 
    flexGrow: 1, 
    justifyContent: "flex-end", 
    paddingHorizontal: spacing.xl 
  },
  
  // Hero Copy
  heroCopy: { 
    marginBottom: spacing.xl 
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
    flex: 1,
  },
  valueHook: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  subtitle: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
    fontWeight: "500",
  },
  
  // Urgency Badge
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  urgencyText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "700",
  },
  
  // Trust Section
  trustSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  trustIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  trustText: { 
    color: "#FFFFFF", 
    fontSize: 14, 
    fontWeight: "600",
    opacity: 0.95,
  },
  
  // Microcopy
  microCopyBox: {
    marginTop: spacing.lg,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.25)",
  },
  microCopyText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  
  // Actions
  actions: { 
    paddingBottom: spacing.xl, 
    gap: spacing.md 
  },
  
  // Google Button Container with Recommended Badge
  googleContainer: {
    position: "relative",
  },
  recommendedBadge: {
    position: "absolute",
    top: -10,
    left: spacing.xl,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  
  // Google Button (Primary - Most Prominent)
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 58,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    ...shadow.cardHover,
  },
  googleIcon: { 
    width: 24, 
    height: 24 
  },
  googleLabel: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: colors.textMain, 
    flex: 1 
  },
  
  // Secondary Button (Phone)
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: colors.textMain, 
    flex: 1 
  },
  
  // Tertiary Button (Email)
  tertiaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    height: 54,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  iconCircleOutline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  tertiaryLabel: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#FFFFFF", 
    flex: 1,
    opacity: 0.9,
  },
  
  // Explore Button (More Visible)
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  exploreText: { 
    color: colors.accent, 
    fontSize: 15, 
    fontWeight: "700",
  },
  
  // Provider Login
  providerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  providerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    flex: 1,
  },
  
  // Disclaimer
  disclaimer: {
    color: "#64748B",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  disclaimerLink: { 
    color: "#94A3B8", 
    fontWeight: "600" 
  },
});
