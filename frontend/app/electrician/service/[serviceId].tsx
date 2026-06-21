import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  X,
  Search,
  Star,
  Clock,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Wrench,
  Award,
} from "lucide-react-native";
import {
  VariantCard,
  ProcessStepComponent,
  ReviewCard,
  FAQItem,
  CoverPromise,
  CartBar,
  InclusionsList,
  BrandsSection,
  SectionDivider,
  useServiceDetail,
} from "@/src/components/ServiceDetail";

// ELECTRICIAN LAYOUT - Focus on safety badges, wiring diagrams style, technical details
export default function ElectricianServiceDetailScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { loading, error, serviceData } = useServiceDetail(
    serviceId || "",
    "electrician"
  );

  const handleAddToCart = (variantId: string) =>
    setCart((prev) => ({ ...prev, [variantId]: (prev[variantId] || 0) + 1 }));

  const handleRemoveFromCart = (variantId: string) =>
    setCart((prev) => {
      const newQty = (prev[variantId] || 0) - 1;
      if (newQty <= 0) {
        const { [variantId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [variantId]: newQty };
    });

  const getCartTotal = () =>
    Object.entries(cart).reduce((total, [id, qty]) => {
      const variant = serviceData?.variants.find((v) => v.id === id);
      return total + (variant?.price || 0) * qty;
    }, 0);

  const getCartItemCount = () =>
    Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !serviceData) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error || "Service not found"}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayedReviews = showAllReviews
    ? serviceData.reviews
    : serviceData.reviews.slice(0, 2);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header with Green Electrician Theme */}
      <View style={[styles.header, { backgroundColor: serviceData.categoryBgColor }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Zap size={16} color={serviceData.categoryColor} />
            <Text style={styles.headerTitle}>{serviceData.categoryName}</Text>
          </View>
          <View style={styles.headerSlot}>
            <Clock size={12} color={serviceData.categoryColor} />
            <Text
              style={[styles.headerSlotText, { color: serviceData.categoryColor }]}
            >
              Earliest slot: Today, 2:00 PM
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Search size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <X size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title Section with Safety Badge */}
        <View style={styles.titleSection}>
          <Text style={styles.serviceTitle}>{serviceData.title}</Text>
          <View style={styles.serviceRating}>
            <Star size={16} color="#000" fill="#000" />
            <Text style={styles.serviceRatingText}>
              {serviceData.rating} ({serviceData.reviewCount} reviews)
            </Text>
          </View>
          {/* Safety Certification Badge - Unique to Electrician */}
          <View style={styles.safetyBadge}>
            <Shield size={16} color="#059669" />
            <Text style={styles.safetyBadgeText}>
              ISI Certified • Safety Verified Electricians
            </Text>
          </View>
        </View>

        {/* Service Variants */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.variantsContainer}
        >
          {serviceData.variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              quantity={cart[variant.id] || 0}
              onAdd={() => handleAddToCart(variant.id)}
              onRemove={() => handleRemoveFromCart(variant.id)}
              accentColor={serviceData.categoryColor}
            />
          ))}
        </ScrollView>

        <SectionDivider />

        {/* Electrical Safety Tips - Unique Section */}
        <View style={styles.section}>
          <View style={styles.safetyTipsHeader}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Electrical Safety Tips</Text>
          </View>
          <View style={styles.safetyTipsList}>
            <View style={styles.safetyTip}>
              <View style={[styles.safetyTipIcon, { backgroundColor: "#FEF3C7" }]}>
                <Zap size={14} color="#D97706" />
              </View>
              <Text style={styles.safetyTipText}>
                Always turn off main switch before inspection
              </Text>
            </View>
            <View style={styles.safetyTip}>
              <View style={[styles.safetyTipIcon, { backgroundColor: "#DCFCE7" }]}>
                <CheckCircle2 size={14} color="#16A34A" />
              </View>
              <Text style={styles.safetyTipText}>
                Our technicians carry voltage testers
              </Text>
            </View>
            <View style={styles.safetyTip}>
              <View style={[styles.safetyTipIcon, { backgroundColor: "#DBEAFE" }]}>
                <Shield size={14} color="#2563EB" />
              </View>
              <Text style={styles.safetyTipText}>
                Earthing check included in all services
              </Text>
            </View>
          </View>
        </View>

        <SectionDivider />

        {/* Our Process */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our process</Text>
          {serviceData.process.map((step, index) => (
            <ProcessStepComponent
              key={step.step}
              step={step}
              isLast={index === serviceData.process.length - 1}
            />
          ))}
        </View>

        <SectionDivider />

        {/* What's Included */}
        {serviceData.inclusions && serviceData.inclusions.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's included</Text>
              <InclusionsList items={serviceData.inclusions} type="inclusion" />
            </View>
            <SectionDivider />
          </>
        )}

        {/* What's Excluded */}
        {serviceData.exclusions && serviceData.exclusions.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's excluded</Text>
              <InclusionsList items={serviceData.exclusions} type="exclusion" />
            </View>
            <SectionDivider />
          </>
        )}

        {/* Brands We Service */}
        {serviceData.brands && serviceData.brands.length > 0 && (
          <>
            <BrandsSection brands={serviceData.brands} />
            <SectionDivider />
          </>
        )}

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Customer reviews</Text>
            <View style={styles.reviewsSummary}>
              <Star size={18} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.reviewsSummaryText}>
                {serviceData.rating} • {serviceData.reviewCount} reviews
              </Text>
            </View>
          </View>
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {serviceData.reviews.length > 2 && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setShowAllReviews(!showAllReviews)}
            >
              <Text
                style={[styles.showMoreText, { color: serviceData.categoryColor }]}
              >
                {showAllReviews
                  ? "Show less"
                  : `View all ${serviceData.reviews.length} reviews`}
              </Text>
              {showAllReviews ? (
                <ChevronUp size={18} color={serviceData.categoryColor} />
              ) : (
                <ChevronDown size={18} color={serviceData.categoryColor} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <SectionDivider />

        {/* Mfixit Cover Promise */}
        <CoverPromise
          accentColor={serviceData.categoryColor}
          features={serviceData.coverFeatures}
        />

        <SectionDivider />

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          {serviceData.faqs.map((faq) => (
            <FAQItem key={faq.id} faq={faq} />
          ))}
        </View>

        <View style={{ height: getCartItemCount() > 0 ? 100 : 40 }} />
      </ScrollView>

      {/* Cart Bar */}
      {getCartItemCount() > 0 && (
        <CartBar
          itemCount={getCartItemCount()}
          total={getCartTotal()}
          accentColor={serviceData.categoryColor}
          onViewCart={() => router.push("/booking/new")}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { fontSize: 16, color: "#6B7280" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  errorText: { fontSize: 16, color: "#6B7280", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#059669",
    borderRadius: 8,
  },
  retryText: { color: "#FFF", fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  headerSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  headerSlotText: { fontSize: 12 },
  headerRight: { flexDirection: "row", gap: 8 },
  scrollView: { flex: 1 },
  titleSection: { padding: 16, paddingBottom: 12 },
  serviceTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    marginBottom: 8,
  },
  serviceRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  serviceRatingText: {
    fontSize: 14,
    color: "#6B7280",
    textDecorationLine: "underline",
  },
  safetyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  safetyBadgeText: { fontSize: 12, fontWeight: "600", color: "#059669" },
  variantsContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
    marginBottom: 20,
  },
  safetyTipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  safetyTipsList: { gap: 12 },
  safetyTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  safetyTipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyTipText: { fontSize: 14, color: "#374151", flex: 1 },
  reviewsHeader: { marginBottom: 16 },
  reviewsSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  reviewsSummaryText: { fontSize: 14, color: "#6B7280" },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
  },
  showMoreText: { fontSize: 14, fontWeight: "600" },
});
