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
  Droplets,
  AlertCircle,
  Wrench,
  Phone,
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

// PLUMBER LAYOUT - Emergency badges, problem types, parts included focus
export default function PlumberServiceDetailScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { loading, error, serviceData } = useServiceDetail(
    serviceId || "",
    "plumber"
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
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading plumber service...</Text>
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
      {/* Header with Blue Plumber Theme */}
      <View style={[styles.header, { backgroundColor: "#F0F9FF" }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Droplets size={16} color="#0284C7" />
            <Text style={styles.headerTitle}>{serviceData.categoryName}</Text>
          </View>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#0284C7" />
            <Text style={[styles.headerSlotText, { color: "#0284C7" }]}>
              Same day service available
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
          {/* Emergency Badge - Unique to Plumber */}
          <View style={styles.emergencyBadge}>
            <AlertCircle size={16} color="#DC2626" />
            <Text style={styles.emergencyBadgeText}>
              Emergency Service • Same Day Available
            </Text>
          </View>
        </View>

        {/* Quick Problem Types - Unique Section */}
        <View style={styles.problemSection}>
          <Text style={styles.problemTitle}>Common issues we fix</Text>
          <View style={styles.problemGrid}>
            <View style={styles.problemCard}>
              <Droplets size={18} color="#0284C7" />
              <Text style={styles.problemText}>Leaky Taps</Text>
            </View>
            <View style={styles.problemCard}>
              <Wrench size={18} color="#0284C7" />
              <Text style={styles.problemText}>Pipe Repair</Text>
            </View>
            <View style={styles.problemCard}>
              <AlertCircle size={18} color="#0284C7" />
              <Text style={styles.problemText}>Blockages</Text>
            </View>
            <View style={styles.problemCard}>
              <Droplets size={18} color="#0284C7" />
              <Text style={styles.problemText}>Tank Issues</Text>
            </View>
          </View>
        </View>

        <SectionDivider />

        {/* Service Variants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select service</Text>
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
                accentColor="#0284C7"
              />
            ))}
          </ScrollView>
        </View>

        <SectionDivider />

        {/* Emergency Hotline - Unique */}
        <View style={[styles.section, { backgroundColor: "#FEF2F2" }]}>
          <View style={styles.emergencyHotline}>
            <Phone size={24} color="#DC2626" />
            <View style={styles.hotlineText}>
              <Text style={styles.hotlineTitle}>Emergency? Call now!</Text>
              <Text style={styles.hotlineNumber}>1800-XXX-XXXX (Toll Free)</Text>
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

        {/* Brands */}
        {serviceData.brands && (
          <>
            <BrandsSection brands={serviceData.brands} />
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
        <CoverPromise accentColor="#0284C7" features={serviceData.coverFeatures} />

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
          accentColor="#0284C7"
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
  emergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  emergencyBadgeText: { fontSize: 12, fontWeight: "600", color: "#DC2626" },
  problemSection: { paddingHorizontal: 16, paddingBottom: 20 },
  problemTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 12 },
  problemGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  problemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F0F9FF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  problemText: { fontSize: 13, fontWeight: "500", color: "#0284C7" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#000", marginBottom: 20 },
  variantsContainer: { gap: 12 },
  emergencyHotline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  hotlineText: { flex: 1 },
  hotlineTitle: { fontSize: 16, fontWeight: "700", color: "#DC2626" },
  hotlineNumber: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  reviewsHeader: { marginBottom: 16 },
  reviewsSummary: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  reviewsSummaryText: { fontSize: 14, color: "#6B7280" },
});
