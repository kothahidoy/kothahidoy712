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
  Zap,
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
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    caption: "Leaks fixed in minutes",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80",
    caption: "Trusted plumbers",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80",
    caption: "All plumbing covered",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1584622781867-bc4b66c64015?auto=format&fit=crop&w=900&q=80",
    caption: "Quick & clean fix",
  },
];

const GRID_PADDING = 16;
const GRID_GAP = 16;

// Plumber sub-categories matching Urban Company
const PLUMBER_CATEGORIES = [
  {
    id: "tap-mixer",
    name: "Tap & mixer",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "toilet",
    name: "Toilet",
    image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "bath-shower",
    name: "Bath & shower",
    image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "bath-accessories",
    name: "Bath\naccessories",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "basin-sink",
    name: "Basin & sink",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "drainage",
    name: "Drainage &\nblockage",
    image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "leakage",
    name: "Leakage &\nconnections",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "water-tank",
    name: "Water tank &\nmotor",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "consultation",
    name: "Book a\nconsultation",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
  },
];

// Grid Item Component
const GridItem = ({ item, onPress }: { item: typeof PLUMBER_CATEGORIES[0]; onPress: () => void }) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.gridImageContainer}>
      <Image
        source={{ uri: item.image }}
        style={styles.gridImage}
        resizeMode="cover"
      />
    </View>
    <Text style={styles.gridLabel} numberOfLines={2}>{item.name}</Text>
  </TouchableOpacity>
);

export default function PlumberServiceScreen() {
  const router = useRouter();


  // ── Pull CMS-managed content from Supabase ──
  const cms = useCategoryCMS("plumber");

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
        image: s.image_url || ((PLUMBER_CATEGORIES)[0] as any)?.image || "",
        badge: s.badge || undefined,
        badgeColor: s.badge_color || undefined,
      }));
    }
    return PLUMBER_CATEGORIES;
  }, [cms.sub_categories]);

  const brandName = cms.category?.brand_name || cms.category?.name || "Plumber";
  const brandRating = cms.category?.brand_rating ?? 4.85;
  const brandReviewsLabel = cms.category?.brand_reviews_label || "2.0 M bookings";
  const promo = cms.promos?.[0];
  const promoLabel = promo?.label || "Get ₹100 off";
  const promoSubLabel = promo?.sub_label || "First plumbing fix";
  const promoColor = promo?.badge_color || "#16A34A";

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to single-page plumber view with scroll-to-section
    router.push(`/plumber?scrollTo=${categoryId}`);
  };

  // Split categories into rows of 3
  const rows: typeof PLUMBER_CATEGORIES[] = [];
  for (let i = 0; i < dynSubCategories.length; i += 3) {
    rows.push(dynSubCategories.slice(i, i + 3));
  }

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
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => require("expo-router").router.push("/search?category=plumber")}><Search size={18} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => Share.share({ message: "Check out plumber services on Mfixit", url: "/category/plumber" })}><Share2 size={18} color="#000000" />
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
            <View style={styles.instantBadge}>
              <Zap size={14} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.instantLabel}>Instant</Text>
              <Text style={styles.instantTime}>In 25 mins</Text>
            </View>
          </View>

          {/* Warranty Card */}
          <TouchableOpacity style={styles.warrantyCard} onPress={() => router.push("/cover/plumber")}>
            <View style={styles.warrantyLeft}>
              <Shield size={20} color="#6B7280" />
              <Text style={styles.warrantyText}>Mfixit warranty & protection</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Promo Banner */}
          <View style={styles.promoBanner}>
            <Tag size={18} color={promoColor} />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>{promoLabel}</Text>
              <Text style={styles.promoSubtitle}>{promoSubLabel}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

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
        
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Promo Bar */}
      <View style={styles.bottomPromo}>
        <Tag size={16} color="#16A34A" />
        <Text style={styles.bottomPromoText}>Get visitation fee off on orders above ₹499</Text>
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
  instantBadge: {
    alignItems: "flex-end",
    backgroundColor: "#16A34A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instantLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  instantTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  warrantyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  warrantyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
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
  divider: {
    height: 8,
    backgroundColor: "#F3F4F6",
    marginHorizontal: -GRID_PADDING,
    marginBottom: 20,
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
  bottomPromo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF9C3",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
  },
  bottomPromoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
  },
});
