import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  Star,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle2,
  Umbrella,
  ThumbsUp,
  Clock,
  FileText,
  Headphones,
  AlertTriangle,
  Info,
  X as XIcon,
  Heart,
  Sparkles,
  Award,
  ShieldCheck,
} from "lucide-react-native";
import { colors, radius } from "@/src/theme";
import {
  ServiceVariant,
  ProcessStep,
  Review,
  FAQ,
  SafetyTip,
  GalleryImage,
  LoveUsItem,
} from "./types";

// ==================== VARIANT CARD ====================
interface VariantCardProps {
  variant: ServiceVariant;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  accentColor: string;
}

export const VariantCard: React.FC<VariantCardProps> = ({
  variant,
  quantity,
  onAdd,
  onRemove,
  accentColor,
}) => (
  <View style={styles.variantCard}>
    <Image
      source={{ uri: variant.image }}
      style={styles.variantImage}
      resizeMode="cover"
    />
    <Text style={styles.variantName}>{variant.name}</Text>
    <View style={styles.variantRating}>
      <Star size={12} color="#000" fill="#000" />
      <Text style={styles.variantRatingText}>
        {variant.rating} ({variant.reviews})
      </Text>
    </View>
    {variant.originalPrice && (
      <Text style={styles.variantOriginalPrice}>₹{variant.originalPrice}</Text>
    )}
    <Text style={styles.variantPrice}>₹{variant.price}</Text>
    {variant.duration && (
      <View style={styles.variantDuration}>
        <Clock size={10} color="#6B7280" />
        <Text style={styles.variantDurationText}>{variant.duration} mins</Text>
      </View>
    )}
    {quantity === 0 ? (
      <TouchableOpacity
        style={[styles.variantAddBtn, { borderColor: accentColor }]}
        onPress={onAdd}
      >
        <Text style={[styles.variantAddText, { color: accentColor }]}>Add</Text>
      </TouchableOpacity>
    ) : (
      <View style={[styles.variantQtyRow, { borderColor: accentColor }]}>
        <TouchableOpacity style={styles.variantQtyBtn} onPress={onRemove}>
          <Text style={[styles.variantQtyBtnText, { color: accentColor }]}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.variantQtyValue, { color: accentColor }]}>
          {quantity}
        </Text>
        <TouchableOpacity style={styles.variantQtyBtn} onPress={onAdd}>
          <Text style={[styles.variantQtyBtnText, { color: accentColor }]}>+</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

// ==================== PROCESS STEP ====================
interface ProcessStepProps {
  step: ProcessStep;
  isLast: boolean;
  darkMode?: boolean;
}

export const ProcessStepComponent: React.FC<ProcessStepProps> = ({
  step,
  isLast,
  darkMode = false,
}) => (
  <View style={styles.processStep}>
    <View style={styles.processStepLeft}>
      <View
        style={[
          styles.processStepNumber,
          darkMode && styles.processStepNumberDark,
        ]}
      >
        <Text
          style={[
            styles.processStepNumberText,
            darkMode && styles.processStepNumberTextDark,
          ]}
        >
          {step.step}
        </Text>
      </View>
      {!isLast && (
        <View
          style={[
            styles.processStepLine,
            darkMode && styles.processStepLineDark,
          ]}
        />
      )}
    </View>
    <View style={styles.processStepContent}>
      <Text
        style={[
          styles.processStepTitle,
          darkMode && styles.processStepTitleDark,
        ]}
      >
        {step.title}
      </Text>
      <Text
        style={[
          styles.processStepDesc,
          darkMode && styles.processStepDescDark,
        ]}
      >
        {step.description}
      </Text>
      {step.imageUrl ? (
        <Image
          source={{ uri: step.imageUrl }}
          style={styles.processStepImage}
          resizeMode="cover"
        />
      ) : null}
    </View>
  </View>
);

// ==================== REVIEW CARD ====================
interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const hasAvatar = !!review.avatar && review.avatar.trim() !== "";
  const initial = (review.name || "?").trim().charAt(0).toUpperCase();
  // Stable color from name
  const palette = ["#DB2777", "#0891B2", "#059669", "#D97706", "#7C3AED", "#2563EB"];
  const colorIdx =
    (review.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
    palette.length;
  const initBg = palette[colorIdx];
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {hasAvatar ? (
          <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
        ) : (
          <View
            style={[
              styles.reviewAvatar,
              {
                backgroundColor: initBg,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <Text style={styles.reviewInitial}>{initial}</Text>
          </View>
        )}
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewName}>{review.name}</Text>
          <View style={styles.reviewMeta}>
            <View style={styles.reviewStars}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  color={i < review.rating ? "#FBBF24" : "#E5E7EB"}
                  fill={i < review.rating ? "#FBBF24" : "#E5E7EB"}
                />
              ))}
            </View>
            <Text style={styles.reviewDate}>{review.date}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
      <TouchableOpacity style={styles.reviewHelpful}>
        <ThumbsUp size={14} color="#6B7280" />
        <Text style={styles.reviewHelpfulText}>Helpful ({review.helpful})</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==================== FAQ ITEM ====================
interface FAQItemProps {
  faq: FAQ;
}

export const FAQItem: React.FC<FAQItemProps> = ({ faq }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        {expanded ? (
          <ChevronUp size={20} color="#6B7280" />
        ) : (
          <ChevronDown size={20} color="#6B7280" />
        )}
      </View>
      {expanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
    </TouchableOpacity>
  );
};

// ==================== MFIXIT COVER PROMISE ====================
interface CoverPromiseProps {
  accentColor: string;
  features?: string[];
}

export const CoverPromise: React.FC<CoverPromiseProps> = ({
  accentColor,
  features,
}) => (
  <View style={styles.coverSection}>
    <View style={styles.coverHeader}>
      <Shield size={24} color={accentColor} />
      <Text style={styles.coverTitle}>
        <Text style={[styles.coverBrand, { color: accentColor }]}>Mfixit</Text>{" "}
        cover promise
      </Text>
    </View>
    {features ? (
      features.map((feature, index) => (
        <View key={index} style={styles.coverFeature}>
          <CheckCircle2 size={20} color="#6B7280" />
          <Text style={styles.coverFeatureText}>{feature}</Text>
        </View>
      ))
    ) : (
      <>
        <View style={styles.coverFeature}>
          <Shield size={20} color="#6B7280" />
          <Text style={styles.coverFeatureText}>Up to 30 days warranty</Text>
        </View>
        <View style={styles.coverFeature}>
          <Umbrella size={20} color="#6B7280" />
          <Text style={styles.coverFeatureText}>Up to ₹10,000 damage cover</Text>
        </View>
        <View style={styles.coverFeature}>
          <FileText size={20} color="#6B7280" />
          <Text style={styles.coverFeatureText}>Fixed rate card</Text>
        </View>
        <View style={styles.coverFeature}>
          <Headphones size={20} color="#6B7280" />
          <Text style={styles.coverFeatureText}>
            On call repair quote verification
          </Text>
        </View>
      </>
    )}
  </View>
);

// ==================== CART BAR ====================
interface CartBarProps {
  itemCount: number;
  total: number;
  accentColor: string;
  onViewCart: () => void;
}

export const CartBar: React.FC<CartBarProps> = ({
  itemCount,
  total,
  accentColor,
  onViewCart,
}) => (
  <View style={styles.cartBar}>
    <View>
      <Text style={styles.cartItemCount}>
        {itemCount} item{itemCount > 1 ? "s" : ""}
      </Text>
      <Text style={styles.cartTotal}>₹{total}</Text>
    </View>
    <TouchableOpacity
      style={[styles.viewCartBtn, { backgroundColor: accentColor }]}
      onPress={onViewCart}
    >
      <Text style={styles.viewCartText}>View Cart</Text>
    </TouchableOpacity>
  </View>
);

// ==================== INCLUSIONS/EXCLUSIONS ====================
interface InclusionsListProps {
  items: string[];
  type: "inclusion" | "exclusion";
}

export const InclusionsList: React.FC<InclusionsListProps> = ({ items, type }) => (
  <View style={styles.inclusionsList}>
    {items.map((item, index) => (
      <View key={index} style={styles.inclusionItem}>
        {type === "inclusion" ? (
          <CheckCircle2 size={16} color="#16A34A" />
        ) : (
          <XIcon size={16} color="#DC2626" />
        )}
        <Text style={styles.inclusionText}>{item}</Text>
      </View>
    ))}
  </View>
);

// ==================== BRANDS SECTION ====================
interface BrandsSectionProps {
  brands: string[];
}

export const BrandsSection: React.FC<BrandsSectionProps> = ({ brands }) => (
  <View style={styles.brandsSection}>
    <Text style={styles.sectionTitle}>We service all brands</Text>
    <View style={styles.brandsGrid}>
      {brands.map((brand, index) => (
        <View key={index} style={styles.brandCard}>
          <Text style={styles.brandText}>{brand}</Text>
        </View>
      ))}
    </View>
    <Text style={styles.brandsDisclaimer}>
      Logos & trademarks are used for illustrative purposes. We do not claim
      any affiliation with the respective brand.
    </Text>
  </View>
);

// ==================== SECTION DIVIDER ====================
export const SectionDivider = () => <View style={styles.sectionDivider} />;

// ==================== SAFETY TIPS SECTION ====================
interface SafetyTipsSectionProps {
  tips: SafetyTip[];
  title?: string;
}

export const SafetyTipsSection: React.FC<SafetyTipsSectionProps> = ({
  tips,
  title = "Safety Tips",
}) => {
  if (!tips || tips.length === 0) return null;
  return (
    <View style={styles.safetySection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {tips.map((tip, idx) => {
        const color = tip.color || "#F59E0B";
        const Icon =
          tip.icon === "check"
            ? CheckCircle2
            : tip.icon === "info"
            ? Info
            : tip.icon === "alert"
            ? AlertTriangle
            : Shield;
        return (
          <View key={idx} style={styles.safetyRow}>
            <View style={[styles.safetyDot, { backgroundColor: `${color}1A` }]}>
              <Icon size={16} color={color} />
            </View>
            <Text style={styles.safetyText}>{tip.text}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  // Variant Card
  variantCard: {
    width: 180,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    backgroundColor: "#FFF",
  },
  variantImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
  },
  variantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  variantRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  variantRatingText: {
    fontSize: 12,
    color: "#6B7280",
  },
  variantOriginalPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  variantDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  variantDurationText: {
    fontSize: 11,
    color: "#6B7280",
  },
  variantAddBtn: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  variantAddText: {
    fontSize: 14,
    fontWeight: "700",
  },
  variantQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 6,
  },
  variantQtyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  variantQtyBtnText: {
    fontSize: 18,
    fontWeight: "600",
  },
  variantQtyValue: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  
  // Process Step
  processStep: {
    flexDirection: "row",
    marginBottom: 4,
  },
  processStepLeft: {
    alignItems: "center",
    marginRight: 16,
  },
  processStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  processStepNumberDark: {
    borderColor: "#374151",
    backgroundColor: "#374151",
  },
  processStepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  processStepNumberTextDark: {
    color: "#FFF",
  },
  processStepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
    minHeight: 40,
  },
  processStepLineDark: {
    backgroundColor: "#374151",
  },
  processStepContent: {
    flex: 1,
    paddingBottom: 24,
  },
  processStepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  processStepTitleDark: {
    color: "#FFF",
  },
  processStepDesc: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  processStepImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginTop: 12,
  },
  processStepDescDark: {
    color: "#9CA3AF",
  },
  
  // Review Card
  reviewCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  reviewInitial: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  reviewComment: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewHelpful: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewHelpfulText: {
    fontSize: 13,
    color: "#6B7280",
  },
  
  // FAQ Item
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    paddingRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    lineHeight: 20,
  },
  
  // Cover Promise
  coverSection: {
    padding: 16,
  },
  coverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
  },
  coverBrand: {},
  coverFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  coverFeatureText: {
    fontSize: 15,
    color: "#000",
  },
  
  // Cart Bar
  cartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  cartItemCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  viewCartBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  
  // Inclusions List
  inclusionsList: {
    gap: 12,
  },
  inclusionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  inclusionText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
  
  // Brands Section
  brandsSection: {
    padding: 16,
    backgroundColor: "#F8FAFC",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
    marginBottom: 20,
  },
  brandsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  brandCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  brandText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  brandsDisclaimer: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  
  // Section Divider
  sectionDivider: {
    height: 8,
    backgroundColor: "#F3F4F6",
  },

  // Safety Tips
  safetySection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#FFF",
  },
  safetyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  safetyDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  // ----- DescriptionBlock -----
  descBlock: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    backgroundColor: "#FFF",
  },
  descShort: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 22,
  },
  descLong: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 6,
    lineHeight: 21,
  },
  // ----- GallerySection -----
  gallerySection: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  galleryScroll: {
    gap: 12,
    paddingRight: 16,
  },
  galleryCard: {
    width: 140,
    height: 170,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  galleryImage: { width: "100%", height: "100%" },
  galleryBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  galleryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  // ----- HighlightsSection -----
  highlightsSection: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  highlightsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  highlightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  highlightCard: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  highlightInner: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    minHeight: 96,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  highlightDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 16,
  },
});

// ==================== DESCRIPTION BLOCK ====================
interface DescriptionBlockProps {
  shortDescription?: string;
  description?: string;
}

export const DescriptionBlock: React.FC<DescriptionBlockProps> = ({
  shortDescription,
  description,
}) => {
  if (!shortDescription && !description) return null;
  return (
    <View style={styles.descBlock}>
      {shortDescription ? (
        <Text style={styles.descShort}>{shortDescription}</Text>
      ) : null}
      {description ? (
        <Text style={styles.descLong}>{description}</Text>
      ) : null}
    </View>
  );
};

// ==================== GALLERY SECTION ====================
interface GallerySectionProps {
  title?: string;
  defaultTitle?: string;
  images?: GalleryImage[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  title,
  defaultTitle = "Why customers love us",
  images,
}) => {
  if (!images || images.length === 0) return null;
  return (
    <View style={styles.gallerySection}>
      <Text style={styles.galleryTitle}>{title || defaultTitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryScroll}
      >
        {images.map((g, idx) => (
          <View key={idx} style={styles.galleryCard}>
            <Image
              source={{ uri: g.imageUrl }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
            {g.badge ? (
              <View style={styles.galleryBadge}>
                <Text style={styles.galleryBadgeText}>{g.badge}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ==================== HIGHLIGHTS / LOVE-US SECTION ====================
interface HighlightsSectionProps {
  title?: string;
  defaultTitle?: string;
  items?: LoveUsItem[];
}

function pickIcon(name?: string): any {
  switch ((name || "").toLowerCase()) {
    case "sparkles":
      return Sparkles;
    case "award":
      return Award;
    case "check":
      return CheckCircle2;
    case "shield":
      return ShieldCheck;
    case "star":
      return Star;
    case "heart":
    default:
      return Heart;
  }
}

export const HighlightsSection: React.FC<HighlightsSectionProps> = ({
  title,
  defaultTitle = "Why we are loved",
  items,
}) => {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.highlightsSection}>
      <Text style={styles.highlightsTitle}>{title || defaultTitle}</Text>
      <View style={styles.highlightsGrid}>
        {items.map((it, idx) => {
          const Icon = pickIcon(it.icon);
          const tint = it.color || "#DB2777";
          return (
            <View key={idx} style={styles.highlightCard}>
              <View style={styles.highlightInner}>
                <Icon
                  size={22}
                  color={tint}
                  fill={(it.icon || "").toLowerCase() === "heart" ? tint : undefined}
                />
                <Text style={styles.highlightTitle}>{it.title}</Text>
                {it.description ? (
                  <Text style={styles.highlightDesc}>{it.description}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};
