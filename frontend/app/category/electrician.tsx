import React, { useState, useMemo } from "react";
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
  Check, 
  ChevronRight, 
  Search, 
  Share2, 
  Shield, 
  Star, 
  Zap,
  Clock,
  Headphones,
} from "lucide-react-native";

import { ELECTRICIAN_SERVICES } from "@/src/data/seed";
import { colors, radius } from "@/src/theme";
import UrbanServiceCard from "@/src/components/UrbanServiceCard";

// Service type tabs
const SERVICE_TYPES = [
  { id: "all", label: "All" },
  { id: "installation", label: "Installation" },
  { id: "repair", label: "Repair" },
];

// Cart item type
interface CartItem {
  id: string;
  quantity: number;
}

export default function ElectricianCategoryScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Filter services based on selected type
  const filteredServices = useMemo(() => {
    if (selectedType === "all") return ELECTRICIAN_SERVICES;
    if (selectedType === "installation") {
      return ELECTRICIAN_SERVICES.filter(s => 
        s.title.toLowerCase().includes("installation") || 
        s.title.toLowerCase().includes("install")
      );
    }
    if (selectedType === "repair") {
      return ELECTRICIAN_SERVICES.filter(s => 
        s.title.toLowerCase().includes("repair") || 
        s.title.toLowerCase().includes("fix")
      );
    }
    return ELECTRICIAN_SERVICES;
  }, [selectedType]);

  // Cart calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const service = ELECTRICIAN_SERVICES.find(s => s.id === item.id);
      return total + (service?.price || 0) * item.quantity;
    }, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (id: string, quantity: number) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === id);
      if (quantity === 0) {
        return prevCart.filter(item => item.id !== id);
      }
      if (existing) {
        return prevCart.map(item =>
          item.id === id ? { ...item, quantity } : item
        );
      }
      return [...prevCart, { id, quantity }];
    });
  };

  const handleServicePress = (id: string) => {
    router.push(`/service/${id}`);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <ArrowLeft size={22} color={colors.textMain} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Electrician</Text>
          <View style={styles.instantBadge}>
            <Zap size={12} color="#059669" fill="#059669" />
            <Text style={styles.instantText}>Pro arrives in 45 mins</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Search size={20} color={colors.textMain} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Share2 size={20} color={colors.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>VERIFIED PROS</Text>
            <Text style={styles.heroTitle}>Expert{"\n"}Electricians</Text>
            <Text style={styles.heroSubtitle}>Trained & background verified</Text>
          </View>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80" }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingLeft}>
            <Text style={styles.serviceName}>Electrician</Text>
            <View style={styles.ratingRow}>
              <Star size={14} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.ratingText}>4.78 (8.2M bookings)</Text>
            </View>
          </View>
          <View style={styles.instantCard}>
            <View style={styles.instantCardBadge}>
              <Zap size={10} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.instantCardBadgeText}>Instant</Text>
            </View>
            <Text style={styles.instantCardTime}>In 45 mins</Text>
          </View>
        </View>

        {/* MFIXIT Cover Card */}
        <TouchableOpacity style={styles.coverCard}>
          <View style={styles.coverLeft}>
            <View style={styles.coverIcon}>
              <Check size={14} color="#059669" />
            </View>
            <View>
              <Text style={styles.coverLabel}>MFIXIT COVER</Text>
              <Text style={styles.coverText}>Standard rate card</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Service Type Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {SERVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.tab,
                  selectedType === type.id && styles.tabActive,
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedType === type.id && styles.tabTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Services List */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>
            {selectedType === "all" ? "All services" : 
             selectedType === "installation" ? "Installation services" : "Repair services"}
          </Text>
          
          {filteredServices.map((service) => (
            <UrbanServiceCard
              key={service.id}
              id={service.id}
              title={service.title}
              rating={service.rating}
              reviewCount={service.reviewCount}
              price={service.price}
              originalPrice={service.originalPrice}
              duration={service.duration}
              image={service.image}
              description={service.description}
              onAdd={handleAddToCart}
              onPress={handleServicePress}
            />
          ))}
        </View>

        {/* Why MFIXIT Section */}
        <View style={styles.whySection}>
          <Text style={styles.sectionTitle}>Why MFIXIT?</Text>
          <View style={styles.whyCard}>
            <View style={styles.whyItem}>
              <Shield size={20} color={colors.primary} />
              <View style={styles.whyTextContainer}>
                <Text style={styles.whyItemTitle}>Background verified</Text>
                <Text style={styles.whyItemDesc}>All electricians are ID verified & trained</Text>
              </View>
            </View>
            <View style={styles.whyItem}>
              <Clock size={20} color={colors.primary} />
              <View style={styles.whyTextContainer}>
                <Text style={styles.whyItemTitle}>On-time guarantee</Text>
                <Text style={styles.whyItemDesc}>Professionals arrive at scheduled time</Text>
              </View>
            </View>
            <View style={styles.whyItem}>
              <Headphones size={20} color={colors.primary} />
              <View style={styles.whyTextContainer}>
                <Text style={styles.whyItemTitle}>Post-service support</Text>
                <Text style={styles.whyItemDesc}>30 days warranty on all services</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: cartItemCount > 0 ? 140 : 100 }} />
      </ScrollView>

      {/* Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>{cartItemCount} item{cartItemCount > 1 ? "s" : ""}</Text>
            <Text style={styles.cartTotal}>₹{cartTotal}</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewCartBtn}
            onPress={() => router.push("/booking/new")}
          >
            <Text style={styles.viewCartText}>View Cart</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMain,
  },
  instantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  instantText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  heroBanner: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: radius.xl,
    alignItems: "center",
  },
  heroContent: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textMain,
    lineHeight: 28,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  heroImage: {
    width: 100,
    height: 100,
    borderRadius: radius.lg,
  },
  ratingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  ratingLeft: {},
  serviceName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textMain,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  instantCard: {
    alignItems: "flex-end",
  },
  instantCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  instantCardBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  instantCardTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  coverCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coverIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  coverLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  coverText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMain,
  },
  tabsContainer: {
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 24,
  },
  tab: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMain,
    marginBottom: 16,
  },
  whySection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
    marginTop: 20,
  },
  whyCard: {
    gap: 20,
  },
  whyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  whyTextContainer: {
    flex: 1,
  },
  whyItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMain,
    marginBottom: 2,
  },
  whyItemDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  cartInfo: {},
  cartCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 4,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
