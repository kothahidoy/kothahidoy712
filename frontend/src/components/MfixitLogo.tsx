import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { colors } from "@/src/theme";

interface Props {
  size?: number;
  variant?: "light" | "dark"; // light = white surface, dark = blue surface
  showWordmark?: boolean;
  tagline?: boolean;
}

/**
 * Mfixit brand mark.
 * - Rounded blue badge with a stylized "M" formed by two diagonals that
 *   double as crossed tools (wrench + screwdriver) hinted with a spark dot.
 * - Drop-shadow handled by parent for native, embedded for web.
 */
export const MfixitLogo: React.FC<Props> = ({
  size = 96,
  variant = "light",
  showWordmark = true,
  tagline = false,
}) => {
  const onLight = variant === "light";
  const badgeFill = onLight ? "url(#mfixGrad)" : "#FFFFFF";
  const strokeColor = onLight ? "#FFFFFF" : colors.primary;
  const sparkColor = onLight ? "#FBBF24" : "#F59E0B";
  const wordmarkColor = onLight ? colors.textMain : "#FFFFFF";
  const taglineColor = onLight ? colors.textMuted : "rgba(255,255,255,0.85)";

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="mfixGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#3B82F6" />
            <Stop offset="1" stopColor="#1D4ED8" />
          </LinearGradient>
        </Defs>

        {/* Rounded badge */}
        <Rect x="2" y="2" width="96" height="96" rx="26" fill={badgeFill} />

        {/* Left leg of the "M" — stylised as a wrench shaft */}
        <Path
          d="M26 76 L26 38 Q26 30 34 30 L40 30 L50 56"
          stroke={strokeColor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Right leg of the "M" — stylised as a screwdriver tip */}
        <Path
          d="M74 76 L74 38 Q74 30 66 30 L60 30 L50 56"
          stroke={strokeColor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Spark / fix dot at the apex */}
        <Path
          d="M50 22 L52 28 L58 28 L53 32 L55 38 L50 34 L45 38 L47 32 L42 28 L48 28 Z"
          fill={sparkColor}
        />
      </Svg>

      {showWordmark ? (
        <Text style={[styles.wordmark, { color: wordmarkColor, fontSize: size * 0.5 }]}>
          Mfix<Text style={{ color: onLight ? colors.primary : sparkColor }}>it</Text>
        </Text>
      ) : null}

      {tagline ? (
        <Text style={[styles.tag, { color: taglineColor }]}>
          Trusted Home Services at Your Doorstep
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  wordmark: {
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 12,
  },
  tag: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
    marginTop: 8,
  },
});
