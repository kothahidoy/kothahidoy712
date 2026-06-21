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
} from "lucide-react-native";

import { colors, radius } from "@/src/theme";
import { HeroMediaBanner, HeroMediaItem } from "@/src/components/HeroMediaBanner";

// Hero banner media — swipeable images + tap-to-play video.
// Easy to swap with admin-managed list later.
const HERO_MEDIA: HeroMediaItem[] = [
  {
    type: "video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    caption: "Walls reborn",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80",
    caption: "Professional painters",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1599619351208-3e6c839d6828?auto=format&fit=crop&w=900&q=80",
    caption: "Premium colours",
  },
  {
    type: "image",
    uri: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=900&q=80",
    caption: "Mess-free service",
  },
];

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
        {/* Hero Media Banner — swipeable images + tap-to-play video */}
        <View style={styles.heroWrapper}>
          <HeroMediaBanner items={HERO_MEDIA} height={300} />
          <View style={styles.heroHeaderOverlay} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <ArrowLeft size={20} color="#000000" />
            </TouchableOpacity>
            <View style={styles.heroHeaderRight}>
              <TouchableOpacity style={styles.heroIconBtn}>
                <Search size={18} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn}>
                <Share2 size={18} color="#000000" />
              </TouchableOpacity>
            </View>
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
