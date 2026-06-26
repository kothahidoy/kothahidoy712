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
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    caption: "Salon, at your home",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
    caption: "Pampering you deserve",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
    caption: "Premium beauty care",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
    caption: "Trusted beauticians",
  },
];

const GRID_PADDING = 16;
const GRID_GAP = 16;

// Salon sub-categories matching Urban Company Salon Luxe
const SALON_CATEGORIES = [
  {
    id: "packages",
    name: "Super saver\npackages",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80",
    badge: "Upto 20% OFF",
    badgeColor: "#16A34A",
  },
  {
    id: "waxing",
    name: "Waxing",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "bridal-facial",
    name: "Bridal facial",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&q=80",
    badge: "New",
    badgeColor: "#DC2626",
  },
  {
    id: "korean-facial",
    name: "Korean facial",
    image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "signature-facials",
    name: "Signature\nfacials",
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "cleanup",
    name: "Cleanup",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "pedicure-manicure",
    name: "Pedicure &\nmanicure",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "threading",
    name: "Threading &\nface",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "bleach-detan",
    name: "Bleach, detan\n& more",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "hair-care",
    name: "Hair care",
    image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "makeup",
    name: "Makeup &\nstyling",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80",
    badge: "Popular",
    badgeColor: colors.primary,
  },
  {
    id: "spa",
    name: "Spa &\nmassage",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&q=80",
  },
];

type SubCatTile = {
  id: string;
  name: string;
  image: string;
  badge?: string;
  badgeColor?: string;
};

// Grid Item Component
const GridItem = ({ item, onPress }: { item: SubCatTile; onPress: () => void }) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.gridImageContainer}>
      {item.badge && (
        <View style={[styles.gridBadge, { backgroundColor: item.badgeColor }]}>
          <Text style={styles.gridBadgeText}>{item.badge}</Text>
        </View>
      )}
      <Image
        source={{ uri: item.image }}
        style={styles.gridImage}
        resizeMode="cover"
      />
    </View>
    <Text style={styles.gridLabel} numberOfLines={2}>{item.name}</Text>
  </TouchableOpacity>
);

export default function WomenSalonServiceScreen() {
  const router = useRouter();

  // ── Pull CMS-managed content from Supabase ──
  const cms = useCategoryCMS("salon-women");

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

  const salonCategories = useMemo(() => {
    if (cms.sub_categories && cms.sub_categories.length > 0) {
      return cms.sub_categories.map((s) => ({
        id: s.slug || s.id,
        name: s.name,
        image: s.image_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80",
        badge: s.badge || undefined,
        badgeColor: s.badge_color || colors.primary,
      }));
    }
    return SALON_CATEGORIES;
  }, [cms.sub_categories]);

  const brandName = cms.category?.brand_name || "Salon Luxe";
  const brandRating = cms.category?.brand_rating ?? 4.89;
  const brandReviewsLabel = cms.category?.brand_reviews_label || "2.0 M bookings";
  const promo = cms.promos?.[0];
  const promoLabel = promo?.label || "Get 25% off upto 200";
  const promoSubLabel = promo?.sub_label || "For new salon users";
  const promoColor = promo?.badge_color || "#16A34A";

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/salon-women?scrollTo=${categoryId}`);
  };

  // Split categories into rows of 3
  const rows: typeof salonCategories[] = [];
  for (let i = 0; i < salonCategories.length; i += 3) {
    rows.push(salonCategories.slice(i, i + 3));
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Media Banner — swipeable images + tap-to-play video (from CMS) */}
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
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => require("expo-router").router.push("/search?category=salon-women")}><Search size={18} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => Share.share({ message: "Check out salon-women services on Mfixit", url: "/category/salon-women" })}><Share2 size={18} color="#000000" />
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
                <Star size={16} color="#000000" fill="#000000" />
                <Text style={styles.ratingText}>{brandRating} ({brandReviewsLabel})</Text>
              </View>
            </View>
            <View style={styles.earliestBadge}>
              <View style={styles.earliestDot} />
              <Text style={styles.earliestLabel}>Earliest</Text>
              <Text style={styles.earliestTime}>Wed, 6:00 PM</Text>
            </View>
          </View>

          {/* Promo Banner (from CMS) */}
          <View style={styles.promoBanner}>
            <Tag size={18} color={promoColor} />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>{promoLabel}</Text>
              <Text style={styles.promoSubtitle}>{promoSubLabel}</Text>
            </View>
          </View>

          {/* Category Grid */}
          <View style={styles.gridSection}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((item) => (
                  <GridItem 
                    key={item.id} 
                    item={item} 
                    onPress={() => handleCategoryPress(item.id)} 
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: GRID_PADDING,
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
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    color: "#374151",
    textDecorationLine: "underline",
  },
  earliestBadge: {
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  earliestDot: {
    position: "absolute",
    top: 10,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  earliestLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
    marginLeft: 16,
  },
  earliestTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    marginTop: 2,
  },
  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 28,
    gap: 14,
  },
  promoTextContainer: {},
  promoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
  },
  promoSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  gridSection: {
    marginTop: 4,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: 110,
    alignItems: "center",
  },
  gridImageContainer: {
    width: 100,
    height: 100,
    borderRadius: radius.lg,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
    marginBottom: 10,
    position: "relative",
  },
  gridBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  gridBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  gridImage: {
    width: 100,
    height: 100,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    lineHeight: 17,
  },
});
