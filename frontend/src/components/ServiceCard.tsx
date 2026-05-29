import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Star, Clock, BadgeCheck } from "lucide-react-native";

import { colors, radius, shadow } from "@/src/theme";
import { Service } from "@/src/types";

interface Props {
  service: Service;
  onPress?: () => void;
  variant?: "wide" | "compact";
  testID?: string;
}

export const ServiceCard: React.FC<Props> = ({
  service,
  onPress,
  variant = "compact",
  testID,
}) => {
  if (variant === "wide") {
    return (
      <TouchableOpacity
        style={styles.wide}
        activeOpacity={0.85}
        onPress={onPress}
        testID={testID}
      >
        <Image source={{ uri: service.image }} style={styles.wideImage} />
        <View style={styles.wideBody}>
          <View style={styles.rowSpread}>
            <Text style={styles.wideTitle} numberOfLines={1}>
              {service.title}
            </Text>
            {service.topRated ? (
              <View style={styles.topRated}>
                <BadgeCheck size={12} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.topRatedText}>Top Rated</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.wideDesc} numberOfLines={2}>
            {service.description}
          </Text>
          <View style={styles.wideMeta}>
            <View style={styles.ratingPill}>
              <Star size={12} color={colors.star} fill={colors.star} />
              <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
              <Text style={styles.reviewText}>
                ({service.reviewCount > 999
                  ? `${(service.reviewCount / 1000).toFixed(1)}k`
                  : service.reviewCount})
              </Text>
            </View>
            <View style={styles.durationPill}>
              <Clock size={12} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.durationText}>{service.durationMins} min</Text>
            </View>
          </View>
          <View style={styles.wideFooter}>
            <Text style={styles.priceLabel}>Starts at</Text>
            <Text style={styles.priceValue}>₹{service.startingPrice}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.compact}
      activeOpacity={0.85}
      onPress={onPress}
      testID={testID}
    >
      <Image source={{ uri: service.image }} style={styles.compactImage} />
      <View style={styles.compactBody}>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {service.title}
        </Text>
        <View style={styles.ratingPill}>
          <Star size={12} color={colors.star} fill={colors.star} />
          <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
          <Text style={styles.reviewText}>({service.reviewCount})</Text>
        </View>
        <Text style={styles.compactPrice}>
          ₹{service.startingPrice}{" "}
          <Text style={styles.compactPriceFrom}>onwards</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  compact: {
    width: 200,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    marginRight: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  compactImage: { width: "100%", height: 120 },
  compactBody: { padding: 12 },
  compactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMain,
    marginBottom: 6,
    minHeight: 36,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 6,
  },
  compactPriceFrom: { fontSize: 11, fontWeight: "500", color: colors.textMuted },
  wide: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  wideImage: { width: "100%", height: 140 },
  wideBody: { padding: 14 },
  wideTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
    flex: 1,
    marginRight: 8,
  },
  wideDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 4 },
  wideMeta: { flexDirection: "row", marginTop: 10, gap: 8 },
  wideFooter: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 12,
    gap: 6,
  },
  priceLabel: { fontSize: 12, color: colors.textMuted },
  priceValue: { fontSize: 18, fontWeight: "700", color: colors.primary },
  rowSpread: { flexDirection: "row", alignItems: "center" },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
    marginLeft: 2,
  },
  reviewText: { fontSize: 11, color: colors.success, fontWeight: "500" },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  durationText: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  topRated: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  topRatedText: { fontSize: 11, fontWeight: "700", color: colors.primary },
});
