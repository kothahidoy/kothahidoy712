import React, { useRef, useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  ChevronRight, 
  Search, 
  Share2, 
  Star, 
  Clock,
  Menu,
  Tag,
} from "lucide-react-native";

import { colors } from "@/src/theme";

// Category tabs data for Women's Salon
const CATEGORIES = [
  { id: "packages", name: "Super saver\npackages", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80" },
  { id: "waxing", name: "Waxing", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80" },
  { id: "bridal-facial", name: "Bridal facial", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=200&q=80" },
  { id: "korean-facial", name: "Korean facial", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=200&q=80" },
  { id: "signature-facials", name: "Signature\nfacials", image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=200&q=80" },
  { id: "cleanup", name: "Cleanup", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=200&q=80" },
  { id: "pedicure-manicure", name: "Pedicure &\nmanicure", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=200&q=80" },
  { id: "threading", name: "Threading &\nface", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80" },
  { id: "hair-care", name: "Hair care", image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=200&q=80" },
  { id: "makeup", name: "Makeup &\nstyling", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=80" },
];

// All services organized by category
const ALL_SERVICES = {
  "packages": {
    title: "Super saver packages",
    services: [
      { id: "gold-facial-wax", name: "Gold facial + Full arms waxing", rating: 4.88, reviews: "125K", price: 1199, originalPrice: 1499, duration: "2 hours", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80" },
      { id: "bridal-glow", name: "Bridal glow package", rating: 4.92, reviews: "85K", price: 2499, originalPrice: 2999, duration: "3 hours", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80" },
      { id: "party-ready", name: "Party ready combo", rating: 4.85, reviews: "62K", price: 1799, options: 3, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "waxing": {
    title: "Waxing",
    services: [
      { id: "full-arms", name: "Full arms waxing", rating: 4.82, reviews: "245K", price: 249, duration: "30 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
      { id: "full-legs", name: "Full legs waxing", rating: 4.80, reviews: "220K", price: 349, duration: "45 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
      { id: "underarms", name: "Underarms waxing", rating: 4.85, reviews: "180K", price: 79, duration: "15 mins", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
      { id: "full-body-wax", name: "Full body waxing", rating: 4.78, reviews: "95K", price: 899, options: 4, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "bridal-facial": {
    title: "Bridal facial",
    services: [
      { id: "luxury-bridal", name: "Luxury bridal facial", rating: 4.95, reviews: "45K", price: 4599, duration: "90 mins", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&q=80" },
      { id: "pre-bridal", name: "Pre-bridal glow facial", rating: 4.90, reviews: "68K", price: 2999, duration: "75 mins", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&q=80" },
      { id: "bridal-gold", name: "Bridal gold facial", rating: 4.88, reviews: "52K", price: 3499, options: 2, image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "korean-facial": {
    title: "Korean facial",
    services: [
      { id: "korean-glass", name: "Korean glass skin facial", rating: 4.92, reviews: "78K", price: 1999, duration: "60 mins", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=300&q=80" },
      { id: "k-beauty", name: "K-beauty hydration facial", rating: 4.88, reviews: "55K", price: 1499, duration: "45 mins", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "signature-facials": {
    title: "Signature facials",
    services: [
      { id: "gold-facial", name: "Gold facial", rating: 4.85, reviews: "165K", price: 999, duration: "60 mins", image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=300&q=80" },
      { id: "diamond-facial", name: "Diamond facial", rating: 4.88, reviews: "125K", price: 1299, duration: "75 mins", image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=300&q=80" },
      { id: "pearl-facial", name: "Pearl facial", rating: 4.82, reviews: "95K", price: 899, options: 2, image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "cleanup": {
    title: "Cleanup",
    services: [
      { id: "basic-cleanup", name: "Basic cleanup", rating: 4.78, reviews: "185K", price: 449, duration: "30 mins", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=300&q=80" },
      { id: "fruit-cleanup", name: "Fruit cleanup", rating: 4.82, reviews: "142K", price: 549, duration: "40 mins", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=300&q=80" },
      { id: "de-tan-cleanup", name: "De-tan cleanup", rating: 4.80, reviews: "108K", price: 649, duration: "45 mins", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "pedicure-manicure": {
    title: "Pedicure & manicure",
    services: [
      { id: "classic-pedi", name: "Classic pedicure", rating: 4.80, reviews: "155K", price: 349, duration: "30 mins", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80" },
      { id: "classic-mani", name: "Classic manicure", rating: 4.82, reviews: "138K", price: 299, duration: "25 mins", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80" },
      { id: "spa-pedi", name: "Spa pedicure", rating: 4.88, reviews: "92K", price: 599, options: 3, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "threading": {
    title: "Threading & face",
    services: [
      { id: "eyebrow", name: "Eyebrow threading", rating: 4.85, reviews: "285K", price: 29, duration: "10 mins", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80" },
      { id: "upper-lip", name: "Upper lip threading", rating: 4.82, reviews: "245K", price: 19, duration: "5 mins", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80" },
      { id: "full-face-thread", name: "Full face threading", rating: 4.80, reviews: "165K", price: 99, duration: "20 mins", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "hair-care": {
    title: "Hair care",
    services: [
      { id: "hair-spa", name: "Hair spa", rating: 4.85, reviews: "125K", price: 799, duration: "60 mins", image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80" },
      { id: "keratin", name: "Keratin treatment", rating: 4.88, reviews: "72K", price: 2499, duration: "2-3 hours", image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80" },
      { id: "hair-color", name: "Hair color", rating: 4.82, reviews: "95K", price: 999, options: 5, image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?auto=format&fit=crop&w=300&q=80" },
    ],
  },
  "makeup": {
    title: "Makeup & styling",
    services: [
      { id: "party-makeup", name: "Party makeup", rating: 4.88, reviews: "85K", price: 1499, duration: "60 mins", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80" },
      { id: "bridal-makeup", name: "Bridal makeup", rating: 4.95, reviews: "45K", price: 4999, duration: "2 hours", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80" },
      { id: "engagement-makeup", name: "Engagement makeup", rating: 4.90, reviews: "62K", price: 2999, options: 3, image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80" },
    ],
  },
};

// Service Card Component
const ServiceCard = ({ service, quantity, onAdd, onRemove, onViewDetails }: any) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <View style={styles.ratingRow}>
        <Star size={12} color="#000000" fill="#000000" />
        <Text style={styles.ratingText}>{service.rating} ({service.reviews} reviews)</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{service.price}</Text>
        {service.originalPrice && <Text style={styles.originalPrice}>₹{service.originalPrice}</Text>}
        {service.duration && <Text style={styles.duration}> • {service.duration}</Text>}
      </View>
      <TouchableOpacity style={styles.viewDetailsBtn} onPress={onViewDetails}>
        <Text style={styles.viewDetailsText}>View details</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.serviceRight}>
      <Image source={{ uri: service.image }} style={styles.serviceImage} resizeMode="cover" />
      {quantity === 0 ? (
        <TouchableOpacity style={styles.addButton} onPress={onAdd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={onAdd}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
        </View>
      )}
      {service.options && <Text style={styles.optionsText}>{service.options} options</Text>}
    </View>
  </View>
);

export default function SalonWomenFullPageScreen() {
  const router = useRouter();
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState("packages");
  const [sectionPositions, setSectionPositions] = useState<{ [key: string]: number }>({});
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);

  useEffect(() => {
    if (scrollTo && !hasScrolledToInitial && Object.keys(sectionPositions).length > 0) {
      const position = sectionPositions[scrollTo];
      if (position !== undefined && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: position - 120, animated: true });
          setActiveCategory(scrollTo);
          setHasScrolledToInitial(true);
        }, 300);
      }
    }
  }, [scrollTo, sectionPositions, hasScrolledToInitial]);

  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId);
    const position = sectionPositions[categoryId];
    if (position !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: position - 120, animated: true });
    }
  };

  const handleSectionLayout = (categoryId: string, y: number) => {
    setSectionPositions(prev => ({ ...prev, [categoryId]: y }));
  };

  const handleAddToCart = (serviceId: string) => {
    setCart(prev => ({ ...prev, [serviceId]: (prev[serviceId] || 0) + 1 }));
  };

  const handleRemoveFromCart = (serviceId: string) => {
    setCart(prev => {
      const newQty = (prev[serviceId] || 0) - 1;
      if (newQty <= 0) { const { [serviceId]: _, ...rest } = prev; return rest; }
      return { ...prev, [serviceId]: newQty };
    });
  };

  const getCartTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      Object.values(ALL_SERVICES).forEach(category => {
        const service = category.services.find(s => s.id === id);
        if (service) total += service.price * qty;
      });
    });
    return total;
  };

  const getCartItemCount = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Salon Luxe</Text>
          <View style={styles.headerSlot}>
            <Clock size={12} color="#BE185D" />
            <Text style={styles.headerSlotText}>Earliest slot: Wed, 6:00 PM</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}><Search size={20} color="#000000" /></TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}><Share2 size={20} color="#000000" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.categoryGridContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => handleCategoryPress(cat.id)}>
              <View style={[styles.categoryImageBox, activeCategory === cat.id && styles.categoryImageBoxActive]}>
                <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="cover" />
              </View>
              <Text style={[styles.categoryName, activeCategory === cat.id && styles.categoryNameActive]} numberOfLines={2}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const scrollY = e.nativeEvent.contentOffset.y;
          let currentCategory = "packages";
          Object.entries(sectionPositions).forEach(([id, pos]) => { if (scrollY >= pos - 150) currentCategory = id; });
          if (currentCategory !== activeCategory) setActiveCategory(currentCategory);
        }}
        scrollEventThrottle={16}
      >
        {Object.entries(ALL_SERVICES).map(([categoryId, categoryData]) => (
          <View key={categoryId} onLayout={(e) => handleSectionLayout(categoryId, e.nativeEvent.layout.y)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{categoryData.title}</Text>
              <Text style={styles.sectionTitle}>{categoryData.title}</Text>
            </View>
            {categoryData.services.map((service, index) => (
              <View key={service.id}>
                <ServiceCard service={service} quantity={cart[service.id] || 0} onAdd={() => handleAddToCart(service.id)} onRemove={() => handleRemoveFromCart(service.id)} onViewDetails={() => router.push(`/salon/service/${service.id}`)} />
                {index < categoryData.services.length - 1 && <View style={styles.serviceDivider} />}
              </View>
            ))}
            <View style={styles.sectionDivider} />
          </View>
        ))}
        <View style={{ height: getCartItemCount() > 0 ? 140 : 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.menuButton}><Menu size={20} color="#FFFFFF" /><Text style={styles.menuButtonText}>Menu</Text></TouchableOpacity>

      <View style={[styles.bottomPromo, { bottom: getCartItemCount() > 0 ? 80 : 0 }]}>
        <Tag size={16} color="#BE185D" />
        <Text style={styles.bottomPromoText}>Get 25% off upto ₹200 for new users</Text>
      </View>

      {getCartItemCount() > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemCount}>{getCartItemCount()} item{getCartItemCount() > 1 ? "s" : ""}</Text>
            <Text style={styles.cartTotal}>₹{getCartTotal()}</Text>
          </View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={() => router.push("/booking/new")}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000000" },
  headerSlot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerSlotText: { fontSize: 12, color: "#BE185D" },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  categoryGridContainer: { backgroundColor: "#FFFFFF", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  categoryGrid: { paddingHorizontal: 12, gap: 8 },
  categoryItem: { width: 85, alignItems: "center", marginHorizontal: 4 },
  categoryImageBox: { width: 75, height: 75, borderRadius: 12, backgroundColor: "#FDF2F8", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "#FECDD3" },
  categoryImageBoxActive: { borderWidth: 2, borderColor: "#BE185D" },
  categoryImage: { width: 75, height: 75 },
  categoryName: { fontSize: 12, fontWeight: "500", color: "#6B7280", textAlign: "center", lineHeight: 15 },
  categoryNameActive: { color: "#BE185D", fontWeight: "600" },
  scrollView: { flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: "#FDF2F8" },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#9D174D", marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#000000" },
  serviceCard: { flexDirection: "row", padding: 16, backgroundColor: "#FFFFFF" },
  serviceInfo: { flex: 1, paddingRight: 12 },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#000000", marginBottom: 6, lineHeight: 22 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  ratingText: { fontSize: 13, color: "#6B7280", textDecorationLine: "underline" },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  price: { fontSize: 14, fontWeight: "600", color: "#000000" },
  originalPrice: { fontSize: 13, color: "#9CA3AF", textDecorationLine: "line-through" },
  duration: { fontSize: 14, color: "#6B7280" },
  viewDetailsBtn: {},
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: "#BE185D" },
  serviceRight: { alignItems: "center", width: 120 },
  serviceImage: { width: 110, height: 90, borderRadius: 8, backgroundColor: "#FDF2F8", marginBottom: 10 },
  addButton: { borderWidth: 1.5, borderColor: "#BE185D", borderRadius: 6, paddingHorizontal: 32, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  addButtonText: { fontSize: 14, fontWeight: "700", color: "#BE185D" },
  quantityControl: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#BE185D", borderRadius: 6, backgroundColor: "#FFFFFF" },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: "#BE185D" },
  qtyValue: { fontSize: 14, fontWeight: "700", color: "#BE185D", minWidth: 24, textAlign: "center" },
  optionsText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  serviceDivider: { height: 1, backgroundColor: "#FECDD3", marginHorizontal: 16 },
  sectionDivider: { height: 8, backgroundColor: "#FDF2F8" },
  menuButton: { position: "absolute", bottom: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 8 },
  menuButtonText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  bottomPromo: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FDF2F8", paddingVertical: 12, paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: "#FECDD3" },
  bottomPromoText: { fontSize: 14, fontWeight: "600", color: "#BE185D" },
  cartBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1F2937", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28 },
  cartInfo: {},
  cartItemCount: { fontSize: 12, color: "#9CA3AF" },
  cartTotal: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  viewCartBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#BE185D", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 4 },
  viewCartText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
