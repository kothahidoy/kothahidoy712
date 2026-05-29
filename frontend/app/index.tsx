import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Wrench } from "lucide-react-native";

import { useSession } from "@/src/context/SessionContext";
import { colors } from "@/src/theme";

export default function Splash() {
  const { isAuthenticated, isLoading } = useSession();
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
    return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/welcome"} />;
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
        <View style={styles.logoBubble}>
          <Wrench size={48} color={colors.primary} strokeWidth={2.5} />
        </View>
        <Text style={styles.brand}>Mfixit</Text>
        <Text style={styles.tag}>Trusted Home Services at Your Doorstep</Text>
      </Animated.View>
      <Animated.View style={[styles.dotsRow, { opacity: fade }]}>
        <View style={[styles.dot, { opacity: 0.4 }]} />
        <View style={[styles.dot, { opacity: 0.7 }]} />
        <View style={styles.dot} />
      </Animated.View>
    </LinearGradient>
  );
}

// Suppress the unused-import warning when expo-image is not used.
void Image;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoWrap: { alignItems: "center" },
  logoBubble: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1,
  },
  tag: {
    color: "#DBEAFE",
    fontSize: 14,
    marginTop: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
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
