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
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";
import { HeroMediaBanner, HeroMediaItem } from "@/src/components/HeroMediaBanner";
import { useCategoryCMS } from "@/src/hooks/useCategoryCMS";

// Hero banner media — swipeable images + tap-to-play video.
// Easy to swap with admin-managed list later.
const HERO_MEDIA: HeroMediaItem[] = [
  {
    type: "video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    caption: "Wired right, safe & sound",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80",
    caption: "Certified electricians",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1558618666-9b91eee5bdfd?auto=format&fit=crop&w=900&q=80",
    caption: "All electrical work",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?auto=format&fit=crop&w=900&q=80",
    caption: "Quick same-day fix",
  },
];

// Sub-categories for electrician (matching Urban Company)
const ELECTRICIAN_SUBCATEGORIES = [
  {
    id: "switch-socket",
    name: "Switch &\nsocket",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "fan",
    name: "Fan",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "light",
    name: "Light",
    image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "wiring",
    name: "Wiring",
    image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "doorbell-security",
    name: "Doorbell &\nsecurity",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "mcb-fuse",
    name: "MCB/fuse",
    image: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "appliances",
    name: "Appliances",
    image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "consultation",
    name: "Book a\nconsultation",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80",
  },
];

// Grid item component with explicit sizing
const GridItem = ({ item, onPress }: { item: typeof ELECTRICIAN_SUBCATEGORIES[0]; onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.gridItem} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.gridImageWrapper}>
      <Image
        source={{ uri: item.image }}
        style={styles.gridImage}
        resizeMode="cover"
      />
    </View>
    <Text style={styles.gridLabel} numberOfLines={2}>{item.name}</Text>
  </TouchableOpacity>
);

export default function ElectricianCategoryScreen() {
  const router = useRouter();


  // ── Pull CMS-managed content from Supabase ──
  const cms = useCategoryCMS("electrician");

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
        image: s.image_url || ((ELECTRICIAN_SUBCATEGORIES)[0] as any)?.image || "",
        badge: s.badge || undefined,
        badgeColor: s.badge_color || undefined,
      }));
    }
    return ELECTRICIAN_SUBCATEGORIES;
  }, [cms.sub_categories]);

  const brandName = cms.category?.brand_name || cms.category?.name || "Electrician";
  const brandRating = cms.category?.brand_rating ?? 4.85;
  const brandReviewsLabel = cms.category?.brand_reviews_label || "2.0 M bookings";
  const promo = cms.promos?.[0];
  const promoLabel = promo?.label || "Free inspection";
  const promoSubLabel = promo?.sub_label || "Worth ₹99";
  const promoColor = promo?.badge_color || "#16A34A";

  const handleSubCategoryPress = (subcategoryId: string) => {
    router.push(`/electrician?scrollTo=${subcategoryId}`);
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
          <View style={styles.heroHeaderOverlay} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <ArrowLeft size={20} color="#000000" />
            </TouchableOpacity>
            <View style={styles.heroHeaderRight}>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => require("expo-router").router.push("/search?category=electrician")}><Search size={18} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => Share.share({ message: "Check out electrician services on Mfixit", url: "/category/electrician" })}><Share2 size={18} color="#000000" />
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
              <Text style={styles.earliestTime}>Wed, 8:00 AM</Text>
            </View>
          </View>

          {/* Warranty Card - Changed to Mfixit */}
          <TouchableOpacity style={styles.warrantyCard} onPress={() => router.push("/cover/electrician")}>
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

      {/* Bottom Promo Bar (CMS-controlled) */}
      {(cms.category?.visitation_fee_active ?? true) && (
        <View style={styles.bottomPromo}>
          <Tag size={14} color="#059669" />
          <Text style={styles.bottomPromoText}>{cms.category?.visitation_fee_label || 'Get visitation fee off on orders above ₹499'}</Text>
        </View>
      )}
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
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 8,
  },
  gridImage: {
    width: 70,
    height: 70,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    lineHeight: 14,
  },
  bottomPromo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#D1FAE5",
  },
  bottomPromoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
});
