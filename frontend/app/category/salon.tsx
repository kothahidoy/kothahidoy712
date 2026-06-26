import React, { useState, useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  ChevronRight, 
  Search, 
  Share2, 
  Star, 
  Clock,
  Shield,
  Tag,
  Bookmark,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";
import { HeroMediaBanner, HeroMediaItem } from "@/src/components/HeroMediaBanner";
import { useCategoryCMS } from "@/src/hooks/useCategoryCMS";

// Hero banner media — mix of video (with play overlay) and images
const HERO_MEDIA: HeroMediaItem[] = [
  {
    type: "video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    caption: "Mess free experience",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
    caption: "Salon at home",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80",
    caption: "Trusted pros",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=80",
    caption: "Premium grooming",
  },
];

// Sub-categories for Salon — Packages tile first (special bookmark icon, no photo)
type SalonSubCategory = {
  id: string;
  name: string;
  image?: string;
  icon?: "packages";
  iconBg?: string;
};

const SALON_SUBCATEGORIES: SalonSubCategory[] = [
  {
    id: "packages",
    name: "Packages",
    icon: "packages",
    iconBg: "#CCFBF1",
  },
  {
    id: "haircut",
    name: "Haircut &\nbeard styling",
    image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "facial",
    name: "Facial &\ncleanup",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "detan",
    name: "Detan",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "pedicure",
    name: "Manicure &\npedicure",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "massage",
    name: "Massage",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "hair-color",
    name: "Hair colour",
    image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "shave",
    name: "Shave &\nbeard",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=200&q=80",
  },
];

// Grid item component with explicit sizing
const GridItem = ({ item, onPress }: { item: SalonSubCategory; onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.gridItem} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[
        styles.gridImageWrapper,
        item.icon ? { backgroundColor: item.iconBg ?? "#CCFBF1" } : null,
      ]}
    >
      {item.icon === "packages" ? (
        <View style={styles.packageIconBox}>
          <Bookmark size={28} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      ) : item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.gridImage}
          resizeMode="cover"
        />
      ) : null}
    </View>
    <Text style={styles.gridLabel} numberOfLines={2}>{item.name}</Text>
  </TouchableOpacity>
);

export default function SalonCategoryScreen() {
  const router = useRouter();


  // ── Pull CMS-managed content from Supabase ──
  const cms = useCategoryCMS("salon-men");

  const heroMedia: HeroMediaItem[] = useMemo(() => {
    if (cms.banners && cms.banners.length > 0) {
      return cms.banners.map((b) => ({
        type: (b.media_type === "video" ? "video" : "image") as "image" | "video",
        uri: b.media_url,
        caption: b.title,
        ...(b.poster_url ? { poster: b.poster_url } : {}),
      }));
    }
    return HERO_MEDIA;
  }, [cms.banners]);

  const dynSubCategories = useMemo(() => {
    if (cms.sub_categories && cms.sub_categories.length > 0) {
      return cms.sub_categories.map((s) => ({
        id: s.slug || s.id,
        name: s.name,
        image: s.image_url || ((SALON_SUBCATEGORIES)[0] as any)?.image || "",
        badge: s.badge || undefined,
        badgeColor: s.badge_color || undefined,
      }));
    }
    return SALON_SUBCATEGORIES;
  }, [cms.sub_categories]);

  const brandName = cms.category?.brand_name || cms.category?.name || "Men's Salon";
  const brandRating = cms.category?.brand_rating ?? 4.85;
  const brandReviewsLabel = cms.category?.brand_reviews_label || "2.0 M bookings";
  const promo = cms.promos?.[0];
  const promoLabel = promo?.label || "Flat 20% off";
  const promoSubLabel = promo?.sub_label || "For new users";
  const promoColor = promo?.badge_color || "#16A34A";

  const handleSubCategoryPress = (subcategoryId: string) => {
    router.push(`/salon?scrollTo=${subcategoryId}`);
  };

  // Split into 2 rows of 4 items
  const row1 = dynSubCategories.slice(0, 4);
  const row2 = dynSubCategories.slice(4, 8);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Media Banner — swipeable images + tap-to-play video */}
        <View style={styles.heroWrapper}>
          <HeroMediaBanner items={heroMedia} height={300} />
          {/* Floating header buttons over banner */}
          <View style={styles.heroHeaderOverlay} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <ArrowLeft size={20} color="#000000" />
            </TouchableOpacity>
            <View style={styles.heroHeaderRight}>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => require("expo-router").router.push("/search?category=salon-men")}><Search size={18} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => Share.share({ message: "Check out salon-men services on Mfixit", url: "/category/salon-men" })}><Share2 size={18} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleLeft}>
              <Text style={styles.categoryTitle}>{brandName}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#000000" fill="#000000" />
                <Text style={styles.ratingText}>{brandRating} ({brandReviewsLabel})</Text>
              </View>
            </View>
            <View style={styles.earliestBadge}>
              <Clock size={12} color="#059669" />
              <Text style={styles.earliestLabel}>Earliest</Text>
              <Text style={styles.earliestTime}>Today, 2:00 PM</Text>
            </View>
          </View>

          {/* Warranty Card */}
          <TouchableOpacity style={styles.warrantyCard}>
            <View style={styles.warrantyLeft}>
              <View style={styles.warrantyIcon}>
                <Shield size={16} color="#6B7280" />
              </View>
              <Text style={styles.warrantyText}>Mfixit warranty & protection</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Promo Banner */}
          <View style={styles.promoBanner}>
            <Tag size={16} color="#059669" />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>{promoLabel}</Text>
              <Text style={styles.promoSubtitle}>{promoSubLabel}</Text>
            </View>
          </View>

          {/* Sub-category Grid - Explicit Rows */}
          <View style={styles.gridSection}>
            <View style={styles.gridRow}>
              {row1.map((item) => (
                <GridItem 
                  key={item.id} 
                  item={item} 
                  onPress={() => handleSubCategoryPress(item.id)} 
                />
              ))}
            </View>
            <View style={styles.gridRow}>
              {row2.map((item) => (
                <GridItem 
                  key={item.id} 
                  item={item} 
                  onPress={() => handleSubCategoryPress(item.id)} 
                />
              ))}
            </View>
          </View>
        </View>
        
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Promo Bar */}
      <View style={styles.bottomPromo}>
        <Tag size={14} color="#059669" />
        <Text style={styles.bottomPromoText}>Flat 20% off on first salon booking</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  heroWrapper: {
    position: "relative",
  },
  heroHeaderOverlay: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  heroHeaderRight: {
    flexDirection: "row",
    gap: 8,
  },
  heroIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.15)",
    elevation: 3,
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  titleLeft: {},
  categoryTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    color: "#374151",
  },
  earliestBadge: {
    alignItems: "flex-end",
  },
  earliestLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginTop: 2,
  },
  earliestTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  warrantyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  warrantyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  warrantyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  warrantyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
  },
  promoTextContainer: {},
  promoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  promoSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  gridSection: {
    marginTop: 4,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridItem: {
    width: 80,
    alignItems: "center",
  },
  gridImageWrapper: {
    width: 78,
    height: 78,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gridImage: {
    width: 78,
    height: 78,
  },
  packageIconBox: {
    width: 50,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#2DD4BF",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 1 }],
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    lineHeight: 15,
  },
  bottomPromo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#FFEDD5",
  },
  bottomPromoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EA580C",
  },
});
