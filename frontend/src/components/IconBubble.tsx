import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Lucide from "lucide-react-native";

import { colors, radius } from "@/src/theme";

type IconName = keyof typeof Lucide;

interface Props {
  name: IconName | string;
  bg: string;
  size?: number;
  color?: string;
  onPress?: () => void;
  testID?: string;
}

export const IconBubble: React.FC<Props> = ({
  name,
  bg,
  size = 28,
  color = colors.primary,
  onPress,
  testID,
}) => {
  const IconComponent =
    (Lucide as unknown as Record<string, React.ComponentType<{ size: number; color: string; strokeWidth: number }>>)[
      name as string
    ] ?? Lucide.Sparkles;

  const inner = (
    <View
      style={[styles.bubble, { backgroundColor: bg }]}
      testID={testID}
    >
      <IconComponent size={size} color={color} strokeWidth={2} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
};

interface LabelProps extends Props {
  label: string;
}

export const CategoryTile: React.FC<LabelProps> = ({
  name,
  bg,
  label,
  onPress,
  testID,
}) => {
  const IconComponent =
    (Lucide as unknown as Record<string, React.ComponentType<{ size: number; color: string; strokeWidth: number }>>)[
      name as string
    ] ?? Lucide.Sparkles;

  return (
    <TouchableOpacity
      style={styles.tile}
      activeOpacity={0.75}
      onPress={onPress}
      testID={testID}
    >
      <View style={[styles.tileIcon, { backgroundColor: bg }]}>
        <IconComponent size={26} color={colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bubble: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  tile: {
    alignItems: "center",
    width: "31%",
    marginBottom: 16,
  },
  tileIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMain,
    textAlign: "center",
  },
});
