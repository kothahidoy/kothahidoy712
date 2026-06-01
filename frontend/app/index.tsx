import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { MfixitLogo } from "@/src/components/MfixitLogo";
import { useSession } from "@/src/context/SessionContext";
import { colors } from "@/src/theme";

export default function Splash() {
  const { isAuthenticated, isLoading, hasSession, profile } = useSession();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, scale]);

  if (!isLoading) {
    // Decide destination:
    //  - Authenticated with a complete profile → main tabs
    //  - Authenticated via Supabase but no profile row yet → profile setup
    //  - Anonymous → welcome
    let target = "/(auth)/welcome" as const;
    if (isAuthenticated) {
      target = (profile?.name ? "/(tabs)" : hasSession ? "/(auth)/profile-setup" : "/(tabs)") as typeof target;
    }
    return <Redirect href={target} />;
  }

  return (
    <LinearGradient
      colors={[colors.primary, "#1e40af", "#172554"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: fade, transform: [{ scale }] },
        ]}
        testID="splash-logo"
      >
        <MfixitLogo size={120} variant="dark" tagline />
      </Animated.View>
      <Animated.View style={[styles.dotsRow, { opacity: fade }]}>
        <View style={[styles.dot, { opacity: 0.4 }]} />
        <View style={[styles.dot, { opacity: 0.7 }]} />
        <View style={styles.dot} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoWrap: { alignItems: "center" },
  dotsRow: {
    position: "absolute",
    bottom: 80,
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
});
