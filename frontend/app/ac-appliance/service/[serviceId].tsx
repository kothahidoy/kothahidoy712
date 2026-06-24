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
  Wind,
  Thermometer,
  Gauge,
  Settings,
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

// AC & APPLIANCE LAYOUT - AC unit types, warranty info, service checklist
export default function ACApplianceServiceDetailScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedACType, setSelectedACType] = useState("split");

  const { loading, error, serviceData } = useServiceDetail(
    serviceId || "",
    "ac-appliance"
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
          <ActivityIndicator size="large" color="#0891B2" />
          <Text style={styles.loadingText}>Loading AC service...</Text>
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
      {/* Header with Cyan AC Theme */}
      <View style={[styles.header, { backgroundColor: "#ECFEFF" }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Wind size={16} color="#0891B2" />
            <Text style={styles.headerTitle}>{serviceData.categoryName}</Text>
          </View>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#0891B2" />
            <Text style={[styles.headerSlotText, { color: "#0891B2" }]}>
              Earliest: Tomorrow, 10 AM
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
          {/* Warranty Badge */}
          <View style={styles.warrantyBadge}>
            <Settings size={16} color="#0891B2" />
            <Text style={styles.warrantyBadgeText}>
              30-Day Warranty • All Brands Serviced
            </Text>
          </View>
        </View>

        {/* AC Type Selector - Unique to AC */}
        <View style={styles.acTypeSelector}>
          <Text style={styles.acTypeSelectorTitle}>Select AC type</Text>
          <View style={styles.acTypeOptions}>
            <TouchableOpacity
              style={[
                styles.acTypeOption,
                selectedACType === "split" && styles.acTypeOptionSelected,
              ]}
              onPress={() => setSelectedACType("split")}
            >
              <Wind
                size={24}
                color={selectedACType === "split" ? "#FFF" : "#0891B2"}
              />
              <Text
                style={[
                  styles.acTypeOptionText,
                  selectedACType === "split" && styles.acTypeOptionTextSelected,
                ]}
              >
                Split AC
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.acTypeOption,
                selectedACType === "window" && styles.acTypeOptionSelected,
              ]}
              onPress={() => setSelectedACType("window")}
            >
              <Thermometer
                size={24}
                color={selectedACType === "window" ? "#FFF" : "#0891B2"}
              />
              <Text
                style={[
                  styles.acTypeOptionText,
                  selectedACType === "window" && styles.acTypeOptionTextSelected,
                ]}
              >
                Window AC
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionDivider />

        {/* Service Checklist - Unique Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service includes</Text>
          <View style={styles.checklistGrid}>
            <View style={styles.checklistItem}>
              <View style={[styles.checklistIcon, { backgroundColor: "#ECFEFF" }]}>
                <Wind size={18} color="#0891B2" />
              </View>
              <Text style={styles.checklistText}>Filter Clean</Text>
            </View>
            <View style={styles.checklistItem}>
              <View style={[styles.checklistIcon, { backgroundColor: "#ECFEFF" }]}>
                <Gauge size={18} color="#0891B2" />
              </View>
              <Text style={styles.checklistText}>Gas Check</Text>
            </View>
            <View style={styles.checklistItem}>
              <View style={[styles.checklistIcon, { backgroundColor: "#ECFEFF" }]}>
                <Thermometer size={18} color="#0891B2" />
              </View>
              <Text style={styles.checklistText}>Cooling Test</Text>
            </View>
            <View style={styles.checklistItem}>
              <View style={[styles.checklistIcon, { backgroundColor: "#ECFEFF" }]}>
                <Settings size={18} color="#0891B2" />
              </View>
              <Text style={styles.checklistText}>Deep Clean</Text>
            </View>
          </View>
        </View>

        <SectionDivider />

        {/* Service Variants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose service</Text>
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
                accentColor="#0891B2"
              />
            ))}
          </ScrollView>
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
        <CoverPromise accentColor="#0891B2" features={serviceData.coverFeatures} />

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
          accentColor="#0891B2"
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
  warrantyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFEFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  warrantyBadgeText: { fontSize: 12, fontWeight: "600", color: "#0891B2" },
  acTypeSelector: { paddingHorizontal: 16, paddingBottom: 20 },
  acTypeSelectorTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 12 },
  acTypeOptions: { flexDirection: "row", gap: 12 },
  acTypeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#ECFEFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#A5F3FC",
    gap: 8,
  },
  acTypeOptionSelected: {
    backgroundColor: "#0891B2",
    borderColor: "#0891B2",
  },
  acTypeOptionText: { fontSize: 14, fontWeight: "600", color: "#0891B2" },
  acTypeOptionTextSelected: { color: "#FFF" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#000", marginBottom: 20 },
  checklistGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  checklistItem: {
    width: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checklistIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistText: { fontSize: 14, fontWeight: "500", color: "#374151" },
  variantsContainer: { gap: 12 },
  reviewsHeader: { marginBottom: 16 },
  reviewsSummary: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  reviewsSummaryText: { fontSize: 14, color: "#6B7280" },
});
