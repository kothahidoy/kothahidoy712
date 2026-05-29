import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "lucide-react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors } from "@/src/theme";

export default function BookingConfirmation() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 8, useNativeDriver: true }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.center}>
        <Animated.View style={[styles.tickBubble, { transform: [{ scale }] }]}>
          <Check size={48} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity }]}>
          Booking confirmed!
        </Animated.Text>
        <Animated.Text style={[styles.sub, { opacity }]}>
          We&apos;ve sent your booking to verified Mfixit professionals nearby.
          You&apos;ll receive a confirmation shortly.
        </Animated.Text>

        <Animated.View
          style={[styles.codeBox, { opacity }]}
          testID="confirm-id"
        >
          <Text style={styles.codeLabel}>Booking ID</Text>
          <Text style={styles.codeText}>{(id ?? "").slice(0, 12).toUpperCase()}</Text>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="View my bookings"
          onPress={() => router.replace("/(tabs)/bookings")}
          testID="confirm-view-bookings"
        />
        <TouchableOpacity
          style={styles.secondary}
          activeOpacity={0.8}
          onPress={() => router.replace("/(tabs)")}
          testID="confirm-home"
        >
          <Text style={styles.secondaryText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  tickBubble: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.success,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textMain,
    marginTop: 28,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  codeBox: {
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 4,
  },
  actions: { padding: 20, gap: 12 },
  secondary: { alignItems: "center", paddingVertical: 10 },
  secondaryText: { color: colors.textMuted, fontWeight: "700", fontSize: 14 },
});
