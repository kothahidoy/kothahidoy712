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
  Star, 
  Clock,
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";

const GRID_PADDING = 16;
const GRID_GAP = 16;

// Painting sub-categories matching Urban Company
const PAINTING_CATEGORIES = [
  {
    id: "1bhk",
    name: "1 BHK painting",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "2bhk",
    name: "2 BHK painting",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "3bhk",
    name: "3 BHK painting",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "4bhk",
    name: "4 BHK painting",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "room-combos",
    name: "Room combos",
    image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=300&q=80",
    badge: "New",
  },
  {
    id: "exterior",
    name: "Exterior full\nhome",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "waterproofing",
    name: "Waterproofing",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "wood-polish",
    name: "Wood polish &\npainting",
    image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "consultation",
    name: "Book a\nconsultation",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
  },
];

// Grid Item Component
const GridItem = ({ item, onPress }: { item: typeof PAINTING_CATEGORIES[0]; onPress: () => void }) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.gridImageContainer}>
      {item.badge && (
        <View style={styles.gridBadge}>
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

export default function PaintingServiceScreen() {
  const router = useRouter();

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/painting?scrollTo=${categoryId}`);
  };

  // Split categories into rows of 3
  const rows: typeof PAINTING_CATEGORIES[] = [];
  for (let i = 0; i < PAINTING_CATEGORIES.length; i += 3) {
    rows.push(PAINTING_CATEGORIES.slice(i, i + 3));
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Banner - Blue background with paint roller */}
        <View style={styles.heroBanner}>
          {/* Header buttons */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <ArrowLeft size={20} color="#000000" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconBtn}>
              <Search size={18} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Banner Content */}
          <View style={styles.bannerContent}>
            <View style={styles.bannerImageWrapper}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=500&q=80" }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </View>
          
          {/* Bottom text overlay */}
          <View style={styles.bannerTextOverlay}>
            <Text style={styles.bannerSubtitle}>For the first time ever</Text>
            <View style={styles.satisfactionBanner}>
              <Text style={styles.satisfactionText}>Pay only after satisfaction</Text>
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
              <Text style={styles.categoryTitle}>Home Painting</Text>
              <View style={styles.ratingRow}>
                <Star size={16} color="#000000" fill="#000000" />
                <Text style={styles.ratingText}>4.71 (18K bookings)</Text>
              </View>
            </View>
            <View style={styles.earliestBadge}>
              <View style={styles.earliestDot} />
              <Text style={styles.earliestLabel}>Earliest</Text>
              <Text style={styles.earliestTime}>Wed, 7:00 PM</Text>
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

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Text style={styles.infoNoteIcon}>📋</Text>
            <Text style={styles.infoNoteText}>Please generate an estimate first from the list above</Text>
          </View>
        </View>
        
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Consultation Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.consultationBtn}>
          <Text style={styles.consultationText}>Book Consultation at ₹49</Text>
        </TouchableOpacity>
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
    backgroundColor: "#93C5FD",
    position: "relative",
  },
  headerOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerContent: {
    paddingTop: 60,
    paddingBottom: 0,
    alignItems: "center",
  },
  bannerImageWrapper: {
    width: "100%",
    height: 180,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: 180,
  },
  bannerTextOverlay: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  satisfactionBanner: {
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  satisfactionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  progressBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressFill: {
    height: 4,
    width: 60,
    backgroundColor: "#1D4ED8",
    borderRadius: 2,
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
    position: "relative",
  },
  gridBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#DC2626",
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
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9C3",
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    gap: 10,
  },
  infoNoteIcon: {
    fontSize: 18,
  },
  infoNoteText: {
    fontSize: 14,
    color: "#92400E",
    flex: 1,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  consultationBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  consultationText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
});
