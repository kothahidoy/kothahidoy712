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
  Sparkles,
  Heart,
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
  SectionDivider,
  useServiceDetail,
} from "@/src/components/ServiceDetail";

// SALON WOMEN LAYOUT - Beauty focus, before/after gallery style, luxe design
export default function SalonWomenServiceDetailScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { loading, error, serviceData } = useServiceDetail(
    serviceId || "",
    "salon-women"
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
          <ActivityIndicator size="large" color="#DB2777" />
          <Text style={styles.loadingText}>Loading beauty service...</Text>
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
          <Text style={styles.errorText}>{error || "Service not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayedReviews = showAllReviews
    ? serviceData.reviews
    : serviceData.reviews.slice(0, 2);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header with Rose Pink Theme */}
      <View style={[styles.header, { backgroundColor: "#FDF2F8" }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Sparkles size={16} color="#DB2777" />
            <Text style={styles.headerTitle}>{serviceData.categoryName}</Text>
          </View>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#DB2777" />
            <Text style={[styles.headerSlotText, { color: "#DB2777" }]}>
              Next available: Today, 5 PM
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
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.serviceTitle}>{serviceData.title}</Text>
          <View style={styles.serviceRating}>
            <Star size={16} color="#000" fill="#000" />
            <Text style={styles.serviceRatingText}>
              {serviceData.rating} ({serviceData.reviewCount} reviews)
            </Text>
          </View>
          {/* Beautician Badge */}
          <View style={styles.beauticianBadge}>
            <Award size={16} color="#DB2777" />
            <Text style={styles.beauticianBadgeText}>
              Certified Beauticians • Premium Skincare
            </Text>
          </View>
        </View>

        {/* Beauty Results Preview - Unique Section */}
        <View style={styles.resultsSection}>
          <Text style={styles.resultsSectionTitle}>Glow like never before</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.resultsScroll}
          >
            <View style={styles.resultCard}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80" }}
                style={styles.resultImage}
              />
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Radiant Skin</Text>
              </View>
            </View>
            <View style={styles.resultCard}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=200&q=80" }}
                style={styles.resultImage}
              />
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Smooth Finish</Text>
              </View>
            </View>
            <View style={styles.resultCard}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=200&q=80" }}
                style={styles.resultImage}
              />
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>Natural Glow</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        <SectionDivider />

        {/* Service Variants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose your package</Text>
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
                accentColor="#DB2777"
              />
            ))}
          </ScrollView>
        </View>

        <SectionDivider />

        {/* Why Women Love Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why women love us</Text>
          <View style={styles.loveGrid}>
            <View style={styles.loveCard}>
              <Heart size={24} color="#DB2777" fill="#DB2777" />
              <Text style={styles.loveTitle}>4.9★ Rating</Text>
              <Text style={styles.loveDesc}>100K+ happy customers</Text>
            </View>
            <View style={styles.loveCard}>
              <Sparkles size={24} color="#F59E0B" />
              <Text style={styles.loveTitle}>Premium Only</Text>
              <Text style={styles.loveDesc}>VLCC, O3+ products</Text>
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
        {serviceData.inclusions && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's included</Text>
              <InclusionsList items={serviceData.inclusions} type="inclusion" />
            </View>
            <SectionDivider />
          </>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
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
        </View>

        <SectionDivider />

        {/* Cover Promise */}
        <CoverPromise accentColor="#DB2777" features={serviceData.coverFeatures} />

        <SectionDivider />

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>
          {serviceData.faqs.map((faq) => (
            <FAQItem key={faq.id} faq={faq} />
          ))}
        </View>

        <View style={{ height: getCartItemCount() > 0 ? 100 : 40 }} />
      </ScrollView>

      {getCartItemCount() > 0 && (
        <CartBar
          itemCount={getCartItemCount()}
          total={getCartTotal()}
          accentColor="#DB2777"
          onViewCart={() => router.push("/booking/new")}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontSize: 16, color: "#6B7280" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { fontSize: 16, color: "#6B7280", textAlign: "center" },
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
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  headerSlot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerSlotText: { fontSize: 12 },
  headerRight: { flexDirection: "row", gap: 8 },
  scrollView: { flex: 1 },
  titleSection: { padding: 16, paddingBottom: 12 },
  serviceTitle: { fontSize: 24, fontWeight: "800", color: "#000", marginBottom: 8 },
  serviceRating: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  serviceRatingText: { fontSize: 14, color: "#6B7280", textDecorationLine: "underline" },
  beauticianBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDF2F8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  beauticianBadgeText: { fontSize: 12, fontWeight: "600", color: "#DB2777" },
  resultsSection: { paddingHorizontal: 16, paddingBottom: 20 },
  resultsSectionTitle: { fontSize: 18, fontWeight: "700", color: "#000", marginBottom: 16 },
  resultsScroll: { gap: 12 },
  resultCard: { width: 140, position: "relative" },
  resultImage: { width: 140, height: 180, borderRadius: 12, backgroundColor: "#F3F4F6" },
  resultBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(219, 39, 119, 0.9)",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  resultBadgeText: { fontSize: 11, fontWeight: "600", color: "#FFF" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#000", marginBottom: 20 },
  variantsContainer: { gap: 12 },
  loveGrid: { flexDirection: "row", gap: 12 },
  loveCard: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FDF2F8",
    borderRadius: 16,
  },
  loveTitle: { fontSize: 15, fontWeight: "700", color: "#000", marginTop: 12 },
  loveDesc: { fontSize: 12, color: "#6B7280", marginTop: 4, textAlign: "center" },
  reviewsHeader: { marginBottom: 16 },
  reviewsSummary: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  reviewsSummaryText: { fontSize: 14, color: "#6B7280" },
});
