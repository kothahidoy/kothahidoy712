import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

import { colors, radius } from "@/src/theme";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  loading,
  disabled,
  style,
  testID,
}) => {
  const isDisabled = disabled || loading;
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.primaryLight
        : "transparent";
  const fg =
    variant === "primary" ? colors.primaryForeground : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.btn,
        size === "md" ? styles.md : styles.lg,
        { backgroundColor: bg },
        isDisabled && styles.disabled,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  md: { height: 44, paddingHorizontal: 18 },
  lg: { height: 54, paddingHorizontal: 24 },
  label: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  disabled: { opacity: 0.55 },
});
