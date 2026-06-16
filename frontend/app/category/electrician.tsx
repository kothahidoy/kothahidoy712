import React from "react";
import {
  Dimensions,
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
  Tag,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = 16;
const GRID_GAP = 12;
const ITEMS_PER_ROW = 4;
const ITEM_WIDTH = (SCREEN_WIDTH - (GRID_PADDING * 2) - (GRID_GAP * (ITEMS_PER_ROW - 1))) / ITEMS_PER_ROW;

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

export default function ElectricianCategoryScreen() {
  const router = useRouter();

  const handleSubCategoryPress = (subcategoryId: string) => {
    router.push(`/electrician/${subcategoryId}`);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Banner - Yellow/Cream background like UC */}
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
            
            <View style={styles.saverBadge}>
              <Text style={styles.saverText}>saver</Text>
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
              <Text style={styles.bannerTitle}>Affordable repairs{"\n"}starting at just ₹49</Text>
            </View>
            <View style={styles.bannerImageContainer}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=80" }}
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
              <Text style={styles.categoryTitle}>Electrician</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#000000" fill="#000000" />
                <Text style={styles.ratingText}>4.80 (2.5 M bookings)</Text>
              </View>
            </View>
            <View style={styles.earliestBadge}>
              <Clock size={12} color="#059669" />
              <Text style={styles.earliestLabel}>Earliest</Text>
              <Text style={styles.earliestTime}>Wed, 8:00 AM</Text>
            </View>
          </View>

          {/* Warranty Card - Changed to Mfixit */}
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
              <Text style={styles.promoTitle}>Get visitation fee off</Text>
              <Text style={styles.promoSubtitle}>On orders above ₹499</Text>
            </View>
          </View>

          {/* Sub-category Grid */}
          <View style={styles.gridContainer}>
            {ELECTRICIAN_SUBCATEGORIES.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.gridItem} 
                onPress={() => handleSubCategoryPress(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.gridImageBox}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.gridImg}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.gridLabel} numberOfLines={2}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Promo Bar */}
      <View style={styles.bottomPromo}>
        <Tag size={14} color="#059669" />
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
  heroBanner: {
    backgroundColor: "#FEF3C7",
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
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  saverBadge: {
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  saverText: {
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
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  bannerImage: {
    width: 140,
    height: 120,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#FDE68A",
    marginTop: 8,
  },
  progressFill: {
    height: 4,
    width: "60%",
    backgroundColor: "#059669",
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
    borderRadius: radius.lg,
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
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 28,
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
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    alignItems: "center",
    marginBottom: 8,
  },
  gridImageBox: {
    width: ITEM_WIDTH - 8,
    height: ITEM_WIDTH - 8,
    borderRadius: radius.lg,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 8,
  },
  gridImg: {
    width: "100%",
    height: "100%",
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
