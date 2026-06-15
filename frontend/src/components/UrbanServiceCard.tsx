import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Minus, Plus, Star } from "lucide-react-native";
import { colors, radius } from "@/src/theme";

export interface UrbanServiceCardProps {
  id: string;
  title: string;
  rating: number;
  reviewCount: string;
  price: number;
  originalPrice?: number;
  duration?: number;
  image: string;
  description?: string;
  onAdd?: (id: string, quantity: number) => void;
  onPress?: (id: string) => void;
}

export default function UrbanServiceCard({
  id,
  title,
  rating,
  reviewCount,
  price,
  originalPrice,
  duration,
  image,
  description,
  onAdd,
  onPress,
}: UrbanServiceCardProps) {
  const [quantity, setQuantity] = useState(0);

  const handleAdd = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    onAdd?.(id, newQty);
  };

  const handleIncrement = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    onAdd?.(id, newQty);
  };

  const handleDecrement = () => {
    const newQty = Math.max(0, quantity - 1);
    setQuantity(newQty);
    onAdd?.(id, newQty);
  };

  const formatReviewCount = (count: string) => {
    return count;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(id)}
      activeOpacity={0.95}
    >
      <View style={styles.cardContent}>
        {/* Left side - Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Right side - Details */}
        <View style={styles.detailsContainer}>
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <Star size={12} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>{rating.toFixed(2)}</Text>
            <Text style={styles.reviewCount}>({formatReviewCount(reviewCount)} reviews)</Text>
          </View>

          {/* Price & Duration Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price}</Text>
            {originalPrice && originalPrice > price && (
              <Text style={styles.originalPrice}>₹{originalPrice}</Text>
            )}
            {duration && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.duration}>{duration} mins</Text>
              </>
            )}
          </View>

          {/* Description if provided */}
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}

          {/* View Details Link */}
          <TouchableOpacity onPress={() => onPress?.(id)}>
            <Text style={styles.viewDetails}>View details</Text>
          </TouchableOpacity>
        </View>

        {/* Add Button / Quantity Counter */}
        <View style={styles.addButtonContainer}>
          {quantity === 0 ? (
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleDecrement}
              >
                <Minus size={14} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleIncrement}
              >
                <Plus size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Dotted Separator */}
      <View style={styles.dottedSeparator} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 6,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMain,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMain,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  dotSeparator: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: 6,
  },
  duration: {
    fontSize: 12,
    color: colors.textMuted,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 6,
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  addButtonContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 24,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  quantityButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    minWidth: 24,
    textAlign: "center",
  },
  dottedSeparator: {
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: "dashed",
  },
});
