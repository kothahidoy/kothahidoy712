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
  Star,
  Clock,
  Bug,
  Shield,
  CheckCircle2,
  Baby,
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

// PEST CONTROL LAYOUT - Pest types, treatment plans, safety certifications
export default function PestControlServiceDetailScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedPest, setSelectedPest] = useState("cockroach");

  const { loading, error, serviceData } = useServiceDetail(
    serviceId || "",
    "pest-control"
  );

  const pestTypes = [
    { id: "cockroach", name: "Cockroach", icon: "🪳" },
    { id: "ant", name: "Ants", icon: "🐜" },
    { id: "mosquito", name: "Mosquito", icon: "🦟" },
    { id: "termite", name: "Termite", icon: "🐛" },
    { id: "rodent", name: "Rodent", icon: "🐀" },
    { id: "bedbug", name: "Bed Bugs", icon: "🛐" },
  ];

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
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading pest control...</Text>
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
      {/* Header with Purple Pest Control Theme */}
      <View style={[styles.header, { backgroundColor: "#F5F3FF" }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Bug size={16} color="#7C3AED" />
            <Text style={styles.headerTitle}>Pest Control</Text>
          </View>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#7C3AED" />
            <Text style={[styles.headerSlotText, { color: "#7C3AED" }]}>
              90-day warranty
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
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
          {/* Safety Badge */}
          <View style={styles.safetyBadge}>
            <Shield size={16} color="#7C3AED" />
            <Text style={styles.safetyBadgeText}>
              {serviceData.subtitle || `Child & Pet Safe • Certified Chemicals`}
            </Text>
          </View>
        </View>

        {/* Pest Type Selector - Unique to Pest Control */}
        <View style={styles.pestSection}>
          <Text style={styles.pestTitle}>Select pest type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pestOptions}
          >
            {pestTypes.map((pest) => (
              <TouchableOpacity
                key={pest.id}
                style={[
                  styles.pestOption,
                  selectedPest === pest.id && styles.pestOptionSelected,
                ]}
                onPress={() => setSelectedPest(pest.id)}
              >
                <Text style={styles.pestIcon}>{pest.icon}</Text>
                <Text
                  style={[
                    styles.pestOptionText,
                    selectedPest === pest.id && styles.pestOptionTextSelected,
                  ]}
                >
                  {pest.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <SectionDivider />

        {/* Safety Features - Unique Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safe for your family</Text>
          <View style={styles.safetyGrid}>
            <View style={styles.safetyCard}>
              <Baby size={24} color="#7C3AED" />
              <Text style={styles.safetyCardTitle}>Child Safe</Text>
              <Text style={styles.safetyCardDesc}>Non-toxic chemicals</Text>
            </View>
            <View style={styles.safetyCard}>
              <Shield size={24} color="#7C3AED" />
              <Text style={styles.safetyCardTitle}>Pet Friendly</Text>
              <Text style={styles.safetyCardDesc}>Odorless formula</Text>
            </View>
            <View style={styles.safetyCard}>
              <CheckCircle2 size={24} color="#7C3AED" />
              <Text style={styles.safetyCardTitle}>Certified</Text>
              <Text style={styles.safetyCardDesc}>Govt. approved</Text>
            </View>
          </View>
        </View>

        <SectionDivider />

        {/* Service Variants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose treatment</Text>
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
                accentColor="#7C3AED"
              />
            ))}
          </ScrollView>
        </View>

        <SectionDivider />

        {/* Our Process */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatment process</Text>
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
                {serviceData.rating} • {serviceData.reviewCount}
              </Text>
            </View>
          </View>
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </View>

        <SectionDivider />

        {/* Cover Promise */}
        <CoverPromise accentColor="#7C3AED" features={serviceData.coverFeatures} />

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
          accentColor="#7C3AED"
          onViewCart={() => router.push("/cart")}
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
  safetyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  safetyBadgeText: { fontSize: 12, fontWeight: "600", color: "#7C3AED" },
  pestSection: { paddingHorizontal: 16, paddingBottom: 20 },
  pestTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 12 },
  pestOptions: { gap: 10 },
  pestOption: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DDD6FE",
    gap: 4,
  },
  pestOptionSelected: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  pestIcon: { fontSize: 24 },
  pestOptionText: { fontSize: 12, fontWeight: "600", color: "#7C3AED" },
  pestOptionTextSelected: { color: "#FFF" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#000", marginBottom: 20 },
  safetyGrid: { flexDirection: "row", gap: 12 },
  safetyCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
  },
  safetyCardTitle: { fontSize: 13, fontWeight: "700", color: "#000", marginTop: 8 },
  safetyCardDesc: { fontSize: 11, color: "#6B7280", marginTop: 4, textAlign: "center" },
  variantsContainer: { gap: 12 },
  reviewsHeader: { marginBottom: 16 },
  reviewsSummary: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  reviewsSummaryText: { fontSize: 14, color: "#6B7280" },
});
