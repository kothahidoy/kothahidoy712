import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  Zap,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

// Sub-categories for Insta Help (matching Urban Company)
const INSTA_HELP_SUBCATEGORIES = [
  {
    id: "tap-leak",
    name: "Tap &\nleak fix",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "toilet",
    name: "Toilet\nrepair",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "switch-socket",
    name: "Switch &\nsocket",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "door-lock",
    name: "Door &\nlock",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "fan-light",
    name: "Fan &\nlight",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "drill-hang",
    name: "Drill &\nhang",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "furniture",
    name: "Furniture\nfix",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "other",
    name: "Other\nissues",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80",
  },
];

// Grid item component with explicit sizing
const GridItem = ({ item, onPress }: { item: typeof INSTA_HELP_SUBCATEGORIES[0]; onPress: () => void }) => (
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

export default function InstaHelpCategoryScreen() {
  const router = useRouter();

  const handleSubCategoryPress = (subcategoryId: string) => {
    router.push(`/insta-help/${subcategoryId}`);
  };

  // Split into 2 rows of 4 items
  const row1 = INSTA_HELP_SUBCATEGORIES.slice(0, 4);
  const row2 = INSTA_HELP_SUBCATEGORIES.slice(4, 8);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Banner - Red background for Insta Help */}
        <View style={styles.heroBanner}>
          {/* Header buttons overlaying the banner */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.urgentBadge}>
              <Zap size={12} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.urgentText}>instant</Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtnDark}>
                <Search size={18} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtnDark}>
                <Share2 size={18} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Banner Content */}
          <View style={styles.bannerContent}>
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerTitle}>Quick fixes{"\n"}within 60 mins</Text>
            </View>
            <View style={styles.bannerImageContainer}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80" }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleLeft}>
              <Text style={styles.categoryTitle}>Insta Help</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#000000" fill="#000000" />
                <Text style={styles.ratingText}>4.75 (1.8 M bookings)</Text>
              </View>
            </View>
            <View style={styles.earliestBadge}>
              <Clock size={12} color="#DC2626" />
              <Text style={styles.earliestLabel}>Arrives in</Text>
              <Text style={styles.earliestTime}>~60 mins</Text>
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
            <Zap size={16} color="#DC2626" fill="#DC2626" />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>Flat ₹49 visitation fee</Text>
              <Text style={styles.promoSubtitle}>For all insta help services</Text>
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
        <Zap size={14} color="#DC2626" fill="#DC2626" />
        <Text style={styles.bottomPromoText}>Expert arrives within 60 minutes</Text>
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
  heroBanner: {
    backgroundColor: "#FEE2E2",
    paddingTop: 8,
  },
  headerOverlay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  urgentBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerRight: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  iconBtnDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  bannerLeft: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
    lineHeight: 28,
  },
  bannerImageContainer: {
    width: 140,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerImage: {
    width: 140,
    height: 120,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#FECACA",
    marginTop: 8,
  },
  progressFill: {
    height: 4,
    width: "90%",
    backgroundColor: "#DC2626",
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
    color: "#DC2626",
    marginTop: 2,
  },
  earliestTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
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
    backgroundColor: "#FEF2F2",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#FEE2E2",
  },
  bottomPromoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
});
