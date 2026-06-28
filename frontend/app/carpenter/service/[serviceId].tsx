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
  Hammer,
  Ruler,
  TreePine,
  Layers,
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
  DescriptionBlock,
  GallerySection,
  HighlightsSection,
} from "@/src/components/ServiceDetail";

// CARPENTER LAYOUT - Material options, design gallery, measurements focus
export default function CarpenterServiceDetailScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState("plywood");

  const { loading, error, serviceData } = useServiceDetail(
    serviceId || "",
    "carpenter"
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
          <ActivityIndicator size="large" color="#B45309" />
          <Text style={styles.loadingText}>Loading carpenter service...</Text>
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
      {/* Header with Brown Carpenter Theme */}
      <View style={[styles.header, { backgroundColor: "#FEF3C7" }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Hammer size={16} color="#B45309" />
            <Text style={styles.headerTitle}>{serviceData.categoryName}</Text>
          </View>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#B45309" />
            <Text style={[styles.headerSlotText, { color: "#B45309" }]}>
              Free measurement visit
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
          {/* Craftsman Badge */}
          <View style={styles.craftsmanBadge}>
            <Hammer size={16} color="#B45309" />
            <Text style={styles.craftsmanBadgeText}>
              {serviceData.subtitle || `Expert Craftsmen • Quality Materials`}
            </Text>
          </View>
        </View>

        {/* Admin-controllable: short + long description */}
        <DescriptionBlock
          shortDescription={serviceData.shortDescription}
          description={serviceData.description}
        />

        {/* Admin-controllable: image gallery */}
        <GallerySection
          title={serviceData.galleryTitle}
          defaultTitle="Why customers love us"
          images={serviceData.gallery}
        />

        {/* Admin-controllable: highlights / why we are loved */}
        <HighlightsSection
          title={serviceData.loveUsTitle}
          defaultTitle="Why customers choose us"
          items={serviceData.loveUs}
        />

        {/* Material Selector - Unique to Carpenter */}
        <View style={styles.materialSection}>
          <Text style={styles.materialTitle}>Choose material type</Text>
          <View style={styles.materialOptions}>
            <TouchableOpacity
              style={[
                styles.materialOption,
                selectedMaterial === "plywood" && styles.materialOptionSelected,
              ]}
              onPress={() => setSelectedMaterial("plywood")}
            >
              <Layers
                size={24}
                color={selectedMaterial === "plywood" ? "#FFF" : "#B45309"}
              />
              <Text
                style={[
                  styles.materialOptionText,
                  selectedMaterial === "plywood" && styles.materialOptionTextSelected,
                ]}
              >
                Plywood
              </Text>
              <Text
                style={[
                  styles.materialPrice,
                  selectedMaterial === "plywood" && styles.materialPriceSelected,
                ]}
              >
                Budget-friendly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.materialOption,
                selectedMaterial === "solid" && styles.materialOptionSelected,
              ]}
              onPress={() => setSelectedMaterial("solid")}
            >
              <TreePine
                size={24}
                color={selectedMaterial === "solid" ? "#FFF" : "#B45309"}
              />
              <Text
                style={[
                  styles.materialOptionText,
                  selectedMaterial === "solid" && styles.materialOptionTextSelected,
                ]}
              >
                Solid Wood
              </Text>
              <Text
                style={[
                  styles.materialPrice,
                  selectedMaterial === "solid" && styles.materialPriceSelected,
                ]}
              >
                Premium finish
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionDivider />

        {/* Our Expertise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our expertise</Text>
          <View style={styles.expertiseGrid}>
            <View style={styles.expertiseCard}>
              <Hammer size={20} color="#B45309" />
              <Text style={styles.expertiseTitle}>Furniture Repair</Text>
            </View>
            <View style={styles.expertiseCard}>
              <Layers size={20} color="#B45309" />
              <Text style={styles.expertiseTitle}>Cabinet Work</Text>
            </View>
            <View style={styles.expertiseCard}>
              <Ruler size={20} color="#B45309" />
              <Text style={styles.expertiseTitle}>Custom Design</Text>
            </View>
            <View style={styles.expertiseCard}>
              <TreePine size={20} color="#B45309" />
              <Text style={styles.expertiseTitle}>Wood Polish</Text>
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
                accentColor="#B45309"
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

        {/* Material Brands */}
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
        <CoverPromise accentColor="#B45309" features={serviceData.coverFeatures} />

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
          accentColor="#B45309"
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
  craftsmanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  craftsmanBadgeText: { fontSize: 12, fontWeight: "600", color: "#B45309" },
  materialSection: { paddingHorizontal: 16, paddingBottom: 20 },
  materialTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 12 },
  materialOptions: { flexDirection: "row", gap: 12 },
  materialOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FDE68A",
    gap: 4,
  },
  materialOptionSelected: {
    backgroundColor: "#B45309",
    borderColor: "#B45309",
  },
  materialOptionText: { fontSize: 14, fontWeight: "600", color: "#B45309" },
  materialOptionTextSelected: { color: "#FFF" },
  materialPrice: { fontSize: 11, color: "#92400E" },
  materialPriceSelected: { color: "#FDE68A" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#000", marginBottom: 20 },
  expertiseGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  expertiseCard: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
  },
  expertiseTitle: { fontSize: 13, fontWeight: "600", color: "#374151" },
  variantsContainer: { gap: 12 },
  reviewsHeader: { marginBottom: 16 },
  reviewsSummary: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  reviewsSummaryText: { fontSize: 14, color: "#6B7280" },
});
