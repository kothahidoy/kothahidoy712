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
  PaintBucket,
  Palette,
  Droplet,
  Home,
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

// PAINTING LAYOUT - Color palettes, room visualizer, paint brands focus
export default function PaintingServiceDetailScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);

  const { loading, error, serviceData } = useServiceDetail(
    serviceId || "",
    "painting"
  );

  // Color palette options
  const colorPalette = [
    { name: "Classic White", color: "#FAFAFA" },
    { name: "Warm Beige", color: "#F5F5DC" },
    { name: "Sky Blue", color: "#87CEEB" },
    { name: "Mint Green", color: "#98FB98" },
    { name: "Soft Gray", color: "#D3D3D3" },
    { name: "Peach", color: "#FFDAB9" },
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
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Loading painting service...</Text>
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
      {/* Header with Amber Painting Theme */}
      <View style={[styles.header, { backgroundColor: "#FFFBEB" }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <PaintBucket size={16} color="#D97706" />
            <Text style={styles.headerTitle}>{serviceData.categoryName}</Text>
          </View>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#D97706" />
            <Text style={[styles.headerSlotText, { color: "#D97706" }]}>
              Free color consultation
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
          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <Palette size={16} color="#D97706" />
            <Text style={styles.premiumBadgeText}>
              Premium Paints • Color Consultation Free
            </Text>
          </View>
        </View>

        {/* Color Palette Selector - Unique to Painting */}
        <View style={styles.colorSection}>
          <Text style={styles.colorSectionTitle}>Popular color choices</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorPalette}
          >
            {colorPalette.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorOption,
                  selectedColor === index && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(index)}
              >
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: item.color },
                    selectedColor === index && styles.colorSwatchSelected,
                  ]}
                />
                <Text style={styles.colorName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <SectionDivider />

        {/* Room Visualizer Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visualize your room</Text>
          <View style={styles.visualizerCard}>
            <View
              style={[
                styles.visualizerWall,
                { backgroundColor: colorPalette[selectedColor].color },
              ]}
            >
              <Home size={48} color="#374151" />
              <Text style={styles.visualizerText}>
                {colorPalette[selectedColor].name}
              </Text>
            </View>
            <Text style={styles.visualizerNote}>
              This is a preview. Actual color may vary.
            </Text>
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
                accentColor="#D97706"
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

        {/* Paint Brands */}
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
        <CoverPromise accentColor="#D97706" features={serviceData.coverFeatures} />

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
          accentColor="#D97706"
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
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  premiumBadgeText: { fontSize: 12, fontWeight: "600", color: "#D97706" },
  colorSection: { paddingHorizontal: 16, paddingBottom: 20 },
  colorSectionTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 12 },
  colorPalette: { gap: 12 },
  colorOption: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#D97706",
    backgroundColor: "#FFFBEB",
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: "#D97706",
  },
  colorName: { fontSize: 11, fontWeight: "500", color: "#374151" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#000", marginBottom: 20 },
  visualizerCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  visualizerWall: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  visualizerText: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 8 },
  visualizerNote: { fontSize: 12, color: "#6B7280", fontStyle: "italic" },
  variantsContainer: { gap: 12 },
  reviewsHeader: { marginBottom: 16 },
  reviewsSummary: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  reviewsSummaryText: { fontSize: 14, color: "#6B7280" },
});
